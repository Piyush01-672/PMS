import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'pms-lang';
const LanguageContext = createContext({ lang: 'hi', setLang: () => { } });

function readStoredLang() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'hi' || value === 'en' ? value : null;
  } catch {
    return null;
  }
}

export function LanguageProvider({ defaultLang = 'hi', children }) {
  const [stored, setStored] = useState(readStoredLang);
  const lang = stored || defaultLang;

  const setLang = useCallback((next) => {
    setStored(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private mode */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);
  return <LanguageContext value={value}>{children}</LanguageContext>;
}

export const useLang = () => useContext(LanguageContext);

const stripTags = (html) => String(html || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

export function hasContent(value) {
  if (!value) return false;
  if (typeof value === 'string') return stripTags(value).length > 0 || /<img|<table/i.test(value);
  return ['hi', 'en', 'mixed'].some((k) => hasContent(value[k]));
}

/**
 * Picks the right text for the student's language without destroying mixed Hindi-English content.
 *  - mode "mixed": always show the mixed version (falls back to whatever exists)
 *  - mode "hi"/"en": content exists only in that language
 *  - mode "auto": follow the हिंदी / ENG switch, fall back to the other language when missing
 */
export function pickL10n(value, lang, mode = 'auto') {
  if (!value) return '';
  if (typeof value === 'string') return value;
  const ok = (v) => (hasContent(v) ? v : '');
  const hi = ok(value.hi);
  const en = ok(value.en);
  const mixed = ok(value.mixed);
  if (mode === 'mixed') return mixed || (lang === 'hi' ? hi || en : en || hi);
  if (mode === 'hi') return hi || mixed || en;
  if (mode === 'en') return en || mixed || hi;
  return lang === 'hi' ? hi || mixed || en : en || mixed || hi;
}

/** Which languages a localized value is available in (for "हिंदी में देखें / View in English"). */
export function availableLanguages(value) {
  if (!value || typeof value === 'string') return [];
  return ['hi', 'en'].filter((k) => hasContent(value[k]));
}

export function useL10n() {
  const { lang } = useLang();
  return useCallback((value, mode) => pickL10n(value, lang, mode), [lang]);
}
