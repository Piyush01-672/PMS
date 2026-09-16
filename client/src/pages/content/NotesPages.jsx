import { FileText } from 'lucide-react';
import { Link } from 'react-router';
import { Chip } from '@/components/content/badges.jsx';
import { Figure } from '@/components/content/Figure.jsx';
import { toViewerImage, useImageViewer } from '@/components/content/ImageViewer.jsx';
import { LanguageNotice } from '@/components/content/LanguageNotice.jsx';
import { RelatedContent } from '@/components/content/RelatedContent.jsx';
import { RichContent } from '@/components/content/RichContent.jsx';
import { YouTubeEmbed } from '@/components/content/YouTubeEmbed.jsx';
import { EmptyState } from '@/components/site/States.jsx';
import { useL10n } from '@/lib/i18n';
import { useTerm } from '@/lib/site';
import { ContentHeader } from './ContentHeader.jsx';

export function NotesListPage({ data, breadcrumbs }) {
  const t = useL10n();
  const term = useTerm();
  const { class: cls, notes } = data;
  return (
    <>
      <ContentHeader
        breadcrumbs={breadcrumbs}
        watermark={cls.number}
        eyebrow={<Chip tone="brand">{t(cls.name) || `${term('class')} ${cls.number}`}</Chip>}
        title={term('notes')}
        aside={<LanguageNotice />}
      />
      <div className="container-page py-8">
        {notes.length === 0 ? (
          <EmptyState icon={FileText} title={term('comingSoon')} />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {notes.map((note) => (
              <li key={note._id}>
                <Link to={note.url} className="group flex h-full flex-col rounded-2xl border bg-card p-5 transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md">
                  <FileText className="mb-3 size-6 text-indigo" aria-hidden="true" />
                  <span className="font-bold group-hover:text-brand">{t(note.title)}</span>
                  {t(note.summary) && <span className="mt-1 line-clamp-3 text-sm text-muted-foreground">{t(note.summary)}</span>}
                  {note.chapter && (
                    <span className="mt-auto pt-3 text-xs font-semibold text-muted-foreground">
                      {term('chapter')} {note.chapter.number} · {t(note.chapter.title)}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

export function NotePage({ data, breadcrumbs, related }) {
  const t = useL10n();
  const term = useTerm();
  const { openViewer } = useImageViewer();
  const { class: cls, note } = data;
  const images = note.attachments.map((a) => toViewerImage(a.media, { alt: t(a.alt) || t(a.media?.alt), caption: t(a.caption) }));

  return (
    <>
      <ContentHeader
        breadcrumbs={breadcrumbs}
        eyebrow={
          <>
            <Chip tone="brand">
              {term('class')} {cls.number}
            </Chip>
            {note.chapter && (
              <Link to={note.chapter.url} className="inline-flex h-6 items-center rounded-full bg-muted px-2.5 text-[11px] font-semibold text-muted-foreground hover:text-brand">
                {term('chapter')} {note.chapter.number} · {t(note.chapter.title)}
              </Link>
            )}
          </>
        }
        title={t(note.title, note.languageMode)}
        subtitle={t(note.summary, note.languageMode)}
        aside={<LanguageNotice />}
      />
      <div className="container-page max-w-4xl space-y-6 py-8">
        {note.video && <YouTubeEmbed video={note.video} />}
        <article className="rounded-2xl border bg-card p-5 sm:p-8">
          <RichContent html={t(note.content, note.languageMode)} />
        </article>
        {note.attachments.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {note.attachments.map((a, i) => (
              <Figure key={a._id} media={a.media} alt={images[i].alt} caption={images[i].caption} onOpen={() => openViewer(images, i)} />
            ))}
          </div>
        )}
        <RelatedContent items={related} />
      </div>
    </>
  );
}
