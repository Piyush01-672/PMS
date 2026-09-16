import { Languages } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { useSite, useTerm } from '@/lib/site';
import { cn } from '@/lib/utils';

/** "हिंदी में देखें" / "View in English" quick switch shown on study pages. */
export function LanguageNotice({ className }) {
  const site = useSite();
  const term = useTerm();
  const { lang, setLang } = useLang();
  const settings = site?.settings?.language;
  if (settings?.enableToggle === false || settings?.showLanguageNotice === false) return null;
  const target = lang === 'hi' ? 'en' : 'hi';
  return (
    <button
      type="button"
      onClick={() => setLang(target)}
      className={cn('inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-semibold text-foreground/80 hover:border-brand/40 hover:text-brand', className)}
    >
      <Languages className="size-3.5" aria-hidden="true" />
      {target === 'hi' ? term('viewInHindi') : term('viewInEnglish')}
    </button>
  );
}
