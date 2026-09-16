import { stripTags } from '../lib/format.js';

/** Hindi on top, English below — used in admin tables. */
export function LocalizedCell({ value, html = false, max = 90 }) {
  const clean = (text) => (html ? stripTags(text) : text || '').slice(0, max);
  const hi = clean(value?.hi);
  const en = clean(value?.en);
  const mixed = clean(value?.mixed);
  return (
    <div className="min-w-0 max-w-md">
      <p className="truncate font-semibold">{hi || mixed || en || '—'}</p>
      {en && (hi || mixed) && <p className="truncate text-xs text-muted-foreground">{en}</p>}
    </div>
  );
}
