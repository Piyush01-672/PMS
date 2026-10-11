import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Loader2,
  Sparkles,
  Video,
} from 'lucide-react';
import { Fragment, useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/content/badges.jsx';
import { LanguageNotice } from '@/components/content/LanguageNotice.jsx';
import { PdfViewerDialog } from '@/components/content/PdfViewerDialog.jsx';
import { QuestionCard } from '@/components/content/QuestionCard.jsx';
import { RichContent } from '@/components/content/RichContent.jsx';
import { YouTubeEmbed } from '@/components/content/YouTubeEmbed.jsx';
import { StudySidebar } from '@/components/site/StudySidebar.jsx';
import { EmptyState } from '@/components/site/States.jsx';
import { errorMessage, get } from '@/lib/api';
import { hasContent, useL10n } from '@/lib/i18n';
import { useTerm } from '@/lib/site';
import { cn } from '@/lib/utils';
import { ContentHeader, PrevNext } from './ContentHeader.jsx';

export default function ReferenceSolutionsPage({ data, breadcrumbs, path, preview, previewToken }) {
  const t = useL10n();
  const term = useTerm();
  const {
    level = 'hub',
    book,
    class: cls,
    chapter,
    exercise,
    books = [],
    classes = [],
    chapters = [],
    exercises = [],
    resources = [],
    questions: initialQuestions = [],
    pagination = {},
    siblings = [],
    prev,
    next,
  } = data;

  const [activePdfUrl, setActivePdfUrl] = useState(null);
  const [activePdfTitle, setActivePdfTitle] = useState('');
  const [downloadAllowed, setDownloadAllowed] = useState(true);

  // Exercise pagination state
  const [pages, setPages] = useState([initialQuestions]);
  const [page, setPage] = useState(pagination.page || 1);
  const [loading, setLoading] = useState(false);
  const questions = pages.flat();
  const hasMore = pagination.pages && page < pagination.pages;

  const openPdf = (url, title, canDownload = true) => {
    setActivePdfUrl(url);
    setActivePdfTitle(title);
    setDownloadAllowed(canDownload);
  };

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

  // 1. HUB LEVEL: /reference-solutions
  if (level === 'hub') {
    return (
      <>
        <ContentHeader
          breadcrumbs={breadcrumbs}
          watermark="Ref"
          eyebrow={<Chip tone="brand">Reference Solutions</Chip>}
          title={{
            hi: 'संदर्भ पुस्तक समाधान (Reference Book Solutions)',
            en: 'Mathematics Reference Book Solutions',
          }}
          subtitle="Chapter-wise and exercise-wise step-by-step solutions for RS Aggarwal, RD Sharma, and ML Aggarwal for Classes 6 to 12."
        />

        <div className="container-page py-10">
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="space-y-8 lg:col-span-8">
              <div className="grid gap-6">
                {books.map((b) => (
                  <div
                    key={b.slug}
                    className="flex flex-col justify-between rounded-3xl border bg-card p-6 shadow-xs transition hover:border-brand/40 sm:p-8"
                  >
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand uppercase">
                          {b.category || 'Reference Book'}
                        </span>
                        <span className="text-xs text-muted-foreground">{b.author}</span>
                      </div>
                      <h2 className="font-heading text-xl font-bold text-foreground sm:text-2xl">
                        {t(b.title)}
                      </h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {t(b.description)}
                      </p>

                      <div className="mt-6">
                        <p className="mb-2.5 text-xs font-bold text-muted-foreground uppercase">Select Class for Solutions:</p>
                        <div className="flex flex-wrap gap-2">
                          {(b.classes || [6, 7, 8, 9, 10, 11, 12]).map((cNum) => (
                            <Link
                              key={cNum}
                              to={`/reference-solutions/${b.slug}/class-${cNum}`}
                              className="rounded-xl border bg-background px-3.5 py-1.5 text-xs font-bold text-foreground transition hover:border-brand hover:bg-brand hover:text-white"
                            >
                              Class {cNum}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 border-t pt-4">
                      <Link
                        to={`/reference-solutions/${b.slug}`}
                        className="inline-flex items-center text-sm font-bold text-brand hover:underline"
                      >
                        View All Chapters & Exercises for {t(b.title)} <ArrowRight className="ml-1.5 size-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4">
              <StudySidebar />
            </div>
          </div>
        </div>
      </>
    );
  }

  // 2. BOOK HUB LEVEL: /reference-solutions/:bookSlug
  if (level === 'book') {
    return (
      <>
        <ContentHeader
          breadcrumbs={breadcrumbs}
          watermark="Book"
          eyebrow={<Chip tone="brand">{t(book?.title) || 'Reference Book'}</Chip>}
          title={book.title}
          subtitle={`Complete exercise-wise step-by-step solutions for ${book.title?.en || t(book.title)} across middle and high school classes.`}
        />

        <div className="container-page py-10">
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="space-y-8 lg:col-span-8">
              <div className="rounded-3xl border bg-card p-6 sm:p-8">
                <h2 className="mb-2 font-heading text-xl font-bold text-foreground">
                  Select Your Class for {t(book.title)}
                </h2>
                <p className="mb-6 text-sm text-muted-foreground">
                  Choose your class below to access detailed chapter-by-chapter exercise solutions, step-by-step formulas, and free PDF notes:
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  {(book.classes || [10, 9, 8, 7, 6, 11, 12]).map((cNum) => (
                    <Link
                      key={cNum}
                      to={`/reference-solutions/${book.slug}/class-${cNum}`}
                      className="group flex items-center justify-between rounded-2xl border bg-background p-4 shadow-xs transition hover:border-brand hover:shadow-md"
                    >
                      <div className="flex items-center gap-3.5">
                        <span className="grid size-11 place-items-center rounded-xl bg-brand/10 font-heading text-base font-extrabold text-brand transition group-hover:bg-brand group-hover:text-white">
                          {cNum}
                        </span>
                        <div>
                          <h3 className="font-heading text-base font-bold text-foreground group-hover:text-brand">
                            Class {cNum} Solutions
                          </h3>
                          <p className="text-xs text-muted-foreground">Chapter & Exercise Solutions</p>
                        </div>
                      </div>
                      <ChevronRight className="size-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-brand" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-4">
              <StudySidebar currentBook={book} />
            </div>
          </div>
        </div>
      </>
    );
  }

  // 3. BOOK + CLASS LEVEL: /reference-solutions/:bookSlug/class-:number
  if (level === 'class') {
    return (
      <>
        <ContentHeader
          breadcrumbs={breadcrumbs}
          watermark={`C${cls.number}`}
          eyebrow={
            <div className="flex items-center gap-2">
              <Chip tone="brand">Class {cls.number}</Chip>
              <Chip>{t(book.title)}</Chip>
            </div>
          }
          title={{
            hi: `${t(book.title)} कक्षा ${cls.number} गणित समाधान`,
            en: `${book.title?.en || t(book.title)} Solutions for Class ${cls.number} Maths`,
          }}
          subtitle={`Complete chapter-wise and exercise-wise solutions for Class ${cls.number} Mathematics as per latest board curriculum.`}
        />

        <div className="container-page py-10">
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-8">
              {/* Introduction box */}
              <div className="rounded-2xl border bg-card p-5 text-sm text-foreground/90">
                <p>
                  Welcome to <strong>{t(book.title)} Class {cls.number}</strong> solutions index on Passion Maths Study.
                  Every exercise contains clear step-by-step explanations, diagrams, formulas, and downloadable PDFs.
                </p>
              </div>

              {/* Chapters and Exercise Links */}
              <div className="space-y-4">
                <h2 className="font-heading text-lg font-bold text-foreground">
                  Class {cls.number} Chapters & Exercises
                </h2>

                {chapters.length === 0 ? (
                  <EmptyState title="No chapters found" description="Chapters for this reference book will appear here." />
                ) : (
                  <div className="space-y-4">
                    {chapters.map((ch) => (
                      <div key={ch._id} className="rounded-2xl border bg-card p-5 shadow-xs transition hover:border-brand/40">
                        <div className="mb-3 flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                          <Link to={ch.url} className="group">
                            <span className="text-xs font-bold text-brand uppercase">Chapter {ch.number}</span>
                            <h3 className="font-heading text-base font-bold text-foreground group-hover:text-brand">
                              {t(ch.title)}
                            </h3>
                          </Link>

                          <div className="flex gap-2">
                            {ch.pdfUrl && (
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openPdf(ch.pdfUrl, `${t(ch.title)} PDF`)}>
                                <Eye className="mr-1 size-3" /> PDF
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="h-7 text-xs" asChild>
                              <Link to={ch.url}>Chapter Page →</Link>
                            </Button>
                          </div>
                        </div>

                        {/* Clickable exercise pills */}
                        {ch.exercises?.length > 0 && (
                          <div className="border-t pt-3">
                            <p className="mb-2 text-[11px] font-bold text-muted-foreground uppercase">Exercises:</p>
                            <div className="flex flex-wrap gap-2">
                              {ch.exercises.map((ex) => (
                                <Link
                                  key={ex.slug || ex.number}
                                  to={ex.url || `${ch.url}/${ex.slug}`}
                                  className="rounded-lg border bg-background px-3 py-1 text-xs font-bold transition hover:border-brand hover:bg-brand hover:text-white"
                                >
                                  Exercise {ex.number}
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-4">
              <StudySidebar currentBook={book} currentClass={cls} chapters={chapters} />
            </div>
          </div>
        </div>

        <PdfViewerDialog
          open={Boolean(activePdfUrl)}
          onOpenChange={(open) => !open && setActivePdfUrl(null)}
          url={activePdfUrl}
          title={activePdfTitle}
          downloadAllowed={downloadAllowed}
        />
      </>
    );
  }

  // 4. BOOK CHAPTER LEVEL: /reference-solutions/:bookSlug/class-:number/:chapterSlug
  if (level === 'chapter') {
    return (
      <>
        <ContentHeader
          breadcrumbs={breadcrumbs}
          watermark={`Ch${chapter.number}`}
          eyebrow={
            <div className="flex items-center gap-2">
              <Chip tone="brand">Class {cls.number}</Chip>
              <Chip>{t(book.title)}</Chip>
              <Chip>Chapter {chapter.number}</Chip>
            </div>
          }
          title={{
            hi: `${t(book.title)} कक्षा ${cls.number} अध्याय ${chapter.number}: ${t(chapter.title)}`,
            en: `${book.title?.en || t(book.title)} Class ${cls.number} Chapter ${chapter.number}: ${chapter.title?.en || t(chapter.title)}`,
          }}
          subtitle={`Exercise-wise step-by-step solutions, key concept summaries, and PDF download for Chapter ${chapter.number}.`}
        />

        <div className="container-page py-10">
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="space-y-8 lg:col-span-8">
              {/* Video embed if present */}
              {chapter.introVideo && <YouTubeEmbed video={chapter.introVideo} />}

              {/* PDF Banner */}
              {(chapter.pdfUrl || chapter.pdfFile?.url) && (
                <div className="flex flex-col justify-between gap-3 rounded-2xl border bg-gradient-to-r from-red-500/10 via-brand/10 to-amber-500/10 p-5 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-brand text-white">
                      <FileText className="size-5" />
                    </span>
                    <div>
                      <h3 className="font-heading text-sm font-bold text-foreground">
                        Chapter {chapter.number} Complete Solution PDF
                      </h3>
                      <p className="text-xs text-muted-foreground">Download or view the verified solutions guide</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openPdf(chapter.pdfUrl || chapter.pdfFile?.url, `${t(chapter.title)} PDF`)}>
                      <Eye className="mr-1.5 size-3.5" /> View PDF
                    </Button>
                    <Button size="sm" variant="default" asChild>
                      <a href={chapter.pdfUrl || chapter.pdfFile?.url} download target="_blank" rel="noopener noreferrer">
                        <Download className="mr-1.5 size-3.5" /> Download
                      </a>
                    </Button>
                  </div>
                </div>
              )}

              {/* Clickable exercises list */}
              <section className="space-y-4">
                <h2 className="font-heading text-lg font-bold text-foreground">
                  Select Exercise in Chapter {chapter.number}
                </h2>

                <div className="grid gap-3 sm:grid-cols-2">
                  {exercises.map((ex) => (
                    <Link
                      key={ex.slug || ex.number}
                      to={ex.url || `${chapter.url}/${ex.slug}`}
                      className="group flex items-center justify-between rounded-2xl border bg-card p-4 shadow-xs transition hover:border-brand hover:shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <span className="grid size-10 place-items-center rounded-xl bg-brand/10 font-heading text-sm font-extrabold text-brand transition group-hover:bg-brand group-hover:text-white">
                          {ex.number}
                        </span>
                        <div>
                          <h3 className="font-heading text-sm font-bold text-foreground group-hover:text-brand">
                            Exercise {ex.number}
                          </h3>
                          <p className="text-xs text-muted-foreground">Step-by-step solutions</p>
                        </div>
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-brand" />
                    </Link>
                  ))}
                </div>
              </section>

              {/* Chapter overview if available */}
              {chapter.shortDescription && (
                <div className="rounded-2xl border bg-card p-5">
                  <h3 className="mb-2 font-heading text-sm font-bold text-foreground">Chapter Overview</h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">{t(chapter.shortDescription)}</p>
                </div>
              )}

              <PrevNext prev={prev} next={next} t={t} />
            </div>

            <div className="lg:col-span-4">
              <StudySidebar currentBook={book} currentClass={cls} chapters={chapters} />
            </div>
          </div>
        </div>

        <PdfViewerDialog
          open={Boolean(activePdfUrl)}
          onOpenChange={(open) => !open && setActivePdfUrl(null)}
          url={activePdfUrl}
          title={activePdfTitle}
          downloadAllowed={downloadAllowed}
        />
      </>
    );
  }

  // 5. BOOK EXERCISE LEVEL: /reference-solutions/:bookSlug/class-:number/:chapterSlug/:exerciseSlug
  return (
    <>
      <ContentHeader
        breadcrumbs={breadcrumbs}
        watermark={`Ex${exercise.number}`}
        eyebrow={
          <div className="flex items-center gap-2">
            <Chip tone="brand">Class {cls.number}</Chip>
            <Chip>{t(book.title)}</Chip>
            <Link to={chapter.url} className="text-xs font-semibold text-muted-foreground hover:text-brand">
              Ch {chapter.number} · {t(chapter.title)}
            </Link>
          </div>
        }
        title={{
          hi: `${t(book.title)} कक्षा ${cls.number} अध्याय ${chapter.number} अभ्यास ${exercise.number}`,
          en: `${book.title?.en || t(book.title)} Class ${cls.number} Chapter ${chapter.number} Exercise ${exercise.number} Solutions`,
        }}
        subtitle={`Detailed step-by-step solutions for Exercise ${exercise.number} with mathematical formulas, diagrams, and video lessons.`}
        aside={<LanguageNotice />}
      />

      {/* Sibling exercises navigation bar */}
      {siblings.length > 1 && (
        <nav aria-label="Exercises" className="border-b bg-background">
          <div className="container-page flex gap-2 overflow-x-auto py-3">
            {siblings.map((s) => (
              <Link
                key={s.slug || s.number}
                to={s.url || `${chapter.url}/${s.slug}`}
                className={cn(
                  'shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-bold transition',
                  s.number === exercise.number
                    ? 'border-brand bg-brand text-brand-foreground shadow-xs'
                    : 'bg-card hover:border-brand/40 hover:text-brand',
                )}
              >
                Exercise {s.number}
              </Link>
            ))}
          </div>
        </nav>
      )}

      <div className="container-page py-10">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="min-w-0 space-y-6 lg:col-span-8">
            {/* Embedded video if present */}
            {exercise.introVideo && <YouTubeEmbed video={exercise.introVideo} />}

            {/* Exercise PDF Solution Action Card */}
            {(exercise.pdfUrl || chapter.pdfUrl) && (
              <div className="flex flex-col justify-between gap-3 rounded-2xl border bg-gradient-to-r from-brand/5 to-amber-500/5 p-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-brand text-white">
                    <FileText className="size-4" />
                  </span>
                  <div>
                    <h3 className="font-heading text-xs font-bold text-foreground">
                      Exercise {exercise.number} PDF Solution Sheet
                    </h3>
                    <p className="text-[11px] text-muted-foreground">View online or download offline file</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => openPdf(exercise.pdfUrl || chapter.pdfUrl, `Exercise ${exercise.number} PDF`)}>
                    <Eye className="mr-1 size-3.5" /> View PDF
                  </Button>
                  <Button size="sm" variant="default" className="h-8 text-xs" asChild>
                    <a href={exercise.pdfUrl || chapter.pdfUrl} download target="_blank" rel="noopener noreferrer">
                      <Download className="mr-1 size-3.5" /> Download
                    </a>
                  </Button>
                </div>
              </div>
            )}

            {/* Question cards */}
            {questions.length === 0 ? (
              <div className="rounded-3xl border bg-card p-8 text-center">
                <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-brand/10 text-brand">
                  <BookOpen className="size-6" />
                </div>
                <h3 className="font-heading text-base font-bold text-foreground">
                  Exercise {exercise.number} Solutions
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Digital question blocks for this exercise are being updated. Use the PDF button above to view complete step-by-step solutions.
                </p>
              </div>
            ) : (
              questions.map((question) => (
                <QuestionCard key={question._id} question={question} />
              ))
            )}

            {hasMore && (
              <div className="flex justify-center pt-2">
                <Button size="lg" variant="outline" onClick={loadMore} disabled={loading} className="h-11 rounded-xl px-6">
                  {loading && <Loader2 className="animate-spin" />}
                  {term('loadMore')} ({questions.length}/{pagination.total})
                </Button>
              </div>
            )}

            <PrevNext prev={prev} next={next} t={t} />
          </div>

          <div className="lg:col-span-4">
            <StudySidebar currentBook={book} currentClass={cls} chapters={chapters} />
          </div>
        </div>
      </div>

      <PdfViewerDialog
        open={Boolean(activePdfUrl)}
        onOpenChange={(open) => !open && setActivePdfUrl(null)}
        url={activePdfUrl}
        title={activePdfTitle}
        downloadAllowed={downloadAllowed}
      />
    </>
  );
}
