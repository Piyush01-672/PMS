import { ArrowRight, BookOpen, Layers, ListOrdered, NotebookPen, Star } from 'lucide-react';
import { Link } from 'react-router';
import { Chip } from '@/components/content/badges.jsx';
import { LanguageNotice } from '@/components/content/LanguageNotice.jsx';
import { EmptyState } from '@/components/site/States.jsx';
import { SmartLink } from '@/components/site/SmartLink.jsx';
import { useL10n, useLang } from '@/lib/i18n';
import { useTerm } from '@/lib/site';
import { ContentHeader, StatPills, otherLanguage } from './ContentHeader.jsx';

export function ChapterRow({ chapter, showExercises = true }) {
  const t = useL10n();
  const term = useTerm();
  const { lang } = useLang();
  return (
    <li className="group rounded-2xl border bg-card p-4 transition hover:border-brand/40 hover:shadow-md sm:p-5">
      <div className="flex gap-4">
        <Link to={chapter.url} className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-soft font-heading text-lg font-extrabold text-brand" aria-hidden="true" tabIndex={-1}>
          {chapter.number}
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-muted-foreground">
            {term('chapter')} {chapter.number}
          </p>
          <h3 className="text-lg font-bold">
            <Link to={chapter.url} className="hover:text-brand">
              {t(chapter.title)}
            </Link>
          </h3>
          {otherLanguage(chapter.title, lang) && <p className="text-sm text-muted-foreground">{otherLanguage(chapter.title, lang)}</p>}
          {t(chapter.shortDescription) && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{t(chapter.shortDescription)}</p>}
          {showExercises && chapter.exercises?.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2" aria-label={term('exercise')}>
              {chapter.exercises.map((ex) => (
                <li key={ex._id}>
                  <Link to={ex.url} className="inline-flex items-center rounded-lg border bg-background px-2.5 py-1 text-xs font-semibold hover:border-brand/50 hover:text-brand">
                    {term('exercise')} {ex.number}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="hidden shrink-0 flex-col items-end justify-between text-right sm:flex">
          <span className="text-xs text-muted-foreground">
            {chapter.exerciseCount} {term('exercise')} · {chapter.questionCount} {term('questions')}
          </span>
          <Link to={chapter.url} className="inline-flex items-center gap-1 text-sm font-semibold text-brand" aria-label={t(chapter.title)}>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </li>
  );
}

export default function SubjectPage({ data, breadcrumbs }) {
  const t = useL10n();
  const term = useTerm();
  const { class: cls, subject, chapters, noteCount, importantCount, links } = data;
  const exerciseTotal = chapters.reduce((sum, c) => sum + c.exerciseCount, 0);
  const questionTotal = chapters.reduce((sum, c) => sum + c.questionCount, 0);
  const className = t(cls.name) || `${term('class')} ${cls.number} ${t(subject.name)}`;

  const quickLinks = [
    { icon: BookOpen, label: term('ncertSolutions'), href: '#chapters', meta: `${chapters.length} ${term('chapter')}` },
    { icon: Layers, label: term('chapterWise'), href: '#chapters', meta: `${chapters.length}` },
    { icon: ListOrdered, label: term('exerciseWise'), href: links.exercises, meta: `${exerciseTotal}` },
    { icon: Star, label: term('importantQuestions'), href: links.importantQuestions, meta: `${importantCount}` },
    { icon: NotebookPen, label: term('notes'), href: links.notes, meta: `${noteCount}` },
  ];

  return (
    <>
      <ContentHeader
        breadcrumbs={breadcrumbs}
        watermark={cls.number}
        eyebrow={
          <>
            <Chip tone="brand">{t(subject.name)}</Chip>
            {t(cls.badge) && <Chip>{t(cls.badge)}</Chip>}
          </>
        }
        title={
          <>
            {className} <span className="text-brand">· {term('ncertSolutions')}</span>
          </>
        }
        subtitle={t(cls.description)}
        aside={<LanguageNotice />}
      >
        <StatPills
          items={[
            { value: chapters.length, label: term('chapter') },
            { value: exerciseTotal, label: term('exercise') },
            { value: questionTotal, label: term('questions') },
          ]}
        />
      </ContentHeader>

      <div className="container-page py-8">
        <nav aria-label="Study sections" className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {quickLinks.map(({ icon: IconComponent, label, href, meta }) => (
            <SmartLink key={label + href} to={href} className="group flex flex-col gap-2 rounded-2xl border bg-card p-4 transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md">
              <IconComponent className="size-5 text-brand" aria-hidden="true" />
              <span className="text-sm leading-snug font-bold group-hover:text-brand">{label}</span>
              <span className="text-xs text-muted-foreground">{meta}</span>
            </SmartLink>
          ))}
        </nav>

        <section id="chapters" aria-labelledby="chapters-heading" className="mt-10 scroll-mt-24">
          <h2 id="chapters-heading" className="mb-4 text-xl font-bold">
            {term('chapterWise')}
          </h2>
          {chapters.length ? (
            <ol className="space-y-3">
              {chapters.map((chapter) => (
                <ChapterRow key={chapter._id} chapter={chapter} />
              ))}
            </ol>
          ) : (
            <EmptyState title={term('comingSoon')} description={`${className} — ${term('chapter')}`} />
          )}
        </section>
      </div>
    </>
  );
}
