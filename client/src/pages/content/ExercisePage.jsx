import { Loader2 } from 'lucide-react';
import { Fragment, useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/content/badges.jsx';
import { LanguageNotice } from '@/components/content/LanguageNotice.jsx';
import { QuestionCard } from '@/components/content/QuestionCard.jsx';
import { RelatedContent } from '@/components/content/RelatedContent.jsx';
import { RichContent } from '@/components/content/RichContent.jsx';
import { YouTubeEmbed } from '@/components/content/YouTubeEmbed.jsx';
import { AdSlot } from '@/components/site/AdSlot.jsx';
import { EmptyState } from '@/components/site/States.jsx';
import { errorMessage, get } from '@/lib/api';
import { hasContent, useL10n } from '@/lib/i18n';
import { useTerm } from '@/lib/site';
import { cn } from '@/lib/utils';
import { ContentHeader, PrevNext, StatPills } from './ContentHeader.jsx';

export default function ExercisePage({ data, breadcrumbs, related, path, preview, previewToken }) {
  const t = useL10n();
  const term = useTerm();
  const { class: cls, chapter, exercise, pagination, siblings, prev, next } = data;
  const [pages, setPages] = useState([data.questions]);
  const [page, setPage] = useState(pagination.page);
  const [loading, setLoading] = useState(false);
  const questions = pages.flat();
  const hasMore = page < pagination.pages;
  const mode = exercise.languageMode;

  const loadMore = async () => {
    setLoading(true);
    try {
      const result = await get('/public/resolve', { path, page: page + 1, preview: preview ? 1 : undefined, previewToken });
      setPages((current) => [...current, result.data.questions]);
      setPage(page + 1);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ContentHeader
        breadcrumbs={breadcrumbs}
        watermark={exercise.number}
        eyebrow={
          <>
            <Chip tone="brand">{t(cls.name) || `${term('class')} ${cls.number}`}</Chip>
            <Link to={chapter.url} className="inline-flex h-6 items-center rounded-full bg-muted px-2.5 text-[11px] font-semibold text-muted-foreground hover:text-brand">
              {term('chapter')} {chapter.number} · {t(chapter.title)}
            </Link>
          </>
        }
        title={
          <>
            {term('class')} {cls.number} {term('mathematics')} {term('chapter')} {chapter.number} <span className="text-brand">{term('exercise')} {exercise.number}</span>
          </>
        }
        subtitle={t(exercise.title, mode)}
        aside={<LanguageNotice />}
      >
        <StatPills items={[{ value: pagination.total, label: term('questions') }]} />
      </ContentHeader>

      {siblings.length > 1 && (
        <nav aria-label={term('exercise')} className="border-b bg-background">
          <div className="container-page flex gap-2 overflow-x-auto py-3">
            {siblings.map((s) => (
              <Link
                key={s._id}
                to={s.url}
                aria-current={s._id === exercise._id ? 'page' : undefined}
                className={cn(
                  'shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition',
                  s._id === exercise._id ? 'border-brand bg-brand text-brand-foreground' : 'bg-card hover:border-brand/40 hover:text-brand',
                )}
              >
                {t(s.label)}
              </Link>
            ))}
          </div>
        </nav>
      )}

      <div className="container-page grid gap-8 py-8 lg:grid-cols-12">
        <aside className="hidden lg:col-span-3 lg:block">
          {questions.length > 0 && (
            <nav aria-label={term('questions')} className="sticky top-[calc(var(--header-height)+1rem)] rounded-2xl border bg-card p-4">
              <p className="mb-3 text-xs font-extrabold tracking-wide text-muted-foreground uppercase">
                {term('exercise')} {exercise.number}
              </p>
              <ol className="grid grid-cols-4 gap-2">
                {questions.map((q) => (
                  <li key={q._id}>
                    <a href={`#q-${q.slug}`} className="grid h-10 place-items-center rounded-lg border bg-background text-sm font-bold hover:border-brand hover:text-brand" aria-label={`${term('question')} ${q.number}`}>
                      {q.number}
                    </a>
                  </li>
                ))}
              </ol>
              <AdSlot placement="sidebar" pageType="exercise" className="mt-4 px-0" />
            </nav>
          )}
        </aside>

        <div className="min-w-0 space-y-6 lg:col-span-9">
          {exercise.introVideo && <YouTubeEmbed video={exercise.introVideo} />}
          {(hasContent(exercise.description) || hasContent(exercise.instructions)) && (
            <div className="space-y-3 rounded-2xl border bg-card p-5">
              {hasContent(exercise.description) && <RichContent html={t(exercise.description, mode)} />}
              {hasContent(exercise.instructions) && <RichContent html={t(exercise.instructions, mode)} className="text-sm text-muted-foreground" />}
            </div>
          )}

          {questions.length > 0 && (
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 lg:hidden" aria-label={term('questions')}>
              {questions.map((q) => (
                <a key={q._id} href={`#q-${q.slug}`} className="grid h-9 min-w-9 shrink-0 place-items-center rounded-lg border bg-card px-2 text-sm font-bold">
                  {q.number}
                </a>
              ))}
            </div>
          )}

          {questions.length === 0 && <EmptyState title={term('comingSoon')} description={`${term('exercise')} ${exercise.number}`} />}

          {questions.map((question, index) => (
            <Fragment key={question._id}>
              <QuestionCard question={question} />
              {index === 1 && <AdSlot placement="inContent" pageType="exercise" className="px-0" />}
            </Fragment>
          ))}

          {hasMore && (
            <div className="flex justify-center">
              <Button size="lg" variant="outline" onClick={loadMore} disabled={loading} className="h-11 rounded-xl px-6">
                {loading && <Loader2 className="animate-spin" />}
                {term('loadMore')} ({questions.length}/{pagination.total})
              </Button>
            </div>
          )}

          <AdSlot placement="afterContent" pageType="exercise" className="px-0" />
          <PrevNext prev={prev} next={next} t={t} />
          <RelatedContent items={related} />
        </div>
      </div>
    </>
  );
}
