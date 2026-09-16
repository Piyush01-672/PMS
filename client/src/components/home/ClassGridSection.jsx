import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { useL10n } from '@/lib/i18n';
import { useTerm } from '@/lib/site';
import { cn } from '@/lib/utils';
import { SectionShell } from './SectionShell.jsx';

function Stat({ value, label }) {
  return (
    <div className="flex flex-col">
      <span className="font-heading text-lg font-extrabold text-ink dark:text-foreground">{value}</span>
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

function ClassCard({ cls, large }) {
  const t = useL10n();
  const term = useTerm();
  const title = t(cls.name) || `${term('class')} ${cls.number}`;
  const empty = !cls.stats?.chapters;
  return (
    <Link
      to={cls.url}
      data-reveal
      className={cn(
        'group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-card p-5 transition duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl hover:shadow-brand/5',
        large && 'sm:p-6 lg:col-span-2',
      )}
    >
      <span
        className={cn(
          'pointer-events-none absolute -top-4 -right-2 font-heading font-extrabold text-brand/[0.07] transition-transform duration-500 group-hover:scale-110 dark:text-white/[0.05]',
          large ? 'text-[8rem]' : 'text-[5.5rem]',
        )}
        aria-hidden="true"
      >
        {cls.number}
      </span>
      <div className="relative">
        <div className="mb-3 flex items-center gap-2">
          <span className="grid size-10 place-items-center rounded-xl bg-brand-soft font-heading text-sm font-extrabold text-brand">{cls.number}</span>
          {t(cls.badge) && <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">{t(cls.badge)}</span>}
        </div>
        <h3 className={cn('font-bold tracking-tight group-hover:text-brand', large ? 'text-xl sm:text-2xl' : 'text-lg')}>{title}</h3>
        {t(cls.description) && <p className={cn('mt-1.5 text-sm leading-relaxed text-muted-foreground', !large && 'line-clamp-3')}>{t(cls.description)}</p>}
        {large && !empty && (
          <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-muted/60 px-4 py-3">
            <Stat value={cls.stats.chapters} label={term('chapter')} />
            <Stat value={cls.stats.exercises} label={term('exercise')} />
            <Stat value={cls.stats.questions} label={term('questions')} />
          </div>
        )}
      </div>
      <div className="relative mt-5 flex items-center justify-between gap-2 text-sm">
        <span className="text-xs font-medium text-muted-foreground">
          {empty ? term('comingSoon') : `${cls.stats.chapters} ${term('chapter')} · ${cls.stats.exercises} ${term('exercise')}`}
        </span>
        <span className={cn('inline-flex items-center gap-1 rounded-xl font-semibold', large ? 'bg-brand px-3.5 py-2 text-brand-foreground' : 'text-brand')}>
          {term('ncertSolutions')} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

export function ClassGridSection({ section }) {
  const classes = section.data?.classes || [];
  const featuredLayout = section.config?.layout === 'featured';
  const featured = featuredLayout ? classes.filter((c) => c.featured) : [];
  const rest = featuredLayout ? classes.filter((c) => !c.featured) : classes;
  return (
    <SectionShell section={section}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {featured.map((cls) => (
          <ClassCard key={cls._id} cls={cls} large />
        ))}
        {rest.map((cls) => (
          <ClassCard key={cls._id} cls={cls} />
        ))}
      </div>
    </SectionShell>
  );
}
