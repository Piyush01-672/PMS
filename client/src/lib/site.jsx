import { createContext, useCallback, useContext, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from './api';
import { useLang } from './i18n';

const SiteContext = createContext(null);

export const siteQuery = { queryKey: ['site'], queryFn: () => get('/public/site'), staleTime: 60_000 };

export function SiteProvider({ children }) {
  const query = useQuery(siteQuery);
  const theme = query.data?.settings?.theme;

  useEffect(() => {
    if (!theme) return;
    const root = document.documentElement.style;
    if (theme.brandColor) root.setProperty('--brand', theme.brandColor);
    if (theme.accentColor) root.setProperty('--saffron', theme.accentColor);
    if (theme.inkColor) root.setProperty('--ink', theme.inkColor);
  }, [theme]);

  return <SiteContext value={query}>{children}</SiteContext>;
}

export function useSiteQuery() {
  return useContext(SiteContext);
}

export function useSite() {
  return useContext(SiteContext)?.data;
}

/** Admin-configurable frontend terminology, e.g. term('chapter', 5) → "अध्याय 5". */
export function useTerm() {
  const site = useSite();
  const { lang } = useLang();
  return useCallback(
    (key, suffix) => {
      const entry = site?.terms?.[key];
      const base = entry ? (lang === 'hi' ? entry.hi || entry.en : entry.en || entry.hi) : key;
      return suffix === undefined || suffix === null || suffix === '' ? base : `${base} ${suffix}`;
    },
    [site, lang],
  );
}

export function useBrand() {
  const site = useSite();
  const brand = site?.settings?.brand || {};
  return {
    ...brand,
    logoSrc: brand.logo?.url || brand.logoUrl || '/brand/pms-logo.png',
    footerLogoSrc: brand.footerLogo?.url || brand.logo?.url || brand.logoUrl || '/brand/pms-logo.png',
  };
}
