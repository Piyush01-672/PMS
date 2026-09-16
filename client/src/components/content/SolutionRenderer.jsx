import { Check, Copy, DraftingCompass } from 'lucide-react';
import { useState } from 'react';
import { useL10n, useLang } from '@/lib/i18n';
import { useTerm } from '@/lib/site';
import { cn } from '@/lib/utils';
import { Callout } from './Callout.jsx';
import { Figure } from './Figure.jsx';
import { toViewerImage, useImageViewer } from './ImageViewer.jsx';
import { CopyLatexButton, MathFormula } from './MathFormula.jsx';
import { RichContent } from './RichContent.jsx';
import { YouTubeEmbed } from './YouTubeEmbed.jsx';

const FORCED_MODE = { hindiText: 'hi', englishText: 'en', mixedText: 'mixed' };
const MEDIA_TYPES = new Set(['image', 'diagram', 'graph']);
const MEDIA_TERM = { image: 'figure', diagram: 'diagram', graph: 'graph' };

/** Collects every image in a solution so the viewer can move next/previous through them. */
export function blockImages(blocks, pick) {
  return (blocks || []).flatMap((block) =>
    MEDIA_TYPES.has(block.type)
      ? block.media.map((m) => toViewerImage(m.media, { alt: pick(m.alt) || pick(m.media?.alt), caption: pick(m.caption) }))
      : [],
  );
}

function CopyTextButton({ getText }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(getText());
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* ignore */
        }
      }}
      className="inline-flex items-center gap-1 rounded-md border bg-background/80 px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
    >
      {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
      Copy
    </button>
  );
}

function BlockTitle({ children, className }) {
  if (!children) return null;
  return <h4 className={cn('mb-2 text-sm font-bold text-foreground', className)}>{children}</h4>;
}

function StepBlock({ number, title, html, latex, mode, t, term }) {
  return (
    <div className="relative flex gap-3 sm:gap-4">
      <div className="flex flex-col items-center">
        <span className="z-10 grid size-8 shrink-0 place-items-center rounded-full bg-indigo-soft text-xs font-extrabold text-indigo ring-4 ring-background" aria-hidden="true">
          {number}
        </span>
        <span className="w-0.5 flex-1 bg-indigo-soft" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1 pb-2">
        <p className="mb-1 text-[11px] font-bold tracking-wide text-indigo uppercase">
          {term('step')} {number}
          {title ? ` · ${title}` : ''}
        </p>
        {html && <RichContent html={t(html, mode)} />}
        {latex && (
          <div className="mt-2 rounded-lg border border-dashed bg-paper px-3 py-2 dark:bg-muted/40">
            <MathFormula latex={latex} />
          </div>
        )}
      </div>
    </div>
  );
}

export function SolutionBlock({ block, stepNumber, images, parentMode }) {
  const t = useL10n();
  const term = useTerm();
  const { openViewer } = useImageViewer();
  const mode = FORCED_MODE[block.type] || (block.languageMode !== 'auto' ? block.languageMode : parentMode) || 'auto';
  const title = t(block.title);
  const html = block.content;

  switch (block.type) {
    case 'step':
    case 'calculation':
      return <StepBlock number={stepNumber} title={title} html={html} latex={block.latex} mode={mode} t={t} term={term} />;

    case 'formula':
      return (
        <div className="rounded-xl border-2 border-indigo/25 bg-card p-4">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="rounded-full bg-indigo-soft px-2.5 py-0.5 text-[11px] font-extrabold tracking-wide text-indigo uppercase">
              {title || term('formula')}
            </span>
            <CopyLatexButton latex={block.latex} />
          </div>
          <MathFormula latex={block.latex} display={block.displayMode !== false} className="text-lg" />
          {t(html, mode) && <RichContent html={t(html, mode)} className="mt-2 text-sm text-muted-foreground" />}
        </div>
      );

    case 'construction':
      return (
        <div className="rounded-xl border bg-card">
          <p className="flex items-center gap-2 border-b bg-muted/50 px-4 py-2.5 text-xs font-extrabold tracking-wide text-foreground uppercase">
            <DraftingCompass className="size-4 text-brand" aria-hidden="true" /> {title || term('construction')}
          </p>
          <RichContent html={t(html, mode)} className="px-4 py-3" />
        </div>
      );

    case 'image':
    case 'diagram':
    case 'graph': {
      const label = title || term(MEDIA_TERM[block.type]);
      return (
        <div className={cn('grid gap-4', block.media.length > 1 && 'sm:grid-cols-2')}>
          {block.media.map((item) => {
            const alt = t(item.alt) || t(item.media?.alt) || label;
            const index = images.findIndex((img) => img.src && img.src === toViewerImage(item.media).src);
            return (
              <Figure
                key={item._id || item.media?._id}
                media={item.media}
                alt={alt}
                caption={t(item.caption)}
                label={label}
                onOpen={() => openViewer(images, Math.max(index, 0))}
              />
            );
          })}
        </div>
      );
    }

    case 'youtube':
      return <YouTubeEmbed video={block.video} title={title || undefined} />;

    case 'note':
      return (
        <Callout variant="note" title={title || term('note')}>
          <RichContent html={t(html, mode)} />
        </Callout>
      );
    case 'tip':
      return (
        <Callout variant="tip" title={title || term('tip')}>
          <RichContent html={t(html, mode)} />
        </Callout>
      );
    case 'warning':
      return (
        <Callout variant="warning" title={title || term('warning')}>
          <RichContent html={t(html, mode)} />
        </Callout>
      );

    case 'finalAnswer': {
      const answerHtml = t(html, mode);
      return (
        <Callout
          variant="answer"
          title={title || term('finalAnswer')}
          action={answerHtml ? <CopyTextButton getText={() => answerHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()} /> : null}
          className="border-2"
        >
          <RichContent html={answerHtml} className="font-medium" />
          {block.latex && <MathFormula latex={block.latex} className="mt-2" />}
        </Callout>
      );
    }

    case 'table':
    case 'text':
    case 'hindiText':
    case 'englishText':
    case 'mixedText':
    case 'explanation':
    default:
      return (
        <div>
          <BlockTitle>{title}</BlockTitle>
          {t(html, mode) && <RichContent html={t(html, mode)} />}
          {block.latex && <MathFormula latex={block.latex} className="mt-2" />}
        </div>
      );
  }
}

/** Renders solution blocks in the exact order configured by the admin. */
export function SolutionRenderer({ blocks, languageMode = 'auto', extraImages = [], afterBody, className }) {
  const t = useL10n();
  const { lang } = useLang();
  const list = blocks || [];
  const hasHindiBlock = list.some((b) => b.type === 'hindiText');
  const hasEnglishBlock = list.some((b) => b.type === 'englishText');
  const visible = list.filter((b) => !(b.type === 'hindiText' && lang === 'en' && hasEnglishBlock) && !(b.type === 'englishText' && lang === 'hi' && hasHindiBlock));
  const images = [...blockImages(visible, t), ...extraImages];

  const body = visible.filter((b) => b.type !== 'finalAnswer');
  const answers = visible.filter((b) => b.type === 'finalAnswer');
  let step = 0;

  return (
    <div className={cn('space-y-4', className)}>
      {body.map((block) => {
        if (block.type === 'step' || block.type === 'calculation') step += 1;
        return <SolutionBlock key={block._id} block={block} stepNumber={step} images={images} parentMode={languageMode} />;
      })}
      {afterBody}
      {answers.map((block) => (
        <SolutionBlock key={block._id} block={block} images={images} parentMode={languageMode} />
      ))}
    </div>
  );
}
