import { ArrowRight, BookOpen, FileText, Star } from 'lucide-react';
import { useRef } from 'react';
import { Link } from 'react-router';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Figure } from '@/components/content/Figure.jsx';
import { toViewerImage, useImageViewer } from '@/components/content/ImageViewer.jsx';
import { MathFormula } from '@/components/content/MathFormula.jsx';
import { RichContent } from '@/components/content/RichContent.jsx';
import { YouTubeEmbed } from '@/components/content/YouTubeEmbed.jsx';
import { SmartLink } from '@/components/site/SmartLink.jsx';
import { Icon } from '@/lib/icons';
import { useL10n } from '@/lib/i18n';
import { gsap, prefersReducedMotion, ScrollTrigger, useGSAP } from '@/lib/motion';
import { useTerm } from '@/lib/site';
import { cn } from '@/lib/utils';
import { SectionButtons, SectionShell } from './SectionShell.jsx';

const COLS = { 1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5', 6: 'lg:grid-cols-6' };

export function StatisticsSection({ section }) {
  const ref = useRef(null);
  const t = useL10n();
  const auto = section.data?.auto || {};
  const valueOf = (raw) => String(raw || '').replace(/\{(\w+)\}/g, (_, key) => (auto[key] ?? ''));

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.utils.toArray('[data-count]', ref.current).forEach((el) => {
        const target = Number(el.dataset.count);
        if (!Number.isFinite(target) || target <= 0) return;
        const counter = { value: 0 };
        ScrollTrigger.create({
          trigger: el,
          start: 'top 92%',
          once: true,
          onEnter: () => gsap.to(counter, { value: target, duration: 1.1, ease: 'power2.out', onUpdate: () => (el.textContent = Math.round(counter.value).toLocaleString('en-IN')) }),
        });
      });
    },
    { scope: ref, dependencies: [section._id, JSON.stringify(auto)] },
  );

  return (
    <SectionShell section={section} className="py-8 sm:py-10">
      <div ref={ref} className={cn('grid grid-cols-2 gap-3 sm:gap-4', COLS[section.config?.columns] || 'lg:grid-cols-4')}>
        {section.items.map((item) => {
          const value = valueOf(item.value);
          const numeric = /^\d+$/.test(value) ? Number(value) : null;
          return (
            <div key={item._id} data-reveal className="flex flex-col items-center rounded-2xl border bg-card p-5 text-center">
              {item.icon && <Icon name={item.icon} className="mb-2 size-7 text-brand" />}
              <span className="font-heading text-3xl font-extrabold text-ink dark:text-foreground" data-count={numeric ?? undefined}>
                {numeric !== null ? numeric.toLocaleString('en-IN') : value}
              </span>
              <span className="mt-1 text-sm text-muted-foreground">{t(item.title)}</span>
            </div>
          );
        })}
      </div>
    </SectionShell>
  );
}

export function StepsSection({ section }) {
  const t = useL10n();
  const items = section.items || [];
  return (
    <SectionShell section={section} className="py-10 sm:py-14" containerClassName="relative">
      <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li
              key={item._id}
              data-reveal
              className={cn('relative flex flex-col rounded-xl border p-4', section.config?.background === 'dark' ? 'border-white/10 bg-white/5' : 'bg-card', last && 'ring-2 ring-saffron/60')}
            >
              <span className="font-mono text-[11px] font-semibold opacity-60">{String(i + 1).padStart(2, '0')}</span>
              <Icon name={item.icon} className={cn('my-2 size-6', last ? 'text-saffron' : 'text-[color-mix(in_oklab,var(--brand)_45%,white)]')} />
              <span className="font-heading text-[15px] font-bold">{t(item.title)}</span>
              {t(item.description) && <span className="mt-0.5 text-xs opacity-70">{t(item.description)}</span>}
            </li>
          );
        })}
      </ol>
    </SectionShell>
  );
}

