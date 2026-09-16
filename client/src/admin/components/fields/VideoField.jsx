import { CirclePlay as Youtube, Loader2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, errorMessage } from '@/lib/api';
import { useL10n } from '@/lib/i18n';
import { extractYouTubeId, youTubeThumb } from '@/lib/youtube';
import { Field, SelectField } from './Fields.jsx';

export const VIDEO_PLACEMENT_OPTIONS = [
  { value: 'afterQuestion', label: 'After the question' },
  { value: 'beforeSolution', label: 'Before the solution' },
  { value: 'afterSolution', label: 'After the solution' },
];

/** Paste a YouTube URL → validated & stored once in the Video library → rendered automatically on the site. */
export function VideoField({ label = 'YouTube video', hint, value, onChange, placement, onPlacementChange }) {
  const t = useL10n();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const video = value && typeof value === 'object' ? value : null;

  const add = async () => {
    setError('');
    if (!extractYouTubeId(url)) {
      setError('Invalid YouTube URL. Use a link like https://www.youtube.com/watch?v=… or https://youtu.be/…');
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post('/videos/resolve', { url });
      onChange(data);
      setUrl('');
    } catch (err) {
      setError(errorMessage(err));
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Field label={label} hint={hint || 'Paste a YouTube link. The player appears exactly where this field is placed.'} error={error}>
      {video ? (
        <div className="flex items-center gap-3 rounded-xl border bg-background p-2">
          <img src={video.thumbnailUrl || youTubeThumb(video.youtubeId, 'mqdefault')} alt="" className="aspect-video w-28 shrink-0 rounded-md object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{t(video.title) || video.youtubeId}</p>
            <a href={video.url} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:underline">
              youtu.be/{video.youtubeId}
            </a>
            {video.isVisible === false && <p className="text-xs font-semibold text-warning">Hidden in Video library</p>}
          </div>
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => onChange(null)} aria-label="Remove video">
            <Trash2 />
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Youtube className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-red-600" aria-hidden="true" />
            <Input
              className="h-9 pl-8"
              placeholder="https://www.youtube.com/watch?v=XXXXXXXXXXX"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  add();
                }
              }}
              aria-invalid={Boolean(error)}
            />
          </div>
          <Button type="button" variant="outline" onClick={add} disabled={busy || !url.trim()}>
            {busy && <Loader2 className="animate-spin" />} Add video
          </Button>
        </div>
      )}
      {onPlacementChange && video && (
        <SelectField className="mt-2" label="Video position" value={placement || 'afterSolution'} onChange={onPlacementChange} options={VIDEO_PLACEMENT_OPTIONS} />
      )}
    </Field>
  );
}
