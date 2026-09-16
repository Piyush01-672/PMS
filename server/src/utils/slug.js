// Slugs are ASCII (SEO-friendly transliterated keywords are typed by the admin when needed).
export function slugify(input, fallback = 'item') {
  const slug = String(input ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\./g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
  return slug || fallback;
}

// Segments under /:class/:subject/ that can never be used as a chapter slug.
export const RESERVED_SUBJECT_SEGMENTS = new Set([
  'notes',
  'important-questions',
  'prashnavali',
  'adhyay',
  'search',
]);

export function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
