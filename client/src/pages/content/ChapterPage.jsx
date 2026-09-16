import { ArrowRight, FileText, ListOrdered, Star } from 'lucide-react';
import { Link } from 'react-router';
import { Chip } from '@/components/content/badges.jsx';
import { Figure } from '@/components/content/Figure.jsx';
import { toViewerImage, useImageViewer } from '@/components/content/ImageViewer.jsx';
import { LanguageNotice } from '@/components/content/LanguageNotice.jsx';
import { CopyLatexButton, MathFormula } from '@/components/content/MathFormula.jsx';
import { RelatedContent } from '@/components/content/RelatedContent.jsx';
import { RichContent } from '@/components/content/RichContent.jsx';
import { YouTubeEmbed } from '@/components/content/YouTubeEmbed.jsx';
import { AdSlot } from '@/components/site/AdSlot.jsx';
import { EmptyState } from '@/components/site/States.jsx';
import { hasContent, useL10n, useLang } from '@/lib/i18n';
import { useTerm } from '@/lib/site';
import { ContentHeader, PrevNext, StatPills, otherLanguage } from './ContentHeader.jsx';

export default function ChapterPage({ data, breadcrumbs, related }) {
  const t = useL10n();
  const term = useTerm();
  const { lang } = useLang();
  const { openViewer } = useImageViewer();
  const { class: cls, chapter, exercises, notes, importantCount, links, prev, next } = data;
  const mode = chapter.languageMode;
  const questionTotal = exercises.reduce((sum, e) => sum + e.questionCount, 0);
  const cover = chapter.featuredImage || chapter.image;

  return (
    <>
      <ContentHeader
        breadcrumbs={breadcrumbs}
        watermark={chapter.number}
        eyebrow={
          <>
            <Chip tone="brand">
              {term('class')} {cls.number}
            </Chip>
            <Chip>
              {term('chapter')} {chapter.number}
            </Chip>
          </>
        }
        title={t(chapter.title, mode)}
        subtitle={[otherLanguage(chapter.title, lang), t(chapter.shortDescription, mode)].filter(Boolean).join(' — ')}
        aside={<LanguageNotice />}
      >
        <StatPills
          items={[
            { value: exercises.length, label: term('exercise') },
            { value: questionTotal, label: term('questions') },
          ]}
        />
      </ContentHeader>

      <div className="container-page grid gap-8 py-8 lg:grid-cols-12">
        <div className="min-w-0 space-y-8 lg:col-span-8">
          {cover?.url && (
            <Figure media={cover} alt={t(cover.alt) || t(chapter.title)} priority onOpen={() => openViewer([toViewerImage(cover, { alt: t(cover.alt) })])} />
          )}
          {chapter.introVideo && <YouTubeEmbed video={chapter.introVideo} />}

          {hasContent(chapter.introduction) && (
            <section aria-labelledby="intro-heading" className="rounded-2xl border bg-card p-5 sm:p-6">
              <h2 id="intro-heading" className="mb-3 text-lg font-bold">
                {term('introduction')}
              </h2>
              <RichContent html={t(chapter.introduction, mode)} />
            </section>
          )}

          {chapter.formulas?.length > 0 && (
            <section id="formulas" aria-labelledby="formulas-heading" className="scroll-mt-24">
              <h2 id="formulas-heading" className="mb-3 text-lg font-bold">
                {term('formulas')}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {chapter.formulas.map((formula) => (
                  <div key={formula._id} className="rounded-xl border-2 border-indigo/20 bg-card p-4">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-indigo">{t(formula.title) || term('formula')}</span>
                      <CopyLatexButton latex={formula.latex} />
                    </div>
                    <MathFormula latex={formula.latex} className="text-lg" />
                    {t(formula.description) && <p className="mt-1 text-xs text-muted-foreground">{t(formula.description)}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section id="exercises" aria-labelledby="exercises-heading" className="scroll-mt-24">
            <h2 id="exercises-heading" className="mb-3 text-lg font-bold">
              {term('exerciseWise')}
            </h2>
            {exercises.length ? (
              <ul className="grid gap-3 sm:grid-cols-2">
                {exercises.map((ex) => (
                  <li key={ex._id}>
                    <Link to={ex.url} className="group flex h-full items-center gap-4 rounded-2xl border bg-card p-4 transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md">
                      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-indigo-soft text-indigo">
                        <ListOrdered className="size-5" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-heading text-lg font-extrabold group-hover:text-brand">
                          {term('exercise')} {ex.number}
                        </span>
                        <span className="block truncate text-sm text-muted-foreground">
                          {t(ex.title) || `${ex.questionCount} ${term('questions')}`}
                        </span>
                        {t(ex.title) && (
                          <span className="block text-xs text-muted-foreground">
                            {ex.questionCount} {term('questions')}
                          </span>
                        )}
                      </span>
                      <ArrowRight className="size-5 text-brand transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={ListOrdered} title={term('comingSoon')} />
            )}
          </section>

          <AdSlot placement="inContent" pageType="chapter" className="px-0" />

          {hasContent(chapter.notes) && (
            <section aria-labelledby="chapter-notes" className="rounded-2xl border bg-card p-5 sm:p-6">
              <h2 id="chapter-notes" className="mb-3 text-lg font-bold">
                {term('notes')}
              </h2>
              <RichContent html={t(chapter.notes, mode)} />
            </section>
          )}

          <PrevNext prev={prev} next={next} t={t} />
          <RelatedContent items={related} />
        </div>

        <aside className="space-y-4 lg:col-span-4">
          <div className="space-y-4 lg:sticky lg:top-[calc(var(--header-height)+1rem)]">
            {exercises.length > 0 && (
              <nav aria-label={term('exercise')} className="rounded-2xl border bg-card p-4">
                <p className="mb-2 text-xs font-extrabold tracking-wide text-muted-foreground uppercase">{term('exercise')}</p>
                <ul className="space-y-1">
                  {exercises.map((ex) => (
                    <li key={ex._id}>
                      <Link to={ex.url} className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted hover:text-brand">
                        {term('exercise')} {ex.number} <span className="text-xs text-muted-foreground">{ex.questionCount}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
            {notes.length > 0 && (
              <div className="rounded-2xl border bg-card p-4">
                <p className="mb-2 text-xs font-extrabold tracking-wide text-muted-foreground uppercase">{term('notes')}</p>
                <ul className="space-y-1">
                  {notes.map((note) => (
                    <li key={note._id}>
                      <Link to={note.url} className="flex items-start gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted hover:text-brand">
                        <FileText className="mt-0.5 size-4 shrink-0 text-indigo" aria-hidden="true" /> {t(note.title)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {importantCount > 0 && (
              <Link to={links.importantQuestions} className="flex items-center gap-3 rounded-2xl border border-saffron/40 bg-saffron-soft p-4 text-sm font-semibold hover:shadow-md">
                <Star className="size-5 text-warning" aria-hidden="true" />
                <span className="flex-1">
                  {term('importantQuestions')} ({importantCount})
                </span>
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            )}
            <AdSlot placement="sidebar" pageType="chapter" className="px-0" />
          </div>
        </aside>
      </div>
    </>
  );
}
