import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router';
import { cn } from '@/lib/utils';

export function PageHeader({ title, description, actions, backTo, backLabel = 'Back', className, children }) {
  return (
    <div className={cn('mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        {backTo && (
          <Link to={backTo} className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
            <ChevronLeft className="size-4" /> {backLabel}
          </Link>
        )}
        <h1 className="truncate text-2xl font-extrabold tracking-tight">{title}</h1>
        {description && <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, description, actions, children, className, bodyClassName }) {
  return (
    <section className={cn('rounded-2xl border bg-card', className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3 sm:px-5">
          <div>
            {title && <h2 className="text-sm font-bold">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className={cn('p-4 sm:p-5', bodyClassName)}>{children}</div>
    </section>
  );
}