export function ChapterGridSection({ section }) {
  const t = useL10n();
  const term = useTerm();
  const chapters = section.data?.chapters || [];
  if (!chapters.length) return null;
  return (
    <SectionShell section={section}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {chapters.map((ch) => (
          <Link key={ch._id} to={ch.url} data-reveal className="group flex flex-col justify-between rounded-2xl border bg-card p-5 transition hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg">
            <div>
              <div className="mb-3 flex items-center justify-between text-xs">
                <span className="rounded-full bg-brand-soft px-2.5 py-0.5 font-bold text-brand">
                  {term('class')} {ch.class.number}
                </span>
                <span className="font-semibold text-muted-foreground">
                  {term('chapter')} {ch.number}
                </span>
              </div>
              <h3 className="text-base font-bold group-hover:text-brand">{t(ch.title)}</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">{ch.title.hi && ch.title.en ? (t(ch.title) === ch.title.hi ? ch.title.en : ch.title.hi) : ''}</p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
              <span>
                {ch.exerciseRange ? `${term('exercise')} ${ch.exerciseRange[0]}${ch.exerciseRange[1] !== ch.exerciseRange[0] ? `–${ch.exerciseRange[1]}` : ''}` : term('comingSoon')}
              </span>
              <ArrowRight className="size-4 text-brand transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </div>
          </Link>
        ))}
      </div>
    </SectionShell>
  );
}

