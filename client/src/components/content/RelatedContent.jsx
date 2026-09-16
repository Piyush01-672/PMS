import { ArrowRight, BookOpen, CircleHelp, FileText, Link2, ListOrdered, Star } from 'lucide-react';
import { useL10n } from '@/lib/i18n';
import { useTerm } from '@/lib/site';
import { SmartLink } from '@/components/site/SmartLink.jsx';

const ICONS = { chapter: BookOpen, exercise: ListOrdered, question: CircleHelp, note: FileText, importantQuestion: Star, page: FileText, url: Link2 };

export function RelatedContent({ items, title }) {
  const t = useL10n();
  const term = useTerm();
  if (!items?.length) return null;
  return (
    <section aria-labelledby="related-heading" className="mt-12">
      <h2 id="related-heading" className="mb-4 text-xl font-bold">
        {title || term('related')}
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const IconComponent = ICONS[item.type] || Link2;
          return (
            <li key={item.url}>
              <SmartLink to={item.url} className="group flex h-full items-start gap-3 rounded-xl border bg-card p-4 transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                  <IconComponent className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold group-hover:text-brand">{t(item.title)}</span>
                  {item.subtitle && <span className="mt-0.5 block text-xs text-muted-foreground">{t(item.subtitle)}</span>}
                </span>
                <ArrowRight className="mt-1 size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-brand" aria-hidden="true" />
              </SmartLink>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
