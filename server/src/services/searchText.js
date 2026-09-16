import { stripHtml } from '../lib/sanitize.js';

export function l10nText(value) {
  if (!value) return '';
  return [value.hi, value.en, value.mixed].filter(Boolean).map(stripHtml).join(' ');
}

export function joinSearch(...parts) {
  return parts
    .flat(Infinity)
    .filter((p) => p !== undefined && p !== null && p !== '')
    .map(String)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 30_000);
}

export const labels = {
  class: (n) => (n ? `class ${n} कक्षा ${n}` : ''),
  chapter: (n) => (n ? `chapter ${n} अध्याय ${n} ch ${n}` : ''),
  exercise: (n) => (n ? `exercise ${n} प्रश्नावली ${n} ex ${n}` : ''),
  question: (n) => (n ? `question ${n} प्रश्न ${n} q${n} q ${n}` : ''),
};

export function blocksText(blocks = []) {
  return blocks.map((b) => joinSearch(l10nText(b.title), l10nText(b.content), b.latex));
}
