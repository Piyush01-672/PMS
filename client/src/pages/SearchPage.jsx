import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ArrowRight, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { MathFormula } from '@/components/content/MathFormula.jsx';
import { RESULT_META, resultContext } from '@/components/site/SearchBar.jsx';
import { Seo } from '@/components/site/Seo.jsx';
import { EmptyState, ErrorState } from '@/components/site/States.jsx';
import { get } from '@/lib/api';
import { useL10n } from '@/lib/i18n';
import { useSite, useTerm } from '@/lib/site';
import { cn } from '@/lib/utils';

const TYPES = ['class', 'chapter', 'exercise', 'question', 'formula', 'note', 'importantQuestion'];

function Highlight({ text, terms }) {
  if (!text) return null;
  const words = (terms || []).filter(Boolean).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!words.length) return text;
  const parts = text.split(new RegExp(`(${words.join('|')})`, 'gi'));
  return parts.map((part, i) => (i % 2 ? <mark key={i} className="rounded bg-saffron-soft px-0.5 text-foreground">{part}</mark> : part));
}

export default function SearchPage() {
  const site = useSite();
  const t = useL10n();
  const term = useTerm();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const type = params.get('type') || '';
  const classNumber = params.get('class') || '';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const [input, setInput] = useState(q);
  useEffect(() => setInput(q), [q]);

  const search = useQuery({
    queryKey: ['search', q, type, classNumber, page],
    queryFn: () => get('/public/search', { q, type: type || undefined, class: classNumber || undefined, page }),
    enabled: q.trim().length > 0,
    placeholderData: keepPreviousData,
  });

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
    if (!('page' in changes)) next.delete('page');
    setParams(next);
  };

  const classes = [...(site?.classes || [])].sort((a, b) => a.number - b.number);
  const data = search.data;

  return (
    <>
      <Seo title={q ? `${term('search')}: ${q}` : term('search')} robots="noindex,follow" canonical="/search" />
      <section className="border-b bg-gradient-to-b from-brand-soft/40 to-background">
        <div className="container-page max-w-4xl py-8 sm:py-10">
          <h1 className="mb-4 text-2xl font-extrabold sm:text-3xl">{term('search')}</h1>
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              update({ q: input.trim() });
            }}
            className="flex gap-2"
          >
            <label className="relative flex-1">
              <span className="sr-only">{term('search')}</span>
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                type="search"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                autoFocus={!q}
                placeholder={t(site?.settings?.header?.searchPlaceholder) || term('search')}
                className="h-12 w-full rounded-xl border bg-card pr-3 pl-11 text-base outline-none focus:border-brand/50 focus:ring-3 focus:ring-brand/15"
              />
            </label>
            <Button type="submit" size="lg" className="h-12 rounded-xl px-5">
              {term('search')}
            </Button>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {['', ...TYPES].map((value) => (
              <button
                key={value || 'all'}
                type="button"
                onClick={() => update({ type: value })}
                aria-pressed={type === value}
                className={cn('rounded-full border px-3 py-1 text-xs font-semibold transition', type === value ? 'border-brand bg-brand text-brand-foreground' : 'bg-card hover:border-brand/40')}
              >
                {value ? term(RESULT_META[value]?.term || value) : 'All / सभी'}
              </button>
            ))}
            <select
              value={classNumber}
              onChange={(e) => update({ class: e.target.value })}
              aria-label={term('class')}
              className="h-7 rounded-full border bg-card px-3 text-xs font-semibold"
            >
              <option value="">{term('class')}: All</option>
              {classes.map((c) => (
                <option key={c._id} value={c.number}>
                  {term('class')} {c.number}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <div className="container-page max-w-4xl py-8" aria-live="polite">
        {!q && <EmptyState icon={Search} title={term('search')} description="Class 9 Maths · अध्याय 5 · प्रश्नावली 5.2 · Triangle · त्रिभुज · Formula" />}
        {q && search.isError && <ErrorState error={search.error} onRetry={search.refetch} />}
        {q && search.isPending && <p className="text-sm text-muted-foreground">…</p>}
        {data && (
          <>
            <p className={cn('mb-4 text-sm text-muted-foreground', search.isFetching && 'opacity-60')}>
              {data.total} results · “{q}”
            </p>
            {data.results.length === 0 ? (
              <EmptyState title={term('noResults')} description="Try: Class 10 Ex 5.2, समांतर, triangle, formula" />
            ) : (
              <ul className="space-y-3">
                {data.results.map((result) => {
                  const meta = RESULT_META[result.type] || RESULT_META.page;
                  const IconComponent = meta.icon;
                  return (
                    <li key={`${result.type}-${result.id}`}>
                      <Link to={result.url} className="group flex gap-4 rounded-2xl border bg-card p-4 transition hover:border-brand/40 hover:shadow-md">
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                          <IconComponent className="size-5" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="mb-0.5 flex flex-wrap items-center gap-2">
                            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-muted-foreground uppercase">{term(meta.term)}</span>
                            <span className="text-xs text-muted-foreground">{resultContext(result, t)}</span>
                          </span>
                          <span className="block font-semibold group-hover:text-brand">
                            {t(result.title)}
                            {result.subtitle && <span className="font-normal text-muted-foreground"> · {t(result.subtitle)}</span>}
                          </span>
                          {result.latex && <MathFormula latex={result.latex} className="mt-1 text-left" />}
                          {result.snippet && (
                            <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">
                              <Highlight text={result.snippet} terms={data.query?.terms} />
                            </span>
                          )}
                        </span>
                        <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground group-hover:text-brand" aria-hidden="true" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
            {data.pages > 1 && (
              <nav aria-label="Pagination" className="mt-6 flex items-center justify-center gap-3">
                <Button variant="outline" size="lg" disabled={page <= 1} onClick={() => update({ page: String(page - 1) })}>
                  {term('previous')}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {page} / {data.pages}
                </span>
                <Button variant="outline" size="lg" disabled={page >= data.pages} onClick={() => update({ page: String(page + 1) })}>
                  {term('next')}
                </Button>
              </nav>
            )}
          </>
        )}
      </div>
    </>
  );
}
