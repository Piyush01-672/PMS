import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Maximize, Minimize, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import { TransformComponent, TransformWrapper, useControls } from 'react-zoom-pan-pinch';

function ToolbarButton({ label, children, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="grid size-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-30"
      {...props}
    >
      {children}
    </button>
  );
}

function ZoomControls({ fullscreen, onFullscreen }) {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '+' || e.key === '=') zoomIn();
      if (e.key === '-') zoomOut();
      if (e.key === '0') resetTransform();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoomIn, zoomOut, resetTransform]);
  return (
    <div className="flex items-center gap-2">
      <ToolbarButton label="Zoom in" onClick={() => zoomIn()}>
        <ZoomIn className="size-5" />
      </ToolbarButton>
      <ToolbarButton label="Zoom out" onClick={() => zoomOut()}>
        <ZoomOut className="size-5" />
      </ToolbarButton>
      <ToolbarButton label="Reset zoom" onClick={() => resetTransform()}>
        <RotateCcw className="size-5" />
      </ToolbarButton>
      <ToolbarButton label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'} onClick={onFullscreen}>
        {fullscreen ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
      </ToolbarButton>
    </div>
  );
}

/** Zoom / pinch / fullscreen / next-previous image viewer. Loaded only when a student first opens an image. */
export default function ImageViewerDialog({ state, onClose, onIndex }) {
  const containerRef = useRef(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [direction, setDirection] = useState(0);
  const images = state?.images || [];
  const index = state?.index ?? 0;
  const current = images[index];

  const go = useCallback(
    (step) => {
      if (images.length < 2) return;
      setDirection(step);
      onIndex((index + step + images.length) % images.length);
    },
    [images.length, index, onIndex],
  );

  useEffect(() => {
    if (!state) return undefined;
    const onKey = (e) => {
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    window.addEventListener('keydown', onKey);
    document.addEventListener('fullscreenchange', onFs);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('fullscreenchange', onFs);
    };
  }, [state, go]);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await containerRef.current?.requestFullscreen?.();
    } catch {
      /* not supported (e.g. iOS Safari) */
    }
  };

  return (
    <DialogPrimitive.Root open={Boolean(state)} onOpenChange={(open) => !open && onClose()}>
      {state && current && (
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay asChild>
            <motion.div className="fixed inset-0 z-[70] bg-black/90" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          </DialogPrimitive.Overlay>
          <DialogPrimitive.Content asChild aria-describedby={undefined}>
            <motion.div
              ref={containerRef}
              className="fixed inset-0 z-[70] flex flex-col bg-black/90 outline-none"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.18 }}
            >
                <DialogPrimitive.Title className="sr-only">{current.alt || 'Image viewer'}</DialogPrimitive.Title>
                <TransformWrapper key={index} initialScale={1} minScale={1} maxScale={6} centerOnInit wheel={{ step: 0.2 }} doubleClick={{ mode: 'toggle', step: 1.5 }}>
                  <div className="flex items-center justify-between gap-3 p-3 sm:p-4">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white" aria-live="polite">
                      {index + 1} / {images.length}
                    </span>
                    <ZoomControls fullscreen={fullscreen} onFullscreen={toggleFullscreen} />
                    <DialogPrimitive.Close asChild>
                      <ToolbarButton label="Close image viewer">
                        <X className="size-5" />
                      </ToolbarButton>
                    </DialogPrimitive.Close>
                  </div>

                  <div className="relative min-h-0 flex-1 touch-none">
                    <AnimatePresence mode="popLayout" custom={direction} initial={false}>
                      <motion.div
                        key={current.src}
                        custom={direction}
                        initial={{ opacity: 0, x: direction * 60 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: direction * -60 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0"
                      >
                        <TransformComponent wrapperClass="!size-full" contentClass="!size-full flex items-center justify-center">
                          <img src={current.src} alt={current.alt || ''} className="max-h-full max-w-full rounded-md bg-white object-contain p-1 select-none" draggable={false} />
                        </TransformComponent>
                      </motion.div>
                    </AnimatePresence>

                    {images.length > 1 && (
                      <>
                        <button type="button" onClick={() => go(-1)} aria-label="Previous image" className="absolute top-1/2 left-2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25 sm:left-4">
                          <ChevronLeft className="size-6" />
                        </button>
                        <button type="button" onClick={() => go(1)} aria-label="Next image" className="absolute top-1/2 right-2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25 sm:right-4">
                          <ChevronRight className="size-6" />
                        </button>
                      </>
                    )}
                  </div>
                </TransformWrapper>

                {(current.caption || current.alt) && <p className="mx-auto max-w-3xl px-4 py-3 text-center text-sm text-white/85">{current.caption || current.alt}</p>}
                <p className="pb-3 text-center text-[11px] text-white/45">Pinch or double-tap to zoom · दो उँगलियों से ज़ूम करें</p>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
    </DialogPrimitive.Root>
  );
}
