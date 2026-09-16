import { ListOrdered } from 'lucide-react';
import { Link } from 'react-router';
import { Chip } from '@/components/content/badges.jsx';
import { EmptyState } from '@/components/site/States.jsx';
import { useL10n } from '@/lib/i18n';
import { useTerm } from '@/lib/site';
import { ContentHeader } from './ContentHeader.jsx';

export default function SubjectExercisesPage({ data, breadcrumbs }) {
  const t = useL10n();
  const term = useTerm();
  const { class: cls, subject, chapters } = data;
  const withExercises = chapters.filter((c) => c.exercises?.length);

  return (
    <>
      <ContentHeader
        breadcrumbs={breadcrumbs}
        watermark={cls.number}
        eyebrow={<Chip tone="brand">{t(cls.name) || `${term('class')} ${cls.number}`}</Chip>}
        title={term('exerciseWise')}
        subtitle={`${t(cls.name)} · ${t(subject.name)}`}
      />
      <div className="container-page py-8">
        {withExercises.length === 0 && <EmptyState icon={ListOrdered} title={term('comingSoon')} />}
        <div className="space-y-8">
          {withExercises.map((chapter) => (
            <section key={chapter._id} aria-labelledby={`ch-${chapter._id}`}>
              <h2 id={`ch-${chapter._id}`} className="mb-3 flex flex-wrap items-baseline gap-2 text-lg font-bold">
                <span className="text-brand">
                  {term('chapter')} {chapter.number}
                </span>
                <Link to={chapter.url} className="hover:text-brand">
                  {t(chapter.title)}
                </Link>
              </h2>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {chapter.exercises.map((ex) => (
                  <li key={ex._id}>
                    <Link to={ex.url} className="flex flex-col rounded-xl border bg-card p-4 transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md">
                      <span className="font-heading text-base font-extrabold">
                        {term('exercise')} {ex.number}
                      </span>
                      <span className="mt-1 text-xs text-muted-foreground">
                        {ex.questionCount} {term('questions')}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
