import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useState } from 'react';
import { useL10n } from '@/lib/i18n';
import { useSite } from '@/lib/site';
import { cn } from '@/lib/utils';
import { SmartLink } from './SmartLink.jsx';

const VARIANTS = {
  brand: 'bg-gradient-to-r from-brand via-[color-mix(in_oklab,var(--brand)_70%,var(--saffron))] to-saffron text-white',
  info: 'bg-indigo text-white',
  success: 'bg-success text-white',
  warning: 'bg-saffron text-ink',
};

const storageKey = (a) => `pms-announcement-${a._id}-${a.updatedAt}`;

export function AnnouncementBar() {
  const site = useSite();
  const t = useL10n();
  const announcement = site?.announcements?.[0];
  const [dismissed, setDismissed] = useState(() => {
    try {
      return announcement ? sessionStorage.getItem(storageKey(announcement)) === '1' : false;
    } catch {
      return false;
    }
  });

  if (!announcement || site?.settings?.header?.showAnnouncement === false) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(storageKey(announcement), '1');
    } catch {
      /* ignore */
    }
  };

  return (
    <AnimatePresence initial={false}>
      {!dismissed && (
        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
          <div className={cn('relative px-10 py-2 text-center text-xs font-medium sm:text-sm', VARIANTS[announcement.variant] || VARIANTS.brand)}>
            <p className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-2 gap-y-1">
              {t(announcement.badge) && (
                <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase">{t(announcement.badge)}</span>
              )}
              <span>{t(announcement.text)}</span>
              {announcement.linkUrl && t(announcement.linkLabel) && (
                <SmartLink to={announcement.linkUrl} className="font-bold underline underline-offset-4 hover:opacity-90">
                  {t(announcement.linkLabel)} →
                </SmartLink>
              )}
            </p>
            <button type="button" onClick={dismiss} className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 hover:bg-white/15" aria-label="Dismiss announcement">
              <X className="size-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
