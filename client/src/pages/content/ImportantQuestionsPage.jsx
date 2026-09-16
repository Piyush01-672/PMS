import { Loader2, Star } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Chip, DifficultyBadge } from '@/components/content/badges.jsx';
import { Callout } from '@/components/content/Callout.jsx';
import { Figure } from '@/components/content/Figure.jsx';
import { toViewerImage, useImageViewer } from '@/components/content/ImageViewer.jsx';
import { LanguageNotice } from '@/components/content/LanguageNotice.jsx';
import { RichContent } from '@/components/content/RichContent.jsx';
import { SolutionRenderer } from '@/components/content/SolutionRenderer.jsx';
import { EmptyState } from '@/components/site/States.jsx';
import { errorMessage, get } from '@/lib/api';
import { hasContent, useL10n } from '@/lib/i18n';
import { useTerm } from '@/lib/site';
import { ContentHeader, StatPills } from './ContentHeader.jsx';

function ImportantQuestionCard({ item, index }) {
  const t = useL10n();
  const term = useTerm();
  const { openViewer } = useImageViewer();
  const mode = item.languageMode;
  const images = item.attachments.map((a) => toViewerImage(a.media, { alt: t(a.alt) || t(a.media?.alt), caption: t(a.caption) }));
  const hasFinal = item.blocks.some((b) => b.type === 'finalAnswer');

  return (
    <article id={item.slug} className="scroll-mt-24 overflow-hidden rounded-2xl border bg-card">
      <header className="flex flex-wrap items-center gap-2 border-b bg-saffron-soft/50 px-4 py-2.5 sm:px-5">
        <Star className="size-4 text-warning" aria-hidden="true" />
        <h2 className="text-sm font-bold">
          {term('question')} {index + 1}
        </h2>
        {item.marks ? (
          <span className="rounded-full border bg-background px-2 py-0.5 text-[11px] font-semibold">
            {item.marks} {term('marks')}
          </span>
        ) : null}
        <DifficultyBadge difficulty={item.difficulty} />
        {item.source && <span className="text-[11px] text-muted-foreground">{item.source}</span>}
        {item.chapter && (
          <Link to={item.chapter.url} className="ml-auto text-xs font-semibold text-brand hover:underline">
            {term('chapter')} {item.chapter.number} · {t(item.chapter.title)}
          </Link>
        )}
      </header>
      <div className="space-y-4 p-4 sm:p-5">
        <RichContent html={t(item.text, mode)} className="text-[16.5px] font-medium" />
        {item.attachments.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {item.attachments.map((a, i) => (
              <Figure key={a._id} media={a.media} alt={images[i].alt} caption={images[i].caption} onOpen={() => openViewer(images, i)} />
            ))}
          </div>
        )}
        {item.blocks.length > 0 && <SolutionRenderer blocks={item.blocks} languageMode={mode} />}
        {!hasFinal && hasContent(item.answer) && (
          <Callout variant="answer" title={term('finalAnswer')} className="border-2">
            <RichContent html={t(item.answer, mode)} />
          </Callout>
        )}
      </div>
    </article>
  );
}

export default function ImportantQuestionsPage({ data, breadcrumbs, path, preview, previewToken }) {
  const t = useL10n();
  const term = useTerm();
  const { class: cls, pagination } = data;
  const [pages, setPages] = useState([data.items]);
  const [page, setPage] = useState(pagination.page);
  const [loading, setLoading] = useState(false);
  const items = pages.flat();

  const loadMore = async () => {
    setLoading(true);
    try {
      const result = await get('/public/resolve', { path, page: page + 1, preview: preview ? 1 : undefined, previewToken });
      setPages((current) => [...current, result.data.items]);
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
        watermark={cls.number}
        eyebrow={<Chip tone="saffron">{t(cls.name) || `${term('class')} ${cls.number}`}</Chip>}
        title={term('importantQuestions')}
        aside={<LanguageNotice />}
      >
        <StatPills items={[{ value: pagination.total, label: term('questions') }]} />
      </ContentHeader>
      <div className="container-page max-w-4xl space-y-6 py-8">
        {items.length === 0 && <EmptyState icon={Star} title={term('comingSoon')} />}
        {items.map((item, index) => (
          <ImportantQuestionCard key={item._id} item={item} index={index} />
        ))}
        {page < pagination.pages && (
          <div className="flex justify-center">
            <Button size="lg" variant="outline" onClick={loadMore} disabled={loading} className="h-11 rounded-xl px-6">
              {loading && <Loader2 className="animate-spin" />}
              {term('loadMore')}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
