import { AlertTriangle, CheckCircle2, Info, Lightbulb, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const STYLES = {
  note: { box: 'border-indigo/25 bg-indigo-soft/70', icon: Info, iconClass: 'text-indigo', title: 'text-indigo' },
  tip: { box: 'border-saffron/35 bg-saffron-soft', icon: Lightbulb, iconClass: 'text-warning', title: 'text-warning' },
  warning: { box: 'border-brand/30 bg-brand-soft', icon: AlertTriangle, iconClass: 'text-brand', title: 'text-brand' },
  important: { box: 'border-saffron/40 bg-saffron-soft', icon: Sparkles, iconClass: 'text-warning', title: 'text-warning' },
  answer: { box: 'border-success/35 bg-success-soft', icon: CheckCircle2, iconClass: 'text-success', title: 'text-success' },
};

export function Callout({ variant = 'note', title, action, children, className }) {
  const style = STYLES[variant] || STYLES.note;
  const IconComponent = style.icon;
  return (
    <div className={cn('rounded-xl border-l-4 border p-4', style.box, className)}>
      {(title || action) && (
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className={cn('flex items-center gap-2 text-xs font-extrabold tracking-wide uppercase', style.title)}>
            <IconComponent className={cn('size-4', style.iconClass)} aria-hidden="true" />
            {title}
          </p>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
