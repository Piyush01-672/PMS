import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { adminUrl } from '@/lib/config';
import { EditorShell } from '../components/EditorShell.jsx';
import { ChapterFilter, ClassFilter, useQueryFilters } from '../components/filters.jsx';
import { L10nField, LanguageModeField, SlugField, TextField } from '../components/fields/Fields.jsx';
import { RefSelect } from '../components/fields/RefSelect.jsx';
import { RichL10nField } from '../components/fields/RichL10nField.jsx';
import { VideoField } from '../components/fields/VideoField.jsx';
import { LocalizedCell } from '../components/LocalizedCell.jsx';
import { Panel } from '../components/PageHeader.jsx';
import { PreviewDialog } from '../components/PreviewDialog.jsx';
import { ResourceListPage } from '../components/ResourceListPage.jsx';
import { SeoFields } from '../components/SeoFields.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { stripTags } from '../lib/format.js';
import { refId, useResourceItem, useResourceList } from '../lib/resources.js';
import { EditorGate, useEditorForm } from '../lib/useEditorForm.jsx';

export function ExercisesList() {
  const [filters, setFilter, active] = useQueryFilters(['class', 'chapter']);
  return (
    <ResourceListPage
      resource="exercises"
      title="Exercises (प्रश्नावली)"
      description="Each अध्याय can contain unlimited प्रश्नावली. Choose an अध्याय to reorder them."
      baseParams={active}
      filters={
        <>
          <ClassFilter value={filters.class} onChange={(v) => setFilter('class', v)} />
          <ChapterFilter classId={filters.class} value={filters.chapter} onChange={(v) => setFilter('chapter', v)} />
        </>
      }
      createPath={adminUrl(`exercises/new${filters.chapter ? `?chapter=${filters.chapter}` : ''}`)}
      createLabel="New प्रश्नावली"
      editPath={(item) => adminUrl(`exercises/${item._id}`)}
      reorderable
      reorderDisabledReason={filters.chapter ? undefined : 'Choose a class and अध्याय to reorder प्रश्नावली.'}
      rowLabel={(e) => `प्रश्नावली ${e.number}`}
      columns={[
        { header: 'प्रश्नावली', className: 'w-28', cell: (e) => <span className="font-heading font-extrabold text-brand">{e.number}</span> },
        { header: 'अध्याय', cell: (e) => (e.chapter ? <LocalizedCell value={{ hi: `${e.chapter.number}. ${e.chapter.title?.hi || ''}`, en: e.chapter.title?.en }} /> : '—') },
        { header: 'Title', className: 'hidden lg:table-cell', cell: (e) => <LocalizedCell value={e.title} /> },
        { header: 'Class', className: 'hidden sm:table-cell', cell: (e) => (e.class ? `Class ${e.class.number}` : '—') },
      ]}
    />
  );
}

