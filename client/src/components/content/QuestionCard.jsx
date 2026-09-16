import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Lightbulb, Link2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { availableLanguages, hasContent, useL10n, useLang } from '@/lib/i18n';
import { useTerm } from '@/lib/site';
import { cn } from '@/lib/utils';
import { DifficultyBadge } from './badges.jsx';
import { Callout } from './Callout.jsx';
import { Figure } from './Figure.jsx';
import { toViewerImage, useImageViewer } from './ImageViewer.jsx';
import { RichContent } from './RichContent.jsx';
import { SolutionRenderer } from './SolutionRenderer.jsx';
import { YouTubeEmbed } from './YouTubeEmbed.jsx';

function Attachments({ items, images, offset = 0 }) {
  const t = useL10n();
  const term = useTerm();
  const { openViewer } = useImageViewer();
  if (!items.length) return null;
  return (
    <div className={cn('grid gap-4', items.length > 1 && 'sm:grid-cols-2')}>
      {items.map((item, i) => (
        <Figure
          key={item._id}
          media={item.media}
          alt={t(item.alt) || t(item.media?.alt) || term(item.kind === 'image' ? 'figure' : item.kind)}
          caption={t(item.caption)}
          label={item.kind !== 'image' ? term(item.kind === 'construction' ? 'diagram' : item.kind) : undefined}
          onOpen={() => openViewer(images, offset + i)}
        />
      ))}
    </div>
  );
}

export function QuestionCard({ question, headingLevel = 'h2', showPermalink = true, defaultOpen = true, className }) {
  const t = useL10n();
  const term = useTerm();
  const { lang } = useLang();
  const [hintOpen, setHintOpen] = useState(false);
  const [solutionOpen, setSolutionOpen] = useState(defaultOpen);
  const Heading = headingLevel;
  const mode = question.languageMode || 'auto';

  const toImage = (a) => toViewerImage(a.media, { alt: t(a.alt) || t(a.media?.alt), caption: t(a.caption) });
  const questionAttachments = (question.attachments || []).filter((a) => a.placement !== 'solution');
  const solutionAttachments = (question.attachments || []).filter((a) => a.placement === 'solution');
  const questionImages = questionAttachments.map(toImage);
  const solutionImages = solutionAttachments.map(toImage);

  const video = question.video?.video ? question.video : null;
  const blocks = question.solution?.blocks || [];
  const hasFinalBlock = blocks.some((b) => b.type === 'finalAnswer');
  const answerHtml = t(question.answer, mode);
  const hasSolution = blocks.length > 0 || hasContent(question.answer);
  const langs = availableLanguages(question.text);
  const onlyOther = mode === 'auto' && langs.length === 1 && langs[0] !== lang;

  return (
    <article id={`q-${question.slug}`} className={cn('scroll-mt-24 overflow-hidden rounded-2xl border bg-card shadow-[0_1px_3px_rgba(30,27,75,0.05)]', className)}>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/35 px-4 py-2.5 sm:px-5">
        <div className="flex flex-wrap items-center gap-2">
          <Heading className="text-sm font-bold">
            <span className="inline-flex h-7 items-center rounded-lg bg-brand px-2.5 font-heading text-[13px] text-brand-foreground">
              {term('question')} {question.number}
            </span>
          </Heading>
          <DifficultyBadge difficulty={question.difficulty} />
          {question.marks ? (
            <span className="inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] font-semibold text-muted-foreground">
              {question.marks} {term('marks')}
            </span>
          ) : null}
          {question.status && question.status !== 'published' && (
            <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[10px] font-bold text-warning uppercase">{question.status}</span>
          )}
        </div>
        {showPermalink && question.url && (
          <Link to={question.url} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-brand">
            <Link2 className="size-3.5" aria-hidden="true" /> <span className="sr-only sm:not-sr-only">Link</span>
          </Link>
        )}
      </header>

      <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
        {onlyOther && (
          <p className="text-xs text-muted-foreground">{langs[0] === 'hi' ? 'यह प्रश्न केवल हिंदी में उपलब्ध है।' : 'This question is available in English only.'}</p>
        )}
        <RichContent html={t(question.text, mode)} className="text-[16.5px] font-medium sm:text-[17px]" />
        <Attachments items={questionAttachments} images={questionImages} />
        {video?.placement === 'afterQuestion' && <YouTubeEmbed video={video.video} />}

        {hasContent(question.hint) && (
          <div className="rounded-xl border border-saffron/35 bg-saffron-soft/60">
            <button
              type="button"
              onClick={() => setHintOpen((v) => !v)}
              aria-expanded={hintOpen}
              className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-xs font-extrabold tracking-wide text-warning uppercase"
            >
              <span className="flex items-center gap-2">
                <Lightbulb className="size-4" aria-hidden="true" /> {term('hint')}
              </span>
              <ChevronDown className={cn('size-4 transition-transform', hintOpen && 'rotate-180')} aria-hidden="true" />
            </button>
            <AnimatePresence initial={false}>
              {hintOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <RichContent html={t(question.hint, mode)} className="px-4 pb-3 text-sm" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <section aria-label={term('solution')} className="rounded-xl border bg-paper/70 dark:bg-muted/20">
          <div className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
            <h3 className="flex items-center gap-2 text-sm font-extrabold">
              <span className="size-2 rounded-full bg-success" aria-hidden="true" />
              {term('solution')}
            </h3>
            {hasSolution && (
              <button
                type="button"
                onClick={() => setSolutionOpen((v) => !v)}
                aria-expanded={solutionOpen}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {solutionOpen ? term('hideSolution') : term('viewSolution')}
                <ChevronDown className={cn('size-3.5 transition-transform', solutionOpen && 'rotate-180')} aria-hidden="true" />
              </button>
            )}
          </div>
          <AnimatePresence initial={false}>
            {solutionOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                <div className="space-y-4 p-4">
                  {!hasSolution && <p className="text-sm text-muted-foreground">{term('comingSoon')}</p>}
                  {video?.placement === 'beforeSolution' && <YouTubeEmbed video={video.video} />}
                  {blocks.length > 0 && (
                    <SolutionRenderer
                      blocks={blocks}
                      languageMode={question.solution?.languageMode !== 'auto' ? question.solution?.languageMode : mode}
                      extraImages={solutionImages}
                      afterBody={<Attachments items={solutionAttachments} images={solutionImages} />}
                    />
                  )}
                  {blocks.length === 0 && <Attachments items={solutionAttachments} images={solutionImages} />}
                  {!hasFinalBlock && answerHtml && (
                    <Callout variant="answer" title={term('finalAnswer')} className="border-2">
                      <RichContent html={answerHtml} className="font-medium" />
                    </Callout>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {hasContent(question.importantPoint) && (
          <Callout variant="important" title={term('importantPoint')}>
            <RichContent html={t(question.importantPoint, mode)} />
          </Callout>
        )}
        {video?.placement === 'afterSolution' && <YouTubeEmbed video={video.video} />}
      </div>
    </article>
  );
}
