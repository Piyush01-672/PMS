import { L10nField, SelectField, TagsField, TextField, TextareaField } from './fields/Fields.jsx';
import { MediaField } from './media/MediaFields.jsx';

export const ROBOTS_OPTIONS = [
  { value: 'index,follow', label: 'Index, follow (recommended)' },
  { value: 'noindex,follow', label: 'Noindex, follow' },
  { value: 'index,nofollow', label: 'Index, nofollow' },
  { value: 'noindex,nofollow', label: 'Noindex, nofollow' },
];

function Counter({ value, max }) {
  const length = (value || '').length;
  return <span className={length > max ? 'text-warning' : 'text-muted-foreground'}>{length}/{max}</span>;
}

/** Per-page SEO controls with a Google-style result preview. Empty fields fall back to automatic values. */
export function SeoFields({ value = {}, onChange, fallbackTitle, fallbackDescription, path }) {
  const set = (patch) => onChange({ ...value, ...patch });
  const title = value.title || fallbackTitle || 'Page title';
  const description = value.description || fallbackDescription || 'Meta description…';
  const origin = typeof window !== 'undefined' ? window.location.host : 'example.com';

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-background p-3" aria-label="Search result preview">
        <p className="truncate text-xs text-success">
          {origin}
          {path || ''}
        </p>
        <p className="truncate text-[17px] leading-snug text-[#1a0dab] dark:text-indigo">{title}</p>
        <p className="line-clamp-2 text-xs text-muted-foreground">{description}</p>
      </div>
      <TextField label="SEO title" hint={<Counter value={value.title} max={60} />} value={value.title} onChange={(v) => set({ title: v })} placeholder={fallbackTitle} />
      <TextareaField label="Meta description" hint={<Counter value={value.description} max={160} />} value={value.description} onChange={(v) => set({ description: v })} placeholder={fallbackDescription} rows={3} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Canonical URL" hint="Leave empty to use this page URL." value={value.canonical} onChange={(v) => set({ canonical: v })} placeholder={path} />
        <SelectField label="Robots" value={value.robots || 'index,follow'} onChange={(v) => set({ robots: v })} options={ROBOTS_OPTIONS} />
      </div>
      <L10nField label="H1 override (optional)" value={value.h1} onChange={(v) => set({ h1: v })} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Open Graph title" value={value.ogTitle} onChange={(v) => set({ ogTitle: v })} />
        <TextField label="Open Graph description" value={value.ogDescription} onChange={(v) => set({ ogDescription: v })} />
      </div>
      <MediaField label="Open Graph image (social sharing)" value={value.ogImage} onChange={(v) => set({ ogImage: v })} />
      <TagsField label="Keywords (English SEO keywords are fine here)" value={value.keywords} onChange={(v) => set({ keywords: v })} />
    </div>
  );
}
