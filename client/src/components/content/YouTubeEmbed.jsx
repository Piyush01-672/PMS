import { Play } from 'lucide-react';
import { useState } from 'react';
import { useL10n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { youTubeEmbed, youTubeThumb } from '@/lib/youtube';

/** Thumbnail-first YouTube player: the iframe loads only after the student presses play (no layout shift). */
export function YouTubeEmbed({ video, title: titleOverride, className, showCaption = true }) {
  const t = useL10n();
  const [playing, setPlaying] = useState(false);
  if (!video?.youtubeId || video.isVisible === false) return null;
  const title = titleOverride || t(video.title) || 'Video';
  const description = t(video.description);

  return (
    <figure className={cn('overflow-hidden rounded-2xl border bg-card', className)}>
      <div className="relative aspect-video w-full bg-black">
        {playing ? (
          <iframe
            src={youTubeEmbed(video.youtubeId)}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 size-full border-0"
          />
        ) : (
          <button type="button" onClick={() => setPlaying(true)} className="group absolute inset-0 size-full" aria-label={`Play video: ${title}`}>
            <img
              src={video.thumbnailUrl || youTubeThumb(video.youtubeId)}
              alt=""
              loading="lazy"
              decoding="async"
              className="size-full object-cover opacity-90 transition group-hover:opacity-100"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <span className="absolute top-1/2 left-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-brand text-white shadow-lg ring-4 ring-white/25 transition group-hover:scale-110">
              <Play className="ml-1 size-7 fill-current" />
            </span>
            <span className="absolute right-4 bottom-3 left-4 line-clamp-2 text-left text-sm font-semibold text-white">{title}</span>
          </button>
        )}
      </div>
      {showCaption && description && <figcaption className="px-4 py-3 text-sm text-muted-foreground">{description}</figcaption>}
    </figure>
  );
}
