import { Outlet, ScrollRestoration } from 'react-router';
import { ThemeProvider } from '@/lib/theme';
import { MotionConfig } from 'framer-motion';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { LanguageProvider } from '@/lib/i18n';
import { SiteProvider, useSite } from '@/lib/site';

function SettingsBridge({ children }) {
  const site = useSite();
  const settings = site?.settings;
  return (
    <ThemeProvider defaultTheme={settings?.theme?.defaultMode || 'light'}>
      <LanguageProvider defaultLang={settings?.language?.default || 'hi'}>{children}</LanguageProvider>
    </ThemeProvider>
  );
}

export default function Root() {
  return (
    <SiteProvider>
      <SettingsBridge>
        <MotionConfig reducedMotion="user">
          <TooltipProvider delayDuration={250}>
            <Outlet />
            <ScrollRestoration getKey={(location) => location.pathname} />
            <Toaster position="top-center" richColors closeButton />
          </TooltipProvider>
        </MotionConfig>
      </SettingsBridge>
    </SiteProvider>
  );
}
