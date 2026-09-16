import { createContext, lazy, Suspense, useCallback, useContext, useMemo, useState } from 'react';
import { imageUrl } from '@/lib/media';
import { cn } from '@/lib/utils';

// The zoom/pinch viewer (and its gesture library) is downloaded only when a student opens an image.
const ImageViewerDialog = lazy(() => import('./ImageViewerDialog.jsx'));

const ViewerContext = createContext({ openViewer: () => {} });
export const useImageViewer = () => useContext(ViewerContext);

export function ImageViewerProvider({ children }) {
  const [state, setState] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const openViewer = useCallback((images, index = 0) => {
    const list = images.filter((img) => img?.src);
    if (!list.length) return;
    setLoaded(true);
    setState({ images: list, index: Math.min(index, list.length - 1) });
  }, []);

  const onIndex = useCallback((index) => setState((s) => (s ? { ...s, index } : s)), []);
  const value = useMemo(() => ({ openViewer }), [openViewer]);

  return (
    <ViewerContext value={value}>
      {children}
      {loaded && (
        <Suspense fallback={null}>
          <ImageViewerDialog state={state} onClose={() => setState(null)} onIndex={onIndex} />
        </Suspense>
      )}
    </ViewerContext>
  );
}

export const toViewerImage = (media, { alt, caption } = {}) => ({
  src: imageUrl(media, 1600),
  alt: alt || media?.title || '',
  caption,
  width: media?.width,
  height: media?.height,
});

export function viewerClass(className) {
  return cn('cursor-zoom-in', className);
}