export function CardGridSection({ section }) {
  const t = useL10n();
  const cols = section.config?.columns || 3;
  return (
    <SectionShell section={section}>
      <div className={cn('grid gap-4 sm:grid-cols-2', COLS[cols])}>
        {section.items.map((item) => (
          <div key={item._id} data-reveal className="flex flex-col justify-between rounded-2xl border bg-card p-6 transition hover:shadow-lg">
            <div>
              <span className="mb-4 grid size-12 place-items-center rounded-xl bg-indigo-soft text-indigo">
                <Icon name={item.icon} className="size-6" />
              </span>
              {t(item.badge) && <span className="mb-2 inline-block rounded bg-muted px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-muted-foreground uppercase">{t(item.badge)}</span>}
              <h3 className="text-lg font-bold">{t(item.title)}</h3>
              {t(item.description) && <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t(item.description)}</p>}
              {item.latex && (
                <div className="mt-4 rounded-xl border border-dashed bg-paper px-3 py-2 dark:bg-muted/40">
                  <MathFormula latex={item.latex} />
                </div>
              )}
            </div>
            {item.url && (
              <SmartLink to={item.url} className="mt-5 inline-flex items-center justify-between rounded-xl bg-muted px-4 py-2.5 text-sm font-semibold hover:bg-brand-soft hover:text-brand">
                {t(item.title)} <ArrowRight className="size-4" aria-hidden="true" />
              </SmartLink>
            )}
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

export function QuestionListSection({ section }) {
  const t = useL10n();
  const term = useTerm();
  const important = section.data?.importantQuestions || [];
  const questions = section.data?.questions || [];
  if (!important.length && !questions.length) return null;
  return (
    <SectionShell section={section}>
      <ul className="grid gap-3 md:grid-cols-2">
        {important.map((iq) => (
          <li key={iq._id} data-reveal>
            <Link to={iq.url} className="group flex h-full items-start gap-3 rounded-xl border bg-card p-4 hover:border-brand/40 hover:shadow-md">
              <Star className="mt-1 size-4 shrink-0 text-saffron" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <RichContent html={t(iq.text)} className="line-clamp-2 text-[15px] leading-relaxed [&_p]:m-0" />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {t(iq.classLabel)}
                  {iq.chapter && ` · ${term('chapter')} ${iq.chapter.number}`}
                  {iq.marks ? ` · ${iq.marks} ${term('marks')}` : ''}
                </p>
              </div>
            </Link>
          </li>
        ))}
        {questions.map((q) => (
          <li key={q._id} data-reveal>
            <Link to={q.url} className="group flex h-full items-start gap-3 rounded-xl border bg-card p-4 hover:border-brand/40 hover:shadow-md">
              <span className="mt-0.5 rounded bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white">{t(q.questionLabel)}</span>
              <div className="min-w-0 flex-1">
                <RichContent html={t(q.text)} className="line-clamp-2 text-[15px] [&_p]:m-0" />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {t(q.classLabel)} · {t(q.exerciseLabel)}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </SectionShell>
  );
}

export function NotesSection({ section }) {
  const t = useL10n();
  const notes = section.data?.notes || [];
  if (!notes.length) return null;
  return (
    <SectionShell section={section}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {notes.map((note) => (
          <Link key={note._id} to={note.url} data-reveal className="group rounded-2xl border bg-card p-5 hover:border-brand/40 hover:shadow-md">
            <FileText className="mb-3 size-6 text-indigo" aria-hidden="true" />
            <h3 className="font-bold group-hover:text-brand">{t(note.title)}</h3>
            {t(note.summary) && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{t(note.summary)}</p>}
            <p className="mt-3 text-xs font-semibold text-muted-foreground">{t(note.classLabel)}</p>
          </Link>
        ))}
      </div>
    </SectionShell>
  );
}

export function VideoSection({ section }) {
  const videos = [section.video, ...(section.config?.videos || [])].filter((v) => v?.youtubeId);
  if (!videos.length) return null;
  return (
    <SectionShell section={section}>
      <div className={cn('grid gap-5', videos.length > 1 ? 'md:grid-cols-2' : 'mx-auto max-w-3xl')}>
        {videos.map((video) => (
          <div key={video._id} data-reveal>
            <YouTubeEmbed video={video} />
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

export function ImageGallerySection({ section }) {
  const t = useL10n();
  const { openViewer } = useImageViewer();
  const gallery = section.config?.gallery || [];
  if (!gallery.length) return null;
  const images = gallery.map((m) => toViewerImage(m, { alt: t(m.alt), caption: t(m.caption) }));
  return (
    <SectionShell section={section}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {gallery.map((media, i) => (
          <div key={media._id} data-reveal>
            <Figure media={media} alt={t(media.alt) || media.title} caption={t(media.caption)} onOpen={() => openViewer(images, i)} sizes="(min-width: 1024px) 300px, 50vw" />
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

export function CtaSection({ section }) {
  const t = useL10n();
  const background = section.config?.background || 'brand';
  const inverted = background === 'brand' || background === 'dark';
  return (
    <section id={section.name || section._id} className="py-10 sm:py-14">
      <div className="container-page">
        <div
          className={cn(
            'relative overflow-hidden rounded-3xl px-6 py-10 sm:px-12 sm:py-14',
            background === 'dark' ? 'bg-[#1b1d2a] text-white' : inverted ? 'bg-gradient-to-br from-brand to-[color-mix(in_oklab,var(--brand)_50%,var(--saffron))] text-white' : 'border bg-card',
          )}
        >
          <div className="bg-grid pointer-events-none absolute inset-0 opacity-20" aria-hidden="true" />
          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t(section.title)}</h2>
              {t(section.description) && <p className={cn('mt-2', inverted ? 'text-white/80' : 'text-muted-foreground')}>{t(section.description)}</p>}
            </div>
            <SectionButtons buttons={section.buttons} inverted={inverted} />
          </div>
        </div>
      </div>
    </section>
  );
}

export function FaqSection({ section }) {
  const t = useL10n();
  if (!section.items?.length) return null;
  return (
    <SectionShell section={section} containerClassName="max-w-4xl">
      <Accordion type="single" collapsible className="rounded-2xl border bg-card px-5">
        {section.items.map((item) => (
          <AccordionItem key={item._id} value={item._id}>
            <AccordionTrigger className="py-4 text-left text-[15px] font-semibold">{t(item.title)}</AccordionTrigger>
            <AccordionContent className="pb-4 text-[15px] leading-relaxed text-muted-foreground">{t(item.description)}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </SectionShell>
  );
}

export function TextSection({ section }) {
  const t = useL10n();
  return (
    <SectionShell section={section} heading={Boolean(t(section.title))}>
      <div className="grid items-start gap-8 lg:grid-cols-12">
        <div className={section.image?.url ? 'lg:col-span-7' : 'lg:col-span-12'}>
          {section.config?.content && <RichContent html={section.config.content} />}
          {section.items?.length > 0 && (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {section.items.map((item) => (
                <li key={item._id} className="flex items-start gap-2 text-sm">
                  <Icon name={item.icon || 'circle-check'} className="mt-0.5 size-4 text-success" />
                  <span>
                    <strong>{t(item.title)}</strong> {t(item.description)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {section.image?.url && (
          <div className="lg:col-span-5">
            <Figure media={section.image} alt={t(section.image.alt) || t(section.title)} />
          </div>
        )}
      </div>
    </SectionShell>
  );
}

export function RelatedLinksSection({ section }) {
  const t = useL10n();
  if (!section.items?.length) return null;
  return (
    <SectionShell section={section}>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {section.items.map((item) => (
          <li key={item._id}>
            <SmartLink to={item.url} className="group flex items-center gap-3 rounded-xl border bg-card p-4 hover:border-brand/40">
              <BookOpen className="size-5 text-brand" aria-hidden="true" />
              <span className="flex-1 font-semibold group-hover:text-brand">{t(item.title)}</span>
              <ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" />
            </SmartLink>
          </li>
        ))}
      </ul>
    </SectionShell>
  );
}
