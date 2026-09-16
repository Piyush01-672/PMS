import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';
import { Chip } from '@/components/content/badges.jsx';
import { LanguageNotice } from '@/components/content/LanguageNotice.jsx';
import { QuestionCard } from '@/components/content/QuestionCard.jsx';
import { RelatedContent } from '@/components/content/RelatedContent.jsx';
import { AdSlot } from '@/components/site/AdSlot.jsx';
import { useL10n } from '@/lib/i18n';
import { useTerm } from '@/lib/site';
import { ContentHeader, PrevNext } from './ContentHeader.jsx';

export default function QuestionPage({ data, breadcrumbs, related }) {
  const t = useL10n();
  const term = useTerm();
  const { class: cls, chapter, exercise, question, prev, next } = data;

  return (
    <>
      <ContentHeader
        breadcrumbs={breadcrumbs}
        watermark={question.number}
        eyebrow={
          <>
            <Chip tone="brand">
              {term('class')} {cls.number}
            </Chip>
            <Link to={chapter.url} className="inline-flex h-6 items-center rounded-full bg-muted px-2.5 text-[11px] font-semibold text-muted-foreground hover:text-brand">
              {term('chapter')} {chapter.number} · {t(chapter.title)}
            </Link>
            <Link to={exercise.url} className="inline-flex h-6 items-center rounded-full bg-muted px-2.5 text-[11px] font-semibold text-muted-foreground hover:text-brand">
              {term('exercise')} {exercise.number}
            </Link>
          </>
        }
        title={
          <>
            {term('exercise')} {exercise.number} <span className="text-brand">{term('question')} {question.number}</span>
          </>
        }
        subtitle={`${term('class')} ${cls.number} ${term('mathematics')} · ${term('chapter')} ${chapter.number} – ${t(chapter.title)}`}
        aside={<LanguageNotice />}
      />
      <div className="container-page max-w-4xl py-8">
        <QuestionCard question={question} headingLevel="h2" showPermalink={false} />
        <AdSlot placement="afterContent" pageType="question" className="px-0" />
        <PrevNext prev={prev} next={next} t={t} />
        <div className="mt-6">
          <Link to={exercise.url} className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline">
            <ArrowLeft className="size-4" /> {term('exercise')} {exercise.number} — {term('questions')}
          </Link>
        </div>
        <RelatedContent items={related} />
      </div>
    </>
  );
}