function ExerciseQuestionsPanel({ exerciseId }) {
  const list = useResourceList('questions', { exercise: exerciseId, limit: 200 });
  return (
    <Panel
      title="Questions"
      actions={
        <Button asChild size="sm" variant="outline">
          <Link to={adminUrl(`questions/new?exercise=${exerciseId}`)}>
            <Plus /> Add question
          </Link>
        </Button>
      }
    >
      {list.data?.items?.length ? (
        <ul className="max-h-80 space-y-1 overflow-y-auto">
          {list.data.items.map((q) => (
            <li key={q._id}>
              <Link to={adminUrl(`questions/${q._id}`)} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted">
                <span className="w-8 font-bold">Q{q.number}</span>
                <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{stripTags(q.text?.hi || q.text?.en || q.text?.mixed)}</span>
                <StatusBadge doc={q} />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No questions yet.</p>
      )}
      {list.data?.items?.length > 1 && (
        <Button asChild variant="link" size="sm" className="mt-2 px-0">
          <Link to={adminUrl(`questions?class=${list.data.items[0].class?._id || ''}&chapter=${list.data.items[0].chapter?._id || ''}&exercise=${exerciseId}`)}>Reorder questions →</Link>
        </Button>
      )}
    </Panel>
  );
}

const EXERCISE_DEFAULTS = { chapter: null, number: '', title: {}, slug: '', description: {}, instructions: {}, introVideo: null, notes: {}, languageMode: 'auto', seo: {}, status: 'draft', isVisible: true };

export function ExerciseEditor({ id }) {
  const [params] = useSearchParams();
  const editor = useEditorForm({ resource: 'exercises', id, basePath: adminUrl('exercises'), defaults: { ...EXERCISE_DEFAULTS, chapter: params.get('chapter') || null } });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [classId, setClassId] = useState('');
  const { form, setField } = editor;
  const chapterDetail = useResourceItem('chapters', refId(form?.chapter));
  const chapter = chapterDetail.data;

  useEffect(() => {
    if (!classId && chapter?.class?._id) setClassId(chapter.class._id);
  }, [chapter, classId]);

  const path = chapter?.class?.slug && chapter?.subject?.slug && form?.slug ? `/${chapter.class.slug}/${chapter.subject.slug}/${chapter.slug}/${form.slug}` : null;

  return (
    <EditorGate editor={editor}>
      {() => (
        <>
          <EditorShell
            title={editor.isNew ? 'New प्रश्नावली (exercise)' : `प्रश्नावली ${form.number}`}
            description={chapter ? `Class ${chapter.class?.number} · अध्याय ${chapter.number} — ${chapter.title?.hi || chapter.title?.en}` : 'Choose the अध्याय this प्रश्नावली belongs to.'}
            backTo={adminUrl('exercises')}
            backLabel="All exercises"
            doc={editor.doc}
            form={form}
            setField={setField}
            dirty={editor.dirty}
            saving={editor.saving}
            onSave={editor.save}
            onPreview={() => (path && !editor.isNew ? setPreviewOpen(true) : toast.info('Save once to preview.'))}
            onDuplicate={editor.duplicate}
            onDelete={() => editor.remove()}
            sidebar={
              <>
                <Panel title="Display">
                  <LanguageModeField value={form.languageMode} onChange={(v) => setField('languageMode', v)} />
                </Panel>
                {!editor.isNew && <ExerciseQuestionsPanel exerciseId={id} />}
              </>
            }
          >
            <Panel title="Location & number">
              <div className="grid gap-4 sm:grid-cols-2">
                <RefSelect
                  label="Class"
                  resource="classes"
                  value={classId || null}
                  onChange={(v) => {
                    setClassId(v?._id || '');
                    setField('chapter', null);
                  }}
                />
                <RefSelect label="अध्याय" required resource="chapters" value={form.chapter} onChange={(v) => setField('chapter', v)} params={classId ? { class: classId } : {}} />
                <TextField label="प्रश्नावली number" required value={form.number} onChange={(v) => setField('number', v)} placeholder="5.2" />
                <SlugField value={form.slug} onChange={(v) => setField('slug', v)} suggestion={form.number ? `prashnavali-${form.number}` : ''} />
                <L10nField className="sm:col-span-2" label="Title (optional)" value={form.title} onChange={(v) => setField('title', v)} placeholder="AP का n वाँ पद / nth term of an AP" />
              </div>
            </Panel>
            <Panel title="Description & instructions">
              <div className="space-y-4">
                <RichL10nField label="Description" value={form.description} onChange={(v) => setField('description', v)} minimal />
                <RichL10nField label="Instructions" value={form.instructions} onChange={(v) => setField('instructions', v)} minimal />
              </div>
            </Panel>
            <Panel title="Video">
              <VideoField label="प्रश्नावली introduction video" value={form.introVideo} onChange={(v) => setField('introVideo', v)} />
            </Panel>
            <Panel title="Notes">
              <RichL10nField value={form.notes} onChange={(v) => setField('notes', v)} />
            </Panel>
            <Panel title="SEO">
              <SeoFields
                value={form.seo}
                onChange={(v) => setField('seo', v)}
                fallbackTitle={chapter ? `Class ${chapter.class?.number} Maths अध्याय ${chapter.number} प्रश्नावली ${form.number}` : ''}
                fallbackDescription={stripTags(form.description?.hi || form.description?.en)}
                path={path}
              />
            </Panel>
          </EditorShell>
          <PreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} path={path} entityType="Exercise" id={id} data={form} />
        </>
      )}
    </EditorGate>
  );
}
