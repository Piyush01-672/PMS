import { Mail, MapPin, Phone } from 'lucide-react';
import { RichContent } from '@/components/content/RichContent.jsx';
import { useL10n } from '@/lib/i18n';
import { useSite } from '@/lib/site';
import { ContentHeader } from './ContentHeader.jsx';

export default function StaticPage({ data, breadcrumbs }) {
  const t = useL10n();
  const site = useSite();
  const { page } = data;
  const contact = site?.settings?.contact || {};

  return (
    <>
      <ContentHeader breadcrumbs={breadcrumbs} title={t(page.title, page.languageMode)} subtitle={t(page.excerpt, page.languageMode)} />
      <div className="container-page grid max-w-5xl gap-8 py-8 lg:grid-cols-3">
        <article className={page.template === 'contact' ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <div className="rounded-2xl border bg-card p-5 sm:p-8">
            <RichContent html={t(page.content, page.languageMode)} />
            {page.template === 'legal' && page.updatedAt && (
              <p className="mt-8 border-t pt-4 text-xs text-muted-foreground">Last updated: {new Date(page.updatedAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
            )}
          </div>
        </article>
        {page.template === 'contact' && (
          <aside className="space-y-3 rounded-2xl border bg-card p-5">
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted">
                <Mail className="size-5 text-brand" /> <span className="break-all">{contact.email}</span>
              </a>
            )}
            {contact.phone && (
              <a href={`tel:${contact.phone}`} className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted">
                <Phone className="size-5 text-brand" /> {contact.phone}
              </a>
            )}
            {t(contact.address) && (
              <p className="flex items-start gap-3 p-2">
                <MapPin className="mt-0.5 size-5 shrink-0 text-brand" /> {t(contact.address)}
              </p>
            )}
            {!contact.email && !contact.phone && !t(contact.address) && (
              <p className="text-sm text-muted-foreground">Contact details can be added in Admin → Website Settings.</p>
            )}
          </aside>
        )}
      </div>
    </>
  );
}
