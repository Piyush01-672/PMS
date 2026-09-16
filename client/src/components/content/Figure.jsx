import { Maximize2 } from 'lucide-react';
import { aspectRatio, imageSrcSet, imageUrl } from '@/lib/media';
import { cn } from '@/lib/utils';

/** Responsive, never-cropped image. Click opens the zoomable viewer. */
export function Figure({ media, alt, caption, label, onOpen, className, sizes = '(min-width: 1024px) 760px, 100vw', priority = false }) {
  if (!media?.url) return null;
  return (
    <figure className={cn('group', className)}>
      <button
        type="button"
        onClick={onOpen}
        className="relative block w-full cursor-zoom-in overflow-hidden rounded-xl border bg-white p-2 transition-shadow hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-label={`Open image: ${alt || caption || 'figure'}`}
      >
        {label && (
          <span className="absolute top-2 left-2 z-10 rounded-full bg-ink/85 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">{label}</span>
        )}
        <img
          src={imageUrl(media, 960)}
          srcSet={imageSrcSet(media)}
          sizes={imageSrcSet(media) ? sizes : undefined}
          alt={alt || ''}
          width={media.width || undefined}
          height={media.height || undefined}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          style={{ aspectRatio: aspectRatio(media) }}
          className="mx-auto h-auto max-h-[70vh] w-auto max-w-full object-contain"
        />
        <span className="absolute right-2 bottom-2 grid size-8 place-items-center rounded-full bg-ink/75 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <Maximize2 className="size-4" aria-hidden="true" />
        </span>
      </button>
      {caption && <figcaption className="mt-2 text-center text-sm text-muted-foreground">{caption}</figcaption>}
    </figure>
  );
}
