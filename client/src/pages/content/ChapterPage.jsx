import {
  ArrowRight,
  BookOpen,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  ListOrdered,
  Play,
  ShoppingBag,
  Sparkles,
  Star,
  Video,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/content/badges.jsx';
import { Figure } from '@/components/content/Figure.jsx';
import { toViewerImage, useImageViewer } from '@/components/content/ImageViewer.jsx';
import { LanguageNotice } from '@/components/content/LanguageNotice.jsx';
import { CopyLatexButton, MathFormula } from '@/components/content/MathFormula.jsx';
import { PdfViewerDialog } from '@/components/content/PdfViewerDialog.jsx';
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

  const { class: cls, chapter, topics = [], exercises = [], resources = [], books = [], notes = [], importantCount = 0, links, prev, next } = data;
  const mode = chapter.languageMode;
  const questionTotal = exercises.reduce((sum, e) => sum + (e.questionCount || 0), 0);
  const cover = chapter.featuredImage || chapter.image;

  const [activePdfUrl, setActivePdfUrl] = useState(null);
  const [activePdfTitle, setActivePdfTitle] = useState('');
  const [downloadAllowed, setDownloadAllowed] = useState(true);

  const handleOpenPdf = (url, title, canDownload = true) => {
    setActivePdfUrl(url);
    setActivePdfTitle(title);
    setDownloadAllowed(canDownload);
  };

  return (
    <>
      <ContentHeader
        breadcrumbs={breadcrumbs}
        watermark={chapter.number}
        eyebrow={
          <div className="flex items-center gap-2">
            <Chip tone="brand">
              {term('class')} {cls.number}
            </Chip>
            <Chip>
              {term('chapter')} {chapter.number}
            </Chip>
          </div>
        }
        title={t(chapter.title, mode)}
        subtitle={[otherLanguage(chapter.title, lang), t(chapter.shortDescription, mode)].filter(Boolean).join(' — ')}
        aside={<LanguageNotice />}
      >
        <StatPills
          items={[
            ...(topics.length > 0 ? [{ value: topics.length, label: 'Topics' }] : []),
            { value: exercises.length, label: term('exercise') },
            { value: questionTotal, label: term('questions') },
            ...(resources.length > 0 ? [{ value: resources.length, label: 'PDFs & Files' }] : []),
            ...(books.length > 0 ? [{ value: books.length, label: 'Books' }] : []),
          ]}
        />
      </ContentHeader>

      <div className="container-page grid gap-8 py-8 lg:grid-cols-12">
        <div className="min-w-0 space-y-10 lg:col-span-8">
          {cover?.url && (
            <Figure media={cover} alt={t(cover.alt) || t(chapter.title)} priority onOpen={() => openViewer([toViewerImage(cover, { alt: t(cover.alt) })])} />
          )}
          {chapter.introVideo && <YouTubeEmbed video={chapter.introVideo} />}

          {/* Chapter Topics Section */}
          {topics.length > 0 && (
            <section id="topics" aria-labelledby="topics-heading" className="scroll-mt-24 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-9 place-items-center rounded-xl bg-brand-soft text-brand">
                    <Sparkles className="size-5" />
                  </span>
                  <div>
                    <h2 id="topics-heading" className="font-heading text-xl font-bold text-foreground">
                      Chapter Topics / अध्याय के विषय व वीडियो कक्षाएं
                    </h2>
                    <p className="text-xs text-muted-foreground">Comprehensive concept learning: Videos, Notes, Formulas, Practice Questions & Solutions</p>
                  </div>
                </div>
                <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand">
                  {topics.length} Topics
                </span>
              </div>

              <div className="grid gap-3.5 sm:grid-cols-2">
                {topics.map((tp) => (
                  <Link
                    key={tp._id}
                    to={tp.url}
                    className="group flex flex-col justify-between rounded-2xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md"
                  >
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 rounded-md bg-brand-soft px-2 py-0.5 text-[11px] font-bold text-brand">
                          Topic {tp.number}
                        </span>
                        {tp.estimatedTime && <span className="text-[11px] text-muted-foreground">{t(tp.estimatedTime)}</span>}
                      </div>
                      <h3 className="font-heading text-base font-bold text-foreground group-hover:text-brand">{t(tp.title)}</h3>
                      {t(tp.shortDescription) && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t(tp.shortDescription)}</p>}
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs font-bold text-brand">
                      <span className="inline-flex items-center gap-1.5">
                        <Play className="size-3.5 fill-brand" />
                        Start Learning / सीखें
                      </span>
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Chapter Introduction */}
          {hasContent(chapter.introduction) && (
            <section aria-labelledby="intro-heading" className="rounded-2xl border bg-card p-5 sm:p-6">
              <h2 id="intro-heading" className="mb-3 text-lg font-bold">
                {term('introduction')}
              </h2>
              <RichContent html={t(chapter.introduction, mode)} />
            </section>
          )}

          {/* Chapter Formulas */}
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

          {/* Exercise-wise NCERT Solutions */}
          <section id="exercises" aria-labelledby="exercises-heading" className="scroll-mt-24 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-indigo-soft text-indigo">
                  <ListOrdered className="size-5" />
                </span>
                <div>
                  <h2 id="exercises-heading" className="font-heading text-xl font-bold text-foreground">
                    {term('exerciseWise')} (प्रश्नावली-वार हल)
                  </h2>
                  <p className="text-xs text-muted-foreground">Step-by-step textbook solutions in Hindi, English & Mixed</p>
                </div>
              </div>
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
                {exercises.length} {term('exercise')}
              </span>
            </div>

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

          {/* Chapter PDF Resources & Study Material */}
          {resources.length > 0 && (
            <section id="resources" aria-labelledby="resources-heading" className="scroll-mt-24 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-9 place-items-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                    <FileText className="size-5" />
                  </span>
                  <div>
                    <h2 id="resources-heading" className="font-heading text-xl font-bold text-foreground">
                      Chapter PDF Notes & Downloads / अध्ययन सामग्री
                    </h2>
                    <p className="text-xs text-muted-foreground">Download PDF study material, formula sheets & worksheets for this chapter</p>
                  </div>
                </div>
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
                  {resources.length} Files
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {resources.map((res) => {
                  const title = t(res.title) || 'Study Material PDF';
                  const fileUrl = res.fileUrl || res.file?.url;

                  return (
                    <div key={res._id} className="flex flex-col justify-between rounded-2xl border bg-card p-4 shadow-sm">
                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="rounded bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-brand uppercase">
                            {res.resourceType?.replace(/_/g, ' ')}
                          </span>
                          {res.fileSize && <span className="text-[11px] text-muted-foreground">{res.fileSize}</span>}
                        </div>
                        <h4 className="font-heading text-sm font-bold text-foreground">{title}</h4>
                        {t(res.description) && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t(res.description)}</p>}
                      </div>
                      <div className="mt-3 flex gap-2 border-t pt-2.5">
                        {fileUrl && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleOpenPdf(fileUrl, title, res.downloadAllowed !== false)} className="flex-1 text-xs">
                              <Eye className="mr-1.5 size-3.5" /> Preview
                            </Button>
                            {res.downloadAllowed !== false && (
                              <Button size="sm" asChild className="flex-1 text-xs">
                                <a href={fileUrl} download target="_blank" rel="noopener noreferrer">
                                  <Download className="mr-1.5 size-3.5" /> Download
                                </a>
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Recommended Reference Books for this Chapter */}
          {books.length > 0 && (
            <section id="books" aria-labelledby="books-heading" className="scroll-mt-24 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-9 place-items-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400">
                    <BookOpen className="size-5" />
                  </span>
                  <div>
                    <h2 id="books-heading" className="font-heading text-xl font-bold text-foreground">
                      Recommended Reference Books / संदर्भ पुस्तकें
                    </h2>
                    <p className="text-xs text-muted-foreground">Expert recommended mathematics books for concept mastery and exams</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {books.slice(0, 4).map((b) => {
                  const title = t(b.title) || 'Mathematics Reference Book';
                  const coverUrl = b.coverUrl || b.coverImage?.url;

                  return (
                    <div key={b._id} className="flex gap-4 rounded-2xl border bg-card p-4 shadow-sm">
                      <div className="relative aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-xl bg-muted shadow-sm">
                        {coverUrl ? (
                          <img src={coverUrl} alt={title} className="size-full object-cover" />
                        ) : (
                          <div className="grid size-full place-items-center bg-orange-100 text-orange-600">
                            <BookOpen className="size-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-orange-600 uppercase">{b.category?.replace(/_/g, ' ')}</span>
                          <h4 className="line-clamp-2 font-heading text-sm font-bold text-foreground">{title}</h4>
                          <p className="text-xs text-muted-foreground">By {b.author}</p>
                          {b.price && <p className="mt-1 text-xs font-bold text-brand">{b.price}</p>}
                        </div>
                        {b.purchaseUrl && (
                          <Button size="sm" className="mt-2 w-full bg-orange-600 text-xs font-bold text-white hover:bg-orange-700" asChild>
                            <a href={b.purchaseUrl} target="_blank" rel="noopener noreferrer">
                              <ShoppingBag className="mr-1.5 size-3.5" /> Buy Book ↗
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

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

        {/* Sidebar */}
        <aside className="space-y-4 lg:col-span-4">
          <div className="space-y-4 lg:sticky lg:top-[calc(var(--header-height)+1rem)]">
            {topics.length > 0 && (
              <nav aria-label="Topics" className="rounded-2xl border bg-card p-4">
                <p className="mb-2 text-xs font-extrabold tracking-wide text-muted-foreground uppercase">Chapter Topics ({topics.length})</p>
                <ul className="space-y-1">
                  {topics.map((tp) => (
                    <li key={tp._id}>
                      <Link to={tp.url} className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium hover:bg-muted hover:text-brand">
                        <span className="truncate">Topic {tp.number}: {t(tp.title)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}

            {exercises.length > 0 && (
              <nav aria-label={term('exercise')} className="rounded-2xl border bg-card p-4">
                <p className="mb-2 text-xs font-extrabold tracking-wide text-muted-foreground uppercase">{term('exercise')} ({exercises.length})</p>
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

      {/* PDF Modal Viewer Dialog */}
      <PdfViewerDialog
        open={Boolean(activePdfUrl)}
        onOpenChange={(isOpen) => !isOpen && setActivePdfUrl(null)}
        url={activePdfUrl}
        title={activePdfTitle}
        downloadAllowed={downloadAllowed}
      />
    </>
  );
}
