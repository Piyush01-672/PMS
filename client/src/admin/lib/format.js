export const formatDate = (value, options = { dateStyle: 'medium', timeStyle: 'short' }) =>
  value ? new Intl.DateTimeFormat('en-IN', options).format(new Date(value)) : '—';

export function timeAgo(value) {
  if (!value) return '—';
  const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [unit, size] of units) if (Math.abs(seconds) >= size) return rtf.format(-Math.round(seconds / size), unit);
  return 'just now';
}

export function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return `${value.toFixed(value < 10 && i ? 1 : 0)} ${units[i]}`;
}

/** Best label for any document (localized title/name → number → email). */
export function docLabel(doc, fallback = 'Untitled') {
  if (!doc) return fallback;
  const pick = (v) => (v && typeof v === 'object' ? v.en || v.hi || v.mixed : v);
  return pick(doc.title) || pick(doc.name) || doc.email || doc.originalName || (doc.number !== undefined ? `#${doc.number}` : '') || fallback;
}

export const stripTags = (html) => String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
