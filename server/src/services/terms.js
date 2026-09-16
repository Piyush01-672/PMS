import { cache } from '../lib/cache.js';
import { DEFAULT_TERMINOLOGY, SiteSettings } from '../models/SiteSettings.js';

export async function getTerms() {
  return cache.wrap('terms', 5 * 60_000, async () => {
    const settings = await SiteSettings.getSingleton();
    const map = {};
    for (const t of DEFAULT_TERMINOLOGY) map[t.key] = { hi: t.hi, en: t.en };
    for (const t of settings.terminology || []) {
      map[t.key] = { hi: t.hi || map[t.key]?.hi || t.key, en: t.en || map[t.key]?.en || t.key };
    }
    return map;
  });
}

export function term(terms, key, suffix = '') {
  const base = terms[key] || { hi: key, en: key };
  const tail = suffix === '' || suffix === undefined || suffix === null ? '' : ` ${suffix}`;
  return { hi: `${base.hi}${tail}`, en: `${base.en}${tail}` };
}

export function pick(value, lang = 'en') {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return lang === 'hi' ? value.hi || value.en || value.mixed || '' : value.en || value.hi || value.mixed || '';
}
