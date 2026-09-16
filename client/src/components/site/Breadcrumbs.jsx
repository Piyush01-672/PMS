import { Home } from 'lucide-react';
import { Fragment } from 'react';
import { Link } from 'react-router';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useL10n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/** Breadcrumbs always come from database relationships (API "breadcrumbs" array). */
export function Breadcrumbs({ items, className }) {
  const t = useL10n();
  if (!items?.length) return null;
  return (
    <Breadcrumb className={cn('-mx-1 overflow-x-auto px-1 pb-1', className)}>
      <BreadcrumbList className="flex-nowrap text-[13px] whitespace-nowrap">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <Fragment key={`${item.url}-${index}`}>
              <BreadcrumbItem>
                {last ? (
                  <BreadcrumbPage className="font-semibold">{t(item.label)}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={item.url} className="inline-flex items-center gap-1 hover:text-brand">
                      {index === 0 && <Home className="size-3.5" aria-hidden="true" />}
                      {t(item.label)}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!last && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
