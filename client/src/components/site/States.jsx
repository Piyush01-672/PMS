import { AlertTriangle, FileSearch, RefreshCw } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

export function EmptyState({ icon: IconComponent = FileSearch, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card px-6 py-12 text-center', className)}>
      <span className="mb-4 grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
        <IconComponent className="size-6" aria-hidden="true" />
      </span>
      <h3 className="text-base font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, title = 'Something went wrong', className }) {
  return (
    <div role="alert" className={cn('flex flex-col items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center', className)}>
      <AlertTriangle className="mb-3 size-8 text-destructive" aria-hidden="true" />
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{errorMessage(error)}</p>
      {onRetry && (
        <Button variant="outline" size="lg" className="mt-5" onClick={() => onRetry()}>
          <RefreshCw /> Try again / फिर से कोशिश करें
        </Button>
      )}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="container-page py-8" aria-busy="true" aria-label="Loading">
      <Skeleton className="mb-4 h-4 w-72 max-w-full" />
      <Skeleton className="mb-3 h-9 w-[28rem] max-w-full" />
      <Skeleton className="mb-8 h-5 w-96 max-w-full" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export function NotFoundContent() {
  return (
    <div className="container-page flex flex-col items-center py-20 text-center">
      <p className="font-heading text-7xl font-extrabold text-brand/20">404</p>
      <h1 className="mt-2 text-2xl font-bold">पेज नहीं मिला · Page not found</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        यह पेज हटा दिया गया है या लिंक गलत है। The page may have moved or the link is incorrect.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg">
          <Link to="/">Home / होम</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/search">Search / खोजें</Link>
        </Button>
      </div>
    </div>
  );
}
