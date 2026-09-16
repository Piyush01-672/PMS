import { useQuery } from '@tanstack/react-query';
import { Navigate, useLocation, useSearchParams } from 'react-router';
import { PreviewBanner } from '@/components/site/PreviewBanner.jsx';
import { Seo, breadcrumbSchema } from '@/components/site/Seo.jsx';
import { ErrorState, NotFoundContent, PageSkeleton } from '@/components/site/States.jsx';
import { get } from '@/lib/api';
import { useLang } from '@/lib/i18n';
import { useHashScroll } from './HomePage.jsx';
import ChapterPage from './content/ChapterPage.jsx';
import ClassPage from './content/ClassPage.jsx';
import ExercisePage from './content/ExercisePage.jsx';
import ImportantQuestionsPage from './content/ImportantQuestionsPage.jsx';
import { NotePage, NotesListPage } from './content/NotesPages.jsx';
import QuestionPage from './content/QuestionPage.jsx';
import StaticPage from './content/StaticPage.jsx';
import SubjectExercisesPage from './content/SubjectExercisesPage.jsx';
import SubjectPage from './content/SubjectPage.jsx';

// API page type → template. Every URL below "/" is resolved from the database; no routes are hardcoded.
const TEMPLATES = {
  class: ClassPage,
  subject: SubjectPage,
  subjectExercises: SubjectExercisesPage,
  notesList: NotesListPage,
  note: NotePage,
  importantQuestions: ImportantQuestionsPage,
  chapter: ChapterPage,
  exercise: ExercisePage,
  question: QuestionPage,
  page: StaticPage,
};
const ARTICLE_TYPES = new Set(['chapter', 'exercise', 'question', 'note']);

export default function ContentPage() {
  const location = useLocation();
  const [params] = useSearchParams();
  const { lang } = useLang();
  const preview = params.get('preview') === '1';
  const previewToken = params.get('previewToken') || undefined;
  const path = location.pathname;

  const query = useQuery({
    queryKey: ['resolve', path, preview, previewToken],
    queryFn: () => get('/public/resolve', { path, preview: preview ? 1 : undefined, previewToken }),
  });
  useHashScroll(query.isSuccess);

  if (query.isPending) return <PageSkeleton />;
  if (query.isError) {
    if (query.error.status === 404) {
      return (
        <>
          <Seo title="Page not found" robots="noindex,follow" />
          <NotFoundContent />
        </>
      );
    }
    return (
      <div className="container-page py-16">
        <ErrorState error={query.error} onRetry={query.refetch} />
      </div>
    );
  }

  const result = query.data;
  if (result.type === 'redirect') return <Navigate to={`${result.redirect}${location.search}${location.hash}`} replace />;
  const Template = TEMPLATES[result.type];
  if (!Template) return <NotFoundContent />;
  const seo = result.seo || {};
  const faq = result.faq?.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: result.faq.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
      }
    : null;

  return (
    <>
      <Seo
        title={seo.title}
        description={seo.description}
        canonical={seo.canonical}
        robots={preview ? 'noindex,nofollow' : seo.robots}
        image={seo.ogImage}
        type={ARTICLE_TYPES.has(result.type) ? 'article' : 'website'}
        jsonLd={[breadcrumbSchema(result.breadcrumbs, lang), faq]}
      />
      {preview && <PreviewBanner />}
      <Template key={path} data={result.data} breadcrumbs={result.breadcrumbs} related={result.related} seo={seo} path={path} preview={preview} previewToken={previewToken} />
    </>
  );
}
