import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { Icon } from '@/lib/icons';
import { useL10n } from '@/lib/i18n';
import { useTerm } from '@/lib/site';
import { ContentHeader } from './ContentHeader.jsx';

export default function ClassPage({ data, breadcrumbs }) {
  const t = useL10n();
  const term = useTerm();
  const { class: cls, subjects } = data;
  return (
    <>
      <ContentHeader breadcrumbs={breadcrumbs} watermark={cls.number} title={t(cls.name) || `${term('class')} ${cls.number}`} subtitle={t(cls.description)} />
      <div className="container-page py-8">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <li key={subject._id}>
              <Link to={subject.url} className="group flex items-center gap-4 rounded-2xl border bg-card p-5 hover:border-brand/40 hover:shadow-md">
                <span className="grid size-12 place-items-center rounded-xl bg-brand-soft text-brand">
                  <Icon name={subject.icon} className="size-6" />
                </span>
                <span className="flex-1 text-lg font-bold group-hover:text-brand">{t(subject.name)}</span>
                <ArrowRight className="size-5 text-brand" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
