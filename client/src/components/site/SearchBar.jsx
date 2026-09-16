import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, BookOpen, CircleHelp, FileText, GraduationCap, ListOrdered, Loader2, Search, Sigma, Star, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { get } from '@/lib/api';
import { useL10n } from '@/lib/i18n';
import { useSite, useTerm } from '@/lib/site';
import { cn } from '@/lib/utils';

export const RESULT_META = {
  class: { icon: GraduationCap, term: 'class' },
  chapter: { icon: BookOpen, term: 'chapter' },
  exercise: { icon: ListOrdered, term: 'exercise' },
  question: { icon: CircleHelp, term: 'question' },
  solution: { icon: CircleHelp, term: 'solution' },
  formula: { icon: Sigma, term: 'formula' },
  note: { icon: FileText, term: 'notes' },
  importantQuestion: { icon: Star, term: 'importantQuestions' },
  page: { icon: FileText, term: 'page' },
};

function useDebounced(value, delay = 220) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function resultContext(result, t) {
  return [result.class?.label, result.chapter?.label, result.exercise?.label].filter(Boolean).map((l) => t(l)).join(' · ');
}

export function SearchBar({ className, autoFocus = false, onNavigate, size = 'md', placeholder: placeholderOverride }) {
  const site = useSite();
  const t = useL10n();
  const term = useTerm();
  const navigate = useNavigate();
  const listId = useId();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const debounced = useDebounced(query.trim());

  const suggestions = useQuery({
    queryKey: ['suggest', debounced],
    queryFn: () => get('/public/suggest', { q: debounced }),
    enabled: debounced.length >= 2,
    staleTime: 60_000,
  });
  const results = debounced.length >= 2 ? suggestions.data?.results || [] : [];

  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const go = (url) => {
    setOpen(false);
    setQuery('');
    onNavigate?.();
    navigate(url);
  };

  const submit = (event) => {
    event.preventDefault();
    if (active >= 0 && results[active]) return go(results[active].url);
    if (query.trim()) go(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const onKeyDown = (event) => {
    if (!open || !results.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  const placeholder = placeholderOverride || t(site?.settings?.header?.searchPlaceholder) || 'Search…';
  const showPanel = open && debounced.length >= 2;

  return (
    <form role="search" onSubmit={submit} className={cn('relative w-full', className)}>
      <label htmlFor={`${listId}-input`} className="sr-only">
        {term('search')}
      </label>
      <div className="relative">
        <Search className={cn('pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground', size === 'lg' ? 'size-5' : 'size-4')} aria-hidden="true" />
        <input
          ref={inputRef}
          id={`${listId}-input`}
          type="search"
          value={query}
          autoFocus={autoFocus}
          autoComplete="off"
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={`${listId}-list`}
          aria-activedescendant={active >= 0 ? `${listId}-opt-${active}` : undefined}
          className={cn(
            'w-full rounded-xl border border-input bg-muted/60 pr-9 pl-9 text-sm text-foreground transition-colors outline-none placeholder:text-muted-foreground focus:border-brand/50 focus:bg-background focus:ring-3 focus:ring-brand/15 [&::-webkit-search-cancel-button]:hidden',
            size === 'lg' ? 'h-12 pl-11 text-base' : 'h-10',
          )}
        />
        {query && (
          <button type="button" onClick={() => setQuery('')} className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground" aria-label="Clear search">
            {suggestions.isFetching ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
          </button>
        )}
      </div>

      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.14 }}
            className="absolute top-full right-0 left-0 z-50 mt-2 overflow-hidden rounded-xl border bg-popover shadow-xl"
          >
            <ul id={`${listId}-list`} role="listbox" className="max-h-[60vh] overflow-y-auto p-1.5">
              {suggestions.isPending && <li className="px-3 py-3 text-sm text-muted-foreground">…</li>}
              {!suggestions.isPending && results.length === 0 && (
                <li className="px-3 py-3 text-sm text-muted-foreground">{term('noResults')}</li>
              )}
              {results.map((result, index) => {
                const meta = RESULT_META[result.type] || RESULT_META.page;
                const IconComponent = meta.icon;
                return (
                  <li key={`${result.type}-${result.id}`} id={`${listId}-opt-${index}`} role="option" aria-selected={active === index}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => go(result.url)}
                      className={cn('flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left text-sm', active === index ? 'bg-muted' : 'hover:bg-muted')}
                    >
                      <IconComponent className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{t(result.title)}</span>
                        <span className="block truncate text-xs text-muted-foreground">{resultContext(result, t) || term(meta.term)}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <button
              type="submit"
              onMouseDown={(e) => e.preventDefault()}
              className="flex w-full items-center justify-between border-t bg-muted/40 px-4 py-2.5 text-xs font-semibold text-brand hover:bg-muted"
            >
              <span>
                “{query.trim()}” — {term('search')}
              </span>
              <ArrowRight className="size-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}
