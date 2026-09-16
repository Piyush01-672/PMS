import { useTerm } from '@/lib/site';
import { cn } from '@/lib/utils';

const DIFFICULTY_STYLES = {
  easy: 'bg-success-soft text-success ring-success/20',
  medium: 'bg-warning-soft text-warning ring-warning/20',
  hard: 'bg-brand-soft text-brand ring-brand/20',
};

export function DifficultyBadge({ difficulty, className }) {
  const term = useTerm();
  if (!difficulty) return null;
  return (
    <span className={cn('inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-bold ring-1', DIFFICULTY_STYLES[difficulty], className)}>
      {term(difficulty)}
    </span>
  );
}

export function Chip({ children, className, tone = 'muted' }) {
  const tones = {
    muted: 'bg-muted text-muted-foreground',
    brand: 'bg-brand-soft text-brand',
    indigo: 'bg-indigo-soft text-indigo',
    saffron: 'bg-saffron-soft text-warning',
    white: 'bg-white/15 text-white',
  };
  return <span className={cn('inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-[11px] font-semibold', tones[tone], className)}>{children}</span>;
}
