import { CheckCircle2, Clock, ExternalLink, Play, User, Video as VideoIcon } from 'lucide-react';
import { useState } from 'react';
import { useL10n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { extractYouTubeId, youTubeEmbed, youTubeThumb } from '@/lib/youtube';

function formatDuration(secs) {
  if (!secs || isNaN(secs)) return '';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function VideoPlayer({ video, playlist = [], activeIndex = 0, onSelectVideo, className }) {
  const t = useL10n();
  const [isPlaying, setIsPlaying] = useState(false);
  const [localActiveIndex, setLocalActiveIndex] = useState(activeIndex);

  const currentVideo = playlist.length > 0 ? playlist[localActiveIndex] || video : video;
  if (!currentVideo) return null;

  const rawUrl = currentVideo.url || '';
  const ytId = currentVideo.youtubeId || extractYouTubeId(rawUrl);
  const title = t(currentVideo.title) || 'Video Lesson';
  const description = t(currentVideo.description);
  const isYouTube = Boolean(ytId) || currentVideo.provider === 'youtube';
  const isVimeo = rawUrl.includes('vimeo.com');
  const vimeoId = isVimeo ? rawUrl.split('/').filter(Boolean).pop() : null;

  const thumbnail = currentVideo.thumbnailUrl || (ytId ? youTubeThumb(ytId) : '');
  const duration = currentVideo.duration || (currentVideo.durationSecs ? formatDuration(currentVideo.durationSecs) : '');

  const handleSelect = (idx) => {
    setLocalActiveIndex(idx);
    setIsPlaying(true);
    if (onSelectVideo) onSelectVideo(idx, playlist[idx]);
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        {/* Video Screen */}
        <div className="relative aspect-video w-full bg-slate-950">
          {isPlaying ? (
            isYouTube && ytId ? (
              <iframe
                src={youTubeEmbed(ytId)}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                className="absolute inset-0 size-full border-0"
              />
            ) : isVimeo && vimeoId ? (
              <iframe
                src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1`}
                title={title}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 size-full border-0"
              />
            ) : (
              <video
                src={rawUrl}
                controls
                autoPlay
                playsInline
                poster={thumbnail}
                className="absolute inset-0 size-full object-contain"
              >
                Your browser does not support HTML5 video.
              </video>
            )
          ) : (
            <button
              type="button"
              onClick={() => setIsPlaying(true)}
              className="group relative flex size-full items-center justify-center focus:outline-none"
              aria-label={`Play video: ${title}`}
            >
              {thumbnail ? (
                <img
                  src={thumbnail}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover opacity-90 transition-all duration-300 group-hover:scale-[1.02] group-hover:opacity-100"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950">
                  <VideoIcon className="size-16 text-slate-700" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="relative z-10 flex flex-col items-center gap-3">
                <span className="grid size-16 place-items-center rounded-full bg-brand text-white shadow-xl ring-4 ring-white/30 transition-transform duration-200 group-hover:scale-110">
                  <Play className="ml-1 size-8 fill-current" />
                </span>
                <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                  Click to Watch Video
                </span>
              </div>
              <div className="absolute right-4 bottom-3 left-4 text-left">
                <p className="line-clamp-1 font-heading text-base font-bold text-white drop-shadow-sm">{title}</p>
                {duration && <p className="text-xs text-white/80">{duration}</p>}
              </div>
            </button>
          )}
        </div>

        {/* Video Meta Info */}
        <div className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-heading text-lg font-bold text-foreground sm:text-xl">{title}</h3>
            {duration && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                <Clock className="size-3.5" />
                {duration}
              </span>
            )}
          </div>
          {description && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>}
        </div>
      </div>

      {/* Playlist Grid / List if multiple videos exist */}
      {playlist.length > 1 && (
        <div className="rounded-2xl border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="font-heading text-sm font-bold text-foreground">
              Video Playlist ({playlist.length} Lessons)
            </h4>
            <span className="text-xs text-muted-foreground">
              Lesson {localActiveIndex + 1} of {playlist.length}
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {playlist.map((item, idx) => {
              const itemTitle = t(item.title) || `Lesson ${idx + 1}`;
              const itemYt = item.youtubeId || extractYouTubeId(item.url);
              const itemThumb = item.thumbnailUrl || (itemYt ? youTubeThumb(itemYt) : '');
              const itemDur = item.duration || (item.durationSecs ? formatDuration(item.durationSecs) : '');
              const isActive = idx === localActiveIndex;

              return (
                <button
                  key={item._id || idx}
                  type="button"
                  onClick={() => handleSelect(idx)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border p-2.5 text-left transition-all hover:bg-muted/70',
                    isActive
                      ? 'border-brand/40 bg-brand-soft font-semibold text-brand ring-1 ring-brand/20'
                      : 'border-border/60 bg-background text-foreground',
                  )}
                >
                  <div className="relative aspect-video w-20 shrink-0 overflow-hidden rounded-lg bg-slate-900">
                    {itemThumb ? (
                      <img src={itemThumb} alt="" className="size-full object-cover" />
                    ) : (
                      <div className="grid size-full place-items-center bg-muted text-muted-foreground">
                        <VideoIcon className="size-5" />
                      </div>
                    )}
                    <span className="absolute inset-0 grid place-items-center bg-black/30">
                      <Play className="size-4 fill-white text-white" />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold leading-tight">
                      {idx + 1}. {itemTitle}
                    </p>
                    {itemDur && <p className="mt-1 text-[11px] text-muted-foreground">{itemDur}</p>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
