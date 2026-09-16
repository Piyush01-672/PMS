import { Lock } from 'lucide-react';
import { lazy, Suspense } from 'react';
import { Link, Route, Routes, useParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { EmptyState, PageSkeleton } from '@/components/site/States.jsx';
import { adminUrl } from '@/lib/config';
import { AdminLayout } from './components/AdminLayout.jsx';
import { AdminAuthProvider, RequireAdmin, useAdminAuth } from './lib/auth.jsx';
import OverviewPage from './pages/OverviewPage.jsx';

// Each admin area is code-split; pages export several named components.
const named = (loader, name) => lazy(() => loader().then((module) => ({ default: module[name] })));
const classes = () => import('./pages/ClassesPage.jsx');
const chapters = () => import('./pages/ChaptersPage.jsx');
const exercises = () => import('./pages/ExercisesPage.jsx');
const questions = () => import('./pages/QuestionsPage.jsx');
const notes = () => import('./pages/NotesPage.jsx');
const templates = () => import('./pages/TemplatesPage.jsx');
const pages = () => import('./pages/PagesPage.jsx');
const media = () => import('./pages/MediaPages.jsx');
const homepage = () => import('./pages/HomepagePages.jsx');
const settings = () => import('./pages/SettingsPages.jsx');
const system = () => import('./pages/SystemPages.jsx');

const ClassesList = named(classes, 'ClassesList');
const ClassEditor = named(classes, 'ClassEditor');
const SubjectsList = named(classes, 'SubjectsList');
const SubjectEditor = named(classes, 'SubjectEditor');
const ChaptersList = named(chapters, 'ChaptersList');
const ChapterEditor = named(chapters, 'ChapterEditor');
const ExercisesList = named(exercises, 'ExercisesList');
const ExerciseEditor = named(exercises, 'ExerciseEditor');
const QuestionsList = named(questions, 'QuestionsList');
const QuestionEditor = named(questions, 'QuestionEditor');
const SolutionsList = named(questions, 'SolutionsList');
const NotesList = named(notes, 'NotesList');
const NoteEditor = named(notes, 'NoteEditor');
const ImportantQuestionsList = named(notes, 'ImportantQuestionsList');
const ImportantQuestionEditor = named(notes, 'ImportantQuestionEditor');
const TemplatesList = named(templates, 'TemplatesList');
const TemplateEditor = named(templates, 'TemplateEditor');
const PagesList = named(pages, 'PagesList');
const PageEditor = named(pages, 'PageEditor');
const MediaLibraryPage = named(media, 'MediaLibraryPage');
const DiagramsPage = named(media, 'DiagramsPage');
const VideosList = named(media, 'VideosList');
const VideoEditor = named(media, 'VideoEditor');
const HomepagePage = named(homepage, 'HomepagePage');
const SectionEditor = named(homepage, 'SectionEditor');
const WebsiteSettingsPage = named(settings, 'WebsiteSettingsPage');
const HeaderSettingsPage = named(settings, 'HeaderSettingsPage');
const NavigationPage = named(settings, 'NavigationPage');
const FooterSettingsPage = named(settings, 'FooterSettingsPage');
const LanguageSettingsPage = named(settings, 'LanguageSettingsPage');
const SeoPage = named(settings, 'SeoPage');
const AdsPage = named(settings, 'AdsPage');
const RelatedContentPage = named(settings, 'RelatedContentPage');
const AdminsPage = named(system, 'AdminsPage');
const ActivityPage = named(system, 'ActivityPage');
const BackupsPage = named(system, 'BackupsPage');
const AccountPage = named(system, 'AccountPage');

/** Editors get key={id} so switching documents always starts with a fresh form. */
function EditorRoute({ component: Component }) {
  const { id } = useParams();
  return <Component key={id} id={id} />;
}

function Guard({ permission, children }) {
  const { can } = useAdminAuth();
  if (!can(permission)) {
    return <EmptyState icon={Lock} title="No access" description="Your role cannot open this page. Ask the owner (superadmin) for access." />;
  }
  return children;
}

function AdminNotFound() {
  return (
    <div className="rounded-2xl border bg-card p-10 text-center">
      <h1 className="text-xl font-bold">Admin page not found</h1>
      <Button asChild className="mt-4">
        <Link to={adminUrl('')}>Back to overview</Link>
      </Button>
    </div>
  );
}

const guarded = (permission, element) => <Guard permission={permission}>{element}</Guard>;

export default function AdminApp() {
  return (
    <AdminAuthProvider>
      <RequireAdmin>
        <AdminLayout>
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              <Route index element={<OverviewPage />} />

              <Route path="classes" element={<ClassesList />} />
              <Route path="classes/:id" element={<EditorRoute component={ClassEditor} />} />
              <Route path="subjects" element={<SubjectsList />} />
              <Route path="subjects/:id" element={<EditorRoute component={SubjectEditor} />} />
              <Route path="chapters" element={<ChaptersList />} />
              <Route path="chapters/:id" element={<EditorRoute component={ChapterEditor} />} />
              <Route path="exercises" element={<ExercisesList />} />
              <Route path="exercises/:id" element={<EditorRoute component={ExerciseEditor} />} />
              <Route path="questions" element={<QuestionsList />} />
              <Route path="questions/:id" element={<EditorRoute component={QuestionEditor} />} />
              <Route path="solutions" element={<SolutionsList />} />
              <Route path="notes" element={<NotesList />} />
              <Route path="notes/:id" element={<EditorRoute component={NoteEditor} />} />
              <Route path="important-questions" element={<ImportantQuestionsList />} />
              <Route path="important-questions/:id" element={<EditorRoute component={ImportantQuestionEditor} />} />
              <Route path="templates" element={<TemplatesList />} />
              <Route path="templates/:id" element={<EditorRoute component={TemplateEditor} />} />

              <Route path="media" element={<MediaLibraryPage />} />
              <Route path="diagrams" element={<DiagramsPage />} />
              <Route path="videos" element={<VideosList />} />
              <Route path="videos/:id" element={<EditorRoute component={VideoEditor} />} />

              <Route path="homepage" element={<HomepagePage />} />
              <Route path="homepage/:id" element={<EditorRoute component={SectionEditor} />} />
              <Route path="pages" element={<PagesList />} />
              <Route path="pages/:id" element={<EditorRoute component={PageEditor} />} />
              <Route path="related" element={<RelatedContentPage />} />
              <Route path="seo" element={<SeoPage />} />
              <Route path="settings" element={guarded('settings:write', <WebsiteSettingsPage />)} />
              <Route path="header" element={guarded('settings:write', <HeaderSettingsPage />)} />
              <Route path="navigation" element={guarded('settings:write', <NavigationPage />)} />
              <Route path="footer" element={guarded('settings:write', <FooterSettingsPage />)} />
              <Route path="language" element={guarded('settings:write', <LanguageSettingsPage />)} />
              <Route path="ads" element={guarded('settings:write', <AdsPage />)} />

              <Route path="admins" element={guarded('users:manage', <AdminsPage />)} />
              <Route path="activity" element={guarded('activity:read', <ActivityPage />)} />
              <Route path="backups" element={guarded('backup:read', <BackupsPage />)} />
              <Route path="account" element={<AccountPage />} />

              <Route path="*" element={<AdminNotFound />} />
            </Routes>
          </Suspense>
        </AdminLayout>
      </RequireAdmin>
    </AdminAuthProvider>
  );
}
