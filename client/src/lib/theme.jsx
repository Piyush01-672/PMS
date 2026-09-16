import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react';

// Must match public/theme-init.js, which applies the saved theme before React loads.
const STORAGE_KEY = 'pms-theme';
const THEMES = ['light', 'dark', 'system'];

const ThemeContext = createContext({ theme: 'light', resolvedTheme: 'light', setTheme: () => {} });
const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)');

function readStoredTheme() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return THEMES.includes(value) ? value : null;
  } catch {
    return null;
  }
}

/** Light / dark / system theme. The student's choice wins over the admin default (Website Settings → Theme). */
export function ThemeProvider({ defaultTheme = 'light', children }) {
  const [stored, setStored] = useState(readStoredTheme);
  const [systemDark, setSystemDark] = useState(() => darkQuery().matches);
  const theme = stored || (THEMES.includes(defaultTheme) ? defaultTheme : 'light');
  const resolvedTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;

  useEffect(() => {
    const query = darkQuery();
    const onChange = (event) => setSystemDark(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', resolvedTheme === 'dark');
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  const setTheme = useCallback((next) => {
    // Switch instantly instead of animating every colour transition on the page.
    const style = document.createElement('style');
    style.textContent = '*,*::before,*::after{transition:none!important}';
    document.head.appendChild(style);
    setStored(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private mode */
    }
    requestAnimationFrame(() => requestAnimationFrame(() => style.remove()));
  }, []);

  const value = useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme, setTheme]);
  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export const useTheme = () => useContext(ThemeContext);
