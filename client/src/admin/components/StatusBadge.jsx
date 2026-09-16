import { cn } from '@/lib/utils';

export function effectiveStatus(doc) {
  if (!doc?.status) return null;
  if (doc.status === 'published' && doc.publishedAt && new Date(doc.publishedAt) > new Date()) return 'scheduled';
  if (doc.status === 'published' && doc.isVisible === false) return 'hidden';
  return doc.status;
}

const STYLES = {
  published: 'bg-success-soft text-success ring-success/25',
  draft: 'bg-muted text-muted-foreground ring-border',
  scheduled: 'bg-warning-soft text-warning ring-warning/25',
  archived: 'bg-slate-100 text-slate-500 ring-slate-200 dark:bg-slate-800 dark:text-slate-400',
  hidden: 'bg-indigo-soft text-indigo ring-indigo/20',
};

const LABELS = { published: 'Published', draft: 'Draft', scheduled: 'Scheduled', archived: 'Archived', hidden: 'Hidden' };

export function StatusBadge({ doc, status: statusOverride, className }) {
  const status = statusOverride || effectiveStatus(doc);
  if (!status) return null;
  return (
    <span className={cn('inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-bold ring-1', STYLES[status], className)}>
      <span className={cn('size-1.5 rounded-full bg-current')} aria-hidden="true" />
      {LABELS[status]}
    </span>
  );
}
