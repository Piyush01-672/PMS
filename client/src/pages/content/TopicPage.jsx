import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileCheck,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Lightbulb,
  ListOrdered,
  Lock,
  Menu,
  Play,
  Share2,
  Sparkles,
  Star,
  Video,
} from 'lucide-react';
import { useEffect, useState } from 'react';
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
import { VideoPlayer } from '@/components/content/VideoPlayer.jsx';
import { AdSlot } from '@/components/site/AdSlot.jsx';
import { hasContent, useL10n, useLang } from '@/lib/i18n';
import { useTerm } from '@/lib/site';
import { cn } from '@/lib/utils';
import { ContentHeader, PrevNext, StatPills, otherLanguage } from './ContentHeader.jsx';

function DifficultyBadge({ difficulty }) {
  const diff = String(difficulty || 'beginner').toLowerCase();
  const tones = {
    beginner: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
    easy: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
    medium: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
    hard: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800',
  };
  const labels = {
    beginner: 'Beginner / शुरुआती',
    easy: 'Easy / आसान',
    medium: 'Medium / मध्यम',
    hard: 'Hard / कठिन',
  };
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold', tones[diff] || tones.beginner)}>
      <Sparkles className="size-3" />
      {labels[diff] || diff}
    </span>
  );
}

function PracticeQuestionItem({ q, index }) {
  const t = useL10n();
  const [openSolution, setOpenSolution] = useState(false);
  const [openHint, setOpenHint] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border bg-card transition-all hover:border-brand/30 hover:shadow-sm">
      <div className="p-5 sm:p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-brand-soft text-xs font-extrabold text-brand">
              Q{q.questionNumber || index + 1}
            </span>
            {q.difficulty && <DifficultyBadge difficulty={q.difficulty} />}
          </div>
          {q.marks && (
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {q.marks} {q.marks > 1 ? 'Marks' : 'Mark'}
            </span>
          )}
        </div>

        <div className="text-base font-medium text-foreground sm:text-lg">
          <RichContent html={t(q.question)} />
        </div>

        {/* Hint Dropdown */}
        {hasContent(q.hint) && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setOpenHint(!openHint)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400"
            >
              <Lightbulb className="size-3.5" />
              {openHint ? 'Hide Hint' : 'Show Hint / संकेत'}
            </button>
            {openHint && (
              <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
                <RichContent html={t(q.hint)} />
              </div>
            )}
          </div>
        )}

        {/* Answer & Solution Toggle */}
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t pt-4">
          <Button
            size="sm"
            variant={openSolution ? 'outline' : 'default'}
            onClick={() => setOpenSolution(!openSolution)}
            className="text-xs font-semibold"
          >
            <CheckCircle className="mr-1.5 size-3.5" />
            {openSolution ? 'Hide Solution / हल छिपाएं' : 'View Step-by-Step Solution / हल देखें'}
          </Button>

          {hasContent(q.answer) && !openSolution && (
            <div className="text-xs text-muted-foreground">
              <strong className="text-foreground">Answer:</strong>
              <RichContent html={t(q.answer)} className="inline text-xs text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Solution Content */}
        {openSolution && (
          <div className="mt-4 rounded-xl border bg-muted/40 p-4 sm:p-5">
            <p className="mb-2 text-xs font-extrabold tracking-wider text-brand uppercase">Step-by-Step Solution / चरणबद्ध हल</p>
            {hasContent(q.answer) && (
              <div className="mb-3 rounded-lg bg-brand-soft/50 p-2.5 text-xs font-semibold text-brand">
                Final Answer:
                <RichContent html={t(q.answer)} className="mt-1 text-xs font-semibold text-brand" />
              </div>
            )}
            <RichContent html={t(q.solution)} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function TopicPage({ data, breadcrumbs, related }) {
  const t = useL10n();
  const term = useTerm();
  const { lang } = useLang();
  const { openViewer } = useImageViewer();

  const { class: cls, subject, chapter, topic, resources = [], books = [], siblings = [], exercises = [], prev, next } = data;
  const chapterUrl = chapter?.url || (cls && subject && chapter ? `/${cls.slug}/${subject.slug}/${chapter.slug}` : '#');
  const mode = topic.languageMode || 'auto';

  // Active video & PDF viewer modal state
  const [activePdfUrl, setActivePdfUrl] = useState(null);
  const [activePdfTitle, setActivePdfTitle] = useState('');
  const [downloadAllowed, setDownloadAllowed] = useState(true);

  // Group resources by type
  const pdfNotes = resources.filter((r) => ['notes', 'revision'].includes(r.resourceType));
  const worksheets = resources.filter((r) => ['worksheet', 'assignment', 'form'].includes(r.resourceType));
  const practicePapers = resources.filter((r) => ['practice_paper', 'sample_paper', 'previous_year_paper', 'question_bank'].includes(r.resourceType));
  const solutions = resources.filter((r) => r.resourceType === 'solution');
  const otherResources = resources.filter((r) => !['notes', 'revision', 'worksheet', 'assignment', 'form', 'practice_paper', 'sample_paper', 'previous_year_paper', 'question_bank', 'solution'].includes(r.resourceType));

  // Videos list (single or playlist)
  const allVideos = [];
  if (topic.video) allVideos.push(topic.video);
  if (topic.videos?.length) {
    topic.videos.forEach((v) => {
      if (v && !allVideos.some((ev) => String(ev._id || ev.url) === String(v._id || v.url))) {
        allVideos.push(v);
      }
    });
  }

  // Contents nav items based on available data
  const navItems = [
    { id: 'overview', label: 'Overview / अवलोकन', icon: Sparkles, show: true },
    { id: 'videos', label: `Video Lessons (${allVideos.length})`, icon: Video, show: allVideos.length > 0 },
    { id: 'notes', label: 'Study Notes / नोट्स', icon: BookOpen, show: hasContent(topic.notes) },
    { id: 'pdf-resources', label: `PDF Notes & Files (${resources.length})`, icon: FileText, show: resources.length > 0 },
    { id: 'formulas', label: `Formula Sheet (${topic.formulas?.length || 0})`, icon: Sparkles, show: topic.formulas?.length > 0 },
    { id: 'practice', label: `Practice Questions (${topic.practiceQuestions?.length || 0})`, icon: HelpCircle, show: topic.practiceQuestions?.length > 0 },
    { id: 'worksheets', label: `Worksheets (${worksheets.length})`, icon: FileSpreadsheet, show: worksheets.length > 0 },
    { id: 'solutions', label: 'Solutions / हल', icon: FileCheck, show: solutions.length > 0 },
    { id: 'books', label: `Reference Books (${books.length})`, icon: BookOpen, show: books.length > 0 },
    { id: 'links', label: `External Resources (${topic.externalLinks?.length || 0})`, icon: ExternalLink, show: topic.externalLinks?.length > 0 },
    { id: 'continue', label: 'Continue Learning', icon: ArrowRight, show: true },
  ].filter((item) => item.show);

  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 },
    );

    navItems.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [navItems]);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleOpenPdf = (url, title, canDownload = true) => {
    setActivePdfUrl(url);
    setActivePdfTitle(title);
    setDownloadAllowed(canDownload);
  };

  const cover = topic.featuredImage || topic.image || chapter.featuredImage;

  return (
    <>
      <ContentHeader
        breadcrumbs={breadcrumbs}
        watermark={topic.number}
        eyebrow={
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone="brand">
              {term('class')} {cls.number}
            </Chip>
            <Chip>
              {term('chapter')} {chapter.number}
            </Chip>
            <span className="rounded-full bg-slate-900 px-3 py-0.5 text-xs font-bold text-white dark:bg-white dark:text-slate-900">
              Topic {topic.number}
            </span>
            {topic.difficulty && <DifficultyBadge difficulty={topic.difficulty} />}
          </div>
        }
        title={t(topic.title, mode)}
        subtitle={[otherLanguage(topic.title, lang), t(topic.shortDescription, mode)].filter(Boolean).join(' — ')}
        aside={<LanguageNotice />}
      >
        <StatPills
          items={[
            ...(allVideos.length > 0 ? [{ value: allVideos.length, label: 'Videos' }] : []),
            ...(resources.length > 0 ? [{ value: resources.length, label: 'PDFs & Files' }] : []),
            ...(topic.formulas?.length > 0 ? [{ value: topic.formulas.length, label: 'Formulas' }] : []),
            ...(topic.practiceQuestions?.length > 0 ? [{ value: topic.practiceQuestions.length, label: 'Questions' }] : []),
            ...(books.length > 0 ? [{ value: books.length, label: 'Books' }] : []),
            ...(topic.estimatedTime ? [{ value: t(topic.estimatedTime) || '30 min', label: 'Est. Time' }] : []),
          ]}
        />
      </ContentHeader>

      <div className="container-page grid gap-8 py-8 lg:grid-cols-12">
        {/* Main Learning Content Area (8 Cols) */}
        <div className="min-w-0 space-y-10 lg:col-span-8">
          {/* 1. Overview Section */}
          <section id="overview" className="scroll-mt-24">
            {cover?.url && (
              <Figure
                media={cover}
                alt={t(cover.alt) || t(topic.title)}
                priority
                onOpen={() => openViewer([toViewerImage(cover, { alt: t(cover.alt) })])}
              />
            )}
            {t(topic.shortDescription) && (
              <div className="mt-4 rounded-2xl border border-brand/20 bg-brand-soft/40 p-5 text-sm leading-relaxed text-foreground sm:text-base">
                <p className="font-semibold text-brand">Concept Summary:</p>
                <p className="mt-1 text-muted-foreground">{t(topic.shortDescription)}</p>
              </div>
            )}
          </section>

          {/* 2. Video Lessons Section */}
          {allVideos.length > 0 && (
            <section id="videos" aria-labelledby="videos-heading" className="scroll-mt-24 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-9 place-items-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
                    <Video className="size-5" />
                  </span>
                  <div>
                    <h2 id="videos-heading" className="font-heading text-xl font-bold text-foreground">
                      Video Lessons / वीडियो कक्षाएं
                    </h2>
                    <p className="text-xs text-muted-foreground">Comprehensive video lectures with step-by-step concepts</p>
                  </div>
                </div>
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
                  {allVideos.length} {allVideos.length > 1 ? 'Videos' : 'Video'}
                </span>
              </div>

              <VideoPlayer playlist={allVideos} />
            </section>
          )}

          {/* 3. Study Notes Section */}
          {hasContent(topic.notes) && (
            <section id="notes" aria-labelledby="notes-heading" className="scroll-mt-24 space-y-4">
              <div className="flex items-center gap-2.5 border-b pb-3">
                <span className="grid size-9 place-items-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                  <BookOpen className="size-5" />
                </span>
                <div>
                  <h2 id="notes-heading" className="font-heading text-xl font-bold text-foreground">
                    Study Notes / अध्ययन नोट्स
                  </h2>
                  <p className="text-xs text-muted-foreground">Detailed mathematical explanation, definitions and theorems</p>
                </div>
              </div>

              <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
                <RichContent html={t(topic.notes, mode)} className="prose-lg" />
              </div>
            </section>
          )}

          {/* 4. Important Formulas Section */}
          {topic.formulas?.length > 0 && (
            <section id="formulas" aria-labelledby="formulas-heading" className="scroll-mt-24 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-9 place-items-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                    <Sparkles className="size-5" />
                  </span>
                  <div>
                    <h2 id="formulas-heading" className="font-heading text-xl font-bold text-foreground">
                      Important Formulas / मुख्य सूत्र
                    </h2>
                    <p className="text-xs text-muted-foreground">Formulas, equations, and mathematical identities for quick recall</p>
                  </div>
                </div>
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  {topic.formulas.length} Formulas
                </span>
              </div>

              <div className="grid gap-3.5 sm:grid-cols-2">
                {topic.formulas.map((formula, idx) => (
                  <div key={formula._id || idx} className="rounded-2xl border-2 border-indigo/20 bg-card p-4 transition-all hover:border-indigo/40 hover:shadow-sm">
                    <div className="mb-2 flex items-center justify-between gap-2 border-b border-border/50 pb-2">
                      <span className="text-xs font-bold text-indigo">{t(formula.title) || `Formula ${idx + 1}`}</span>
                      <CopyLatexButton latex={formula.latex} />
                    </div>
                    <div className="py-2 text-center">
                      <MathFormula latex={formula.latex} className="text-lg font-semibold sm:text-xl" />
                    </div>
                    {t(formula.description) && <p className="mt-2 border-t border-border/40 pt-2 text-xs text-muted-foreground">{t(formula.description)}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 5. PDF & Downloadable Study Material Section */}
          {resources.length > 0 && (
            <section id="pdf-resources" aria-labelledby="pdf-resources-heading" className="scroll-mt-24 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-9 place-items-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                    <FileText className="size-5" />
                  </span>
                  <div>
                    <h2 id="pdf-resources-heading" className="font-heading text-xl font-bold text-foreground">
                      PDF Notes & Downloadable Material / अध्ययन सामग्री
                    </h2>
                    <p className="text-xs text-muted-foreground">Download chapter notes, formula sheets, worksheets and practice assignments</p>
                  </div>
                </div>
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
                  {resources.length} {resources.length > 1 ? 'Files' : 'File'}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {resources.map((res) => {
                  const title = t(res.title) || 'Study Material PDF';
                  const desc = t(res.description);
                  const fileUrl = res.fileUrl || res.file?.url;

                  return (
                    <div key={res._id} className="flex flex-col justify-between rounded-2xl border bg-card p-5 transition-all hover:border-brand/40 hover:shadow-md">
                      <div>
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1 rounded-md bg-brand-soft px-2 py-0.5 text-[11px] font-bold text-brand uppercase">
                            <FileText className="size-3" />
                            {res.resourceType.replace(/_/g, ' ')}
                          </span>
                          {res.fileSize && <span className="text-[11px] font-medium text-muted-foreground">{res.fileSize}</span>}
                        </div>
                        <h4 className="font-heading text-base font-bold text-foreground">{title}</h4>
                        {desc && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{desc}</p>}
                      </div>

                      <div className="mt-4 flex items-center gap-2 border-t pt-3">
                        {fileUrl ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenPdf(fileUrl, title, res.downloadAllowed !== false)}
                              className="flex-1 text-xs font-semibold"
                            >
                              <Eye className="mr-1.5 size-3.5" />
                              Preview PDF
                            </Button>
                            {res.downloadAllowed !== false && (
                              <Button size="sm" asChild className="flex-1 text-xs font-semibold">
                                <a href={fileUrl} download target="_blank" rel="noopener noreferrer">
                                  <Download className="mr-1.5 size-3.5" />
                                  Download
                                </a>
                              </Button>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">File unavailable</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 6. Practice Questions Section */}
          {topic.practiceQuestions?.length > 0 && (
            <section id="practice" aria-labelledby="practice-heading" className="scroll-mt-24 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-9 place-items-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                    <HelpCircle className="size-5" />
                  </span>
                  <div>
                    <h2 id="practice-heading" className="font-heading text-xl font-bold text-foreground">
                      Practice Questions & Solutions / अभ्यास प्रश्न व हल
                    </h2>
                    <p className="text-xs text-muted-foreground">Test your understanding with topic-wise problems and solutions</p>
                  </div>
                </div>
                <span className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-bold text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                  {topic.practiceQuestions.length} Questions
                </span>
              </div>

              <div className="space-y-4">
                {topic.practiceQuestions.map((q, idx) => (
                  <PracticeQuestionItem key={q._id || idx} q={q} index={idx} />
                ))}
              </div>
            </section>
          )}

          {/* 7. Worksheets & Assignments Section */}
          {worksheets.length > 0 && (
            <section id="worksheets" aria-labelledby="worksheets-heading" className="scroll-mt-24 space-y-4">
              <div className="flex items-center gap-2.5 border-b pb-3">
                <span className="grid size-9 place-items-center rounded-xl bg-teal-100 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
                  <FileSpreadsheet className="size-5" />
                </span>
                <div>
                  <h2 id="worksheets-heading" className="font-heading text-xl font-bold text-foreground">
                    Worksheets & Assignments / अभ्यास पत्रक
                  </h2>
                  <p className="text-xs text-muted-foreground">Downloadable homework sheets, activity sheets, and practice forms</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {worksheets.map((ws) => {
                  const title = t(ws.title) || 'Practice Worksheet';
                  const fileUrl = ws.fileUrl || ws.file?.url;

                  return (
                    <div key={ws._id} className="rounded-2xl border bg-card p-5">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="rounded-md bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                          Worksheet
                        </span>
                        {ws.fileSize && <span className="text-[11px] text-muted-foreground">{ws.fileSize}</span>}
                      </div>
                      <h4 className="font-heading text-base font-bold">{title}</h4>
                      {t(ws.description) && <p className="mt-1 text-xs text-muted-foreground">{t(ws.description)}</p>}
                      <div className="mt-4 flex gap-2">
                        {fileUrl && (
                          <Button size="sm" asChild className="w-full">
                            <a href={fileUrl} download target="_blank" rel="noopener noreferrer">
                              <Download className="mr-1.5 size-3.5" />
                              Download Worksheet PDF
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

          {/* 8. Reference Books Section */}
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
                    <p className="text-xs text-muted-foreground">Expert recommended textbooks, NCERT guides & competitive books</p>
                  </div>
                </div>
                <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-bold text-orange-800 dark:bg-orange-950 dark:text-orange-300">
                  {books.length} Books
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {books.map((b) => {
                  const title = t(b.title) || 'Mathematics Reference Book';
                  const desc = t(b.description);
                  const rec = t(b.recommendedFor);
                  const coverUrl = b.coverUrl || b.coverImage?.url;

                  return (
                    <div key={b._id} className="flex flex-col justify-between overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:border-orange-300 hover:shadow-md">
                      <div className="flex gap-4 p-4 sm:p-5">
                        <div className="relative aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-xl bg-muted shadow-md">
                          {coverUrl ? (
                            <img src={coverUrl} alt={title} className="size-full object-cover" />
                          ) : (
                            <div className="grid size-full place-items-center bg-gradient-to-br from-amber-100 to-orange-200 text-orange-700 dark:from-amber-950 dark:to-orange-900 dark:text-orange-300">
                              <BookOpen className="size-8" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="inline-block rounded-md bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-700 uppercase dark:bg-orange-950 dark:text-orange-300">
                            {b.category?.replace(/_/g, ' ') || 'Reference Book'}
                          </span>
                          <h4 className="mt-1 font-heading text-base font-bold leading-snug text-foreground">{title}</h4>
                          <p className="text-xs font-semibold text-muted-foreground">By {b.author}</p>
                          {b.publisher && <p className="text-[11px] text-muted-foreground">{b.publisher} {b.edition ? `• ${b.edition}` : ''}</p>}
                          {b.price && <p className="mt-1 text-xs font-extrabold text-brand">{b.price}</p>}
                        </div>
                      </div>

                      <div className="border-t bg-muted/20 px-4 py-3">
                        {rec && <p className="mb-2.5 text-xs text-muted-foreground"><strong className="text-foreground">Recommended for:</strong> {rec}</p>}
                        {desc && !rec && <p className="mb-2.5 line-clamp-2 text-xs text-muted-foreground">{desc}</p>}
                        {b.purchaseUrl ? (
                          <Button size="sm" className="w-full bg-orange-600 font-bold text-white hover:bg-orange-700" asChild>
                            <a href={b.purchaseUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="mr-1.5 size-3.5" />
                              Buy Book / खरीदें ↗
                            </a>
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" className="w-full text-xs" disabled>
                            Available in Stores
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 9. External Reference Links */}
          {topic.externalLinks?.length > 0 && (
            <section id="links" aria-labelledby="links-heading" className="scroll-mt-24 space-y-4">
              <div className="flex items-center gap-2.5 border-b pb-3">
                <span className="grid size-9 place-items-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                  <ExternalLink className="size-5" />
                </span>
                <div>
                  <h2 id="links-heading" className="font-heading text-xl font-bold text-foreground">
                    Additional Learning & References / उपयोगी लिंक्स
                  </h2>
                  <p className="text-xs text-muted-foreground">Verified external articles, interactive applets, and learning materials</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {topic.externalLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col justify-between rounded-2xl border bg-card p-4 transition-all hover:border-brand/40 hover:shadow-md"
                  >
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs font-bold text-brand">
                        <span className="uppercase">{link.category || 'Reference'}</span>
                        <ExternalLink className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </div>
                      <h4 className="font-heading text-sm font-bold text-foreground group-hover:text-brand">{t(link.title)}</h4>
                      {t(link.description) && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t(link.description)}</p>}
                    </div>
                    <span className="mt-3 truncate text-[11px] text-muted-foreground/80">{link.url.replace(/^https?:\/\//, '')}</span>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* In-content Advertisement Slot */}
          <AdSlot placement="inContent" pageType="topic" className="px-0" />

          {/* 10. Continue Learning / Prev & Next Navigation */}
          <section id="continue" className="scroll-mt-24 space-y-6 pt-4">
            <div className="rounded-2xl border bg-gradient-to-r from-brand-soft via-indigo-soft/30 to-purple-soft/40 p-6 shadow-sm">
              <h3 className="font-heading text-lg font-bold text-foreground">
                Continue Learning in {t(chapter.title)}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Progress through all topics and exercises to master this chapter.
              </p>

              {/* Prev / Next Topic Actions */}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {prev ? (
                  <Link
                    to={prev.url}
                    className="group flex items-center gap-3 rounded-xl border bg-card p-3.5 transition hover:border-brand/40 hover:shadow-sm"
                  >
                    <ArrowLeft className="size-4 shrink-0 text-brand transition-transform group-hover:-translate-x-1" />
                    <div className="min-w-0 flex-1">
                      <span className="block text-[11px] font-bold text-muted-foreground uppercase">Previous Topic</span>
                      <span className="block truncate font-heading text-sm font-bold text-foreground group-hover:text-brand">
                        {t(prev.title)}
                      </span>
                    </div>
                  </Link>
                ) : (
                  <div className="rounded-xl border border-dashed p-3.5 text-center text-xs text-muted-foreground">
                    First topic of this chapter
                  </div>
                )}

                {next ? (
                  <Link
                    to={next.url}
                    className="group flex items-center justify-between gap-3 rounded-xl border bg-card p-3.5 transition hover:border-brand/40 hover:shadow-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="block text-[11px] font-bold text-muted-foreground uppercase">Next Topic</span>
                      <span className="block truncate font-heading text-sm font-bold text-foreground group-hover:text-brand">
                        {t(next.title)}
                      </span>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-brand transition-transform group-hover:translate-x-1" />
                  </Link>
                ) : (
                  <Link
                    to={chapterUrl}
                    className="group flex items-center justify-between gap-3 rounded-xl border bg-card p-3.5 transition hover:border-brand/40 hover:shadow-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="block text-[11px] font-bold text-muted-foreground uppercase">Chapter Overview</span>
                      <span className="block truncate font-heading text-sm font-bold text-foreground group-hover:text-brand">
                        {t(chapter.title)}
                      </span>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-brand transition-transform group-hover:translate-x-1" />
                  </Link>
                )}
              </div>
            </div>

            <RelatedContent items={related} />
          </section>
        </div>

        {/* Sticky Sidebar Navigation (4 Cols) */}
        <aside className="space-y-5 lg:col-span-4">
          <div className="space-y-5 lg:sticky lg:top-[calc(var(--header-height)+1rem)]">
            {/* Table of Contents ("ON THIS PAGE") */}
            <nav aria-label="On this page" className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between border-b pb-2.5">
                <span className="font-heading text-xs font-extrabold tracking-wider text-muted-foreground uppercase">
                  ON THIS PAGE / इस पृष्ठ पर
                </span>
                <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-brand">
                  Class {cls.number}
                </span>
              </div>
              <ul className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => scrollToSection(item.id)}
                        className={cn(
                          'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors',
                          isActive
                            ? 'bg-brand-soft font-bold text-brand ring-1 ring-brand/20'
                            : 'text-foreground/75 hover:bg-muted hover:text-foreground',
                        )}
                      >
                        <Icon className="size-3.5 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Sibling Topics Playlist in Chapter */}
            {siblings.length > 0 && (
              <div className="rounded-2xl border bg-card p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between border-b pb-2.5">
                  <span className="font-heading text-xs font-extrabold tracking-wider text-muted-foreground uppercase">
                    Topics in Chapter ({siblings.length})
                  </span>
                  <Link to={chapterUrl} className="text-[11px] font-semibold text-brand hover:underline">
                    View All
                  </Link>
                </div>
                <ul className="space-y-1.5">
                  {siblings.map((s) => {
                    const isCurrent = String(s._id) === String(topic._id);
                    return (
                      <li key={s._id}>
                        <Link
                          to={s.url}
                          className={cn(
                            'flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs transition-colors',
                            isCurrent
                              ? 'bg-brand-soft font-bold text-brand ring-1 ring-brand/20'
                              : 'text-foreground/80 hover:bg-muted hover:text-foreground',
                          )}
                        >
                          <span className="truncate">
                            {s.number}. {t(s.title)}
                          </span>
                          {s.estimatedTime && <span className="shrink-0 text-[10px] text-muted-foreground">{t(s.estimatedTime)}</span>}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Quick Link to Chapter Exercises */}
            {exercises.length > 0 && (
              <div className="rounded-2xl border bg-card p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between border-b pb-2.5">
                  <span className="font-heading text-xs font-extrabold tracking-wider text-muted-foreground uppercase">
                    Exercises (प्रश्नावली)
                  </span>
                  <span className="text-[11px] text-muted-foreground">{exercises.length} Exercises</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {exercises.map((ex) => (
                    <Link
                      key={ex._id}
                      to={ex.url}
                      className="flex items-center justify-center rounded-lg border border-border/60 bg-muted/30 py-2 text-xs font-semibold text-foreground transition hover:border-brand/40 hover:bg-brand-soft hover:text-brand"
                    >
                      Ex {ex.number}
                    </Link>
                  ))}
                </div>
              </div>
            )}
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
