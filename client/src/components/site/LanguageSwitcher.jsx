import { motion } from 'framer-motion';
import { useId } from 'react';
import { useLang } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const OPTIONS = [
  { value: 'hi', label: 'हिंदी', aria: 'हिंदी में देखें' },
  { value: 'en', label: 'ENG', aria: 'View in English' },
];

export function LanguageSwitcher({ className }) {
  const { lang, setLang } = useLang();
  const layoutId = useId();
  return (
    <div role="group" aria-label="Language / भाषा" className={cn('relative flex items-center rounded-full bg-muted p-1 text-xs font-bold', className)}>
      {OPTIONS.map((option) => {
        const active = lang === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            aria-label={option.aria}
            onClick={() => setLang(option.value)}
            className={cn('relative z-10 rounded-full px-3 py-1.5 transition-colors', active ? 'text-brand' : 'text-muted-foreground hover:text-foreground')}
          >
            {active && (
              <motion.span
                layoutId={`lang-pill-${layoutId}`}
                className="absolute inset-0 -z-10 rounded-full bg-background shadow-sm ring-1 ring-black/5"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
