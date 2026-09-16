import { ArrowDown, ArrowUp, Plus, Star, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { adminUrl } from '@/lib/config';
import { EditorShell } from '../components/EditorShell.jsx';
import { ClassFilter, useQueryFilters } from '../components/filters.jsx';
import { Field, L10nField, LanguageModeField, NumberField, SlugField, SwitchField } from '../components/fields/Fields.jsx';
import { FormulaInput } from '../components/fields/FormulaInput.jsx';
import { RefMultiSelect, RefSelect } from '../components/fields/RefSelect.jsx';
import { RichL10nField } from '../components/fields/RichL10nField.jsx';
import { VideoField } from '../components/fields/VideoField.jsx';
import { LocalizedCell } from '../components/LocalizedCell.jsx';
import { MediaField } from '../components/media/MediaFields.jsx';
import { Panel } from '../components/PageHeader.jsx';
import { PreviewDialog } from '../components/PreviewDialog.jsx';
import { ResourceListPage } from '../components/ResourceListPage.jsx';
import { SeoFields } from '../components/SeoFields.jsx';
import { DragHandle, SortableList, clientKey, itemKey, moveItem } from '../components/SortableList.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { refId, useResourceList } from '../lib/resources.js';
import { EditorGate, useEditorForm } from '../lib/useEditorForm.jsx';

export function ChaptersList() {
  const [filters, setFilter, active] = useQueryFilters(['class']);
  return (
    <ResourceListPage
      resource="chapters"
      title="Chapters (अध्याय)"
      description="Class → Mathematics → अध्याय. Choose a class to drag-and-drop the chapter order."
      baseParams={active}
      filters={<ClassFilter value={filters.class} onChange={(v) => setFilter('class', v)} />}
      createPath={adminUrl(`chapters/new${filters.class ? `?class=${filters.class}` : ''}`)}
      createLabel="New अध्याय"
      editPath={(item) => adminUrl(`chapters/${item._id}`)}
      reorderable
      reorderDisabledReason={filters.class ? undefined : 'Choose a class to reorder its अध्याय.'}
      rowLabel={(c) => `अध्याय ${c.number} — ${c.title?.en || c.title?.hi || ''}`}
      columns={[
        { header: 'No.', className: 'w-14', cell: (c) => <span className="font-heading font-extrabold text-brand">{c.number}</span> },
        { header: 'Title', cell: (c) => <LocalizedCell value={c.title} /> },
        { header: 'Class', className: 'hidden sm:table-cell', cell: (c) => (c.class ? `Class ${c.class.number}` : '—') },
        { header: 'Featured', className: 'hidden md:table-cell', cell: (c) => (c.featured ? <Star className="size-4 fill-current text-saffron" aria-label="Featured" /> : null) },
      ]}
    />
  );
}

function FormulaListField({ value = [], onChange }) {
  const items = value.map((f) => (itemKey(f) ? f : { ...f, _key: clientKey() }));
  const update = (index, patch) => onChange(items.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  return (
    <Field label="Important formulas" hint="Shown in the “Important Formulas” box of the अध्याय page and searchable by students.">
      <SortableList
        items={items}
        onChange={onChange}
        className="space-y-3"
        renderItem={(formula, index, { ref, style, handleProps }) => (
          <li ref={ref} style={style} className="rounded-xl border bg-background p-3">
            <div className="mb-2 flex items-center gap-1">
              <DragHandle {...handleProps} />
              <span className="text-xs font-semibold text-muted-foreground">Formula {index + 1}</span>
              <span className="ml-auto flex">
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => onChange(moveItem(items, index, index - 1))} disabled={index === 0} aria-label="Move up">
                  <ArrowUp />
                </Button>
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => onChange(moveItem(items, index, index + 1))} disabled={index === items.length - 1} aria-label="Move down">
                  <ArrowDown />
                </Button>
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => onChange(items.filter((_, i) => i !== index))} aria-label="Remove formula">
                  <Trash2 className="text-destructive" />
                </Button>
              </span>
            </div>
            <div className="grid gap-3">
              <L10nField label="Name" value={formula.title} onChange={(title) => update(index, { title })} placeholder="nth term / n वाँ पद" />
              <FormulaInput value={formula.latex} onChange={(latex) => update(index, { latex })} />
              <L10nField label="Short description" value={formula.description} onChange={(description) => update(index, { description })} />
            </div>
          </li>
        )}
      />
      <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => onChange([...items, { _key: clientKey(), title: {}, latex: '', description: {} }])}>
        <Plus /> Add formula
      </Button>
    </Field>
  );
}

function ChapterExercisesPanel({ chapterId, classId }) {
  const list = useResourceList('exercises', { chapter: chapterId, limit: 100 });
  return (
    <Panel
      title="प्रश्नावली in this अध्याय"
      actions={
        <Button asChild size="sm" variant="outline">
          <Link to={adminUrl(`exercises/new?chapter=${chapterId}`)}>
            <Plus /> Add
          </Link>
        </Button>
      }
    >
      {list.data?.items?.length ? (
        <ul className="space-y-1">
          {list.data.items.map((ex) => (
            <li key={ex._id}>
              <Link to={adminUrl(`exercises/${ex._id}`)} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted">
                प्रश्नावली {ex.number} <StatusBadge doc={ex} />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No प्रश्नावली yet.</p>
      )}
      <Button asChild variant="link" size="sm" className="mt-2 px-0">
        <Link to={adminUrl(`exercises?class=${classId || ''}&chapter=${chapterId}`)}>Manage & reorder →</Link>
      </Button>
    </Panel>
  );
}

const CHAPTER_DEFAULTS = {
  class: null,
  subject: null,
  number: undefined,
  title: {},
  slug: '',
  shortDescription: {},
  image: null,
  featuredImage: null,
  introVideo: null,
  introduction: {},
  formulas: [],
  notes: {},
  relatedChapters: [],
  featured: false,
  languageMode: 'auto',
  seo: {},
  status: 'draft',
  isVisible: true,
};

export function ChapterEditor({ id }) {
  const [params] = useSearchParams();
  const editor = useEditorForm({ resource: 'chapters', id, basePath: adminUrl('chapters'), defaults: { ...CHAPTER_DEFAULTS, class: params.get('class') || null } });
  const subjects = useResourceList('subjects', { limit: 50 });
  const [previewOpen, setPreviewOpen] = useState(false);
  const { form, setField } = editor;

  useEffect(() => {
    if (editor.isNew && form && !form.subject && subjects.data?.items?.length) editor.initialize({ subject: subjects.data.items[0] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor.isNew, subjects.data]);

  const classSlug = form?.class?.slug;
  const subjectSlug = form?.subject?.slug;
  const path = classSlug && subjectSlug && form.slug ? `/${classSlug}/${subjectSlug}/${form.slug}` : null;

  return (
    <EditorGate editor={editor}>
      {() => (
        <>
          <EditorShell
            title={editor.isNew ? 'New अध्याय (chapter)' : `अध्याय ${form.number} — ${form.title?.hi || form.title?.en || ''}`}
            description="Chapter page: introduction, formulas, video, notes and the list of प्रश्नावली."
            backTo={adminUrl('chapters')}
            backLabel="All chapters"
            doc={editor.doc}
            form={form}
            setField={setField}
            dirty={editor.dirty}
            saving={editor.saving}
            onSave={editor.save}
            onPreview={() => (path ? setPreviewOpen(true) : toast.info('Save once to preview.'))}
            onDuplicate={editor.duplicate}
            onDelete={() => editor.remove()}
            sidebar={
              <>
                <Panel title="Display">
                  <div className="space-y-3">
                    <SwitchField label="Featured on homepage" checked={form.featured} onChange={(v) => setField('featured', v)} />
                    <LanguageModeField value={form.languageMode} onChange={(v) => setField('languageMode', v)} />
                  </div>
                </Panel>
                {!editor.isNew && <ChapterExercisesPanel chapterId={id} classId={refId(form.class)} />}
              </>
            }
          >
            <Panel title="Location & title">
              <div className="grid gap-4 sm:grid-cols-2">
                <RefSelect label="Class" required resource="classes" value={form.class} onChange={(v) => setField('class', v)} />
                <RefSelect label="Subject" required resource="subjects" value={form.subject} onChange={(v) => setField('subject', v)} />
                <NumberField label="अध्याय number" required value={form.number} onChange={(v) => setField('number', v)} min={0} />
                <SlugField value={form.slug} onChange={(v) => setField('slug', v)} suggestion={form.number !== undefined ? `adhyay-${form.number}` : ''} prefix={classSlug ? `/${classSlug}/${subjectSlug || 'maths'}/` : undefined} />
                <L10nField className="sm:col-span-2" label="Title" required value={form.title} onChange={(v) => setField('title', v)} placeholder="समांतर श्रेढ़ियाँ / Arithmetic Progressions" />
                <L10nField className="sm:col-span-2" label="Short description" multiline rows={2} value={form.shortDescription} onChange={(v) => setField('shortDescription', v)} />
              </div>
            </Panel>
            <Panel title="Images & video">
              <div className="grid gap-4 sm:grid-cols-2">
                <MediaField label="Chapter image (cards)" value={form.image} onChange={(v) => setField('image', v)} />
                <MediaField label="Featured image (top of page)" value={form.featuredImage} onChange={(v) => setField('featuredImage', v)} />
                <div className="sm:col-span-2">
                  <VideoField label="Introduction video" value={form.introVideo} onChange={(v) => setField('introVideo', v)} hint="Shown near the top of the अध्याय page." />
                </div>
              </div>
            </Panel>
            <Panel title="Introduction">
              <RichL10nField value={form.introduction} onChange={(v) => setField('introduction', v)} />
            </Panel>
            <Panel title="Formulas">
              <FormulaListField value={form.formulas} onChange={(v) => setField('formulas', v)} />
            </Panel>
            <Panel title="Notes">
              <RichL10nField value={form.notes} onChange={(v) => setField('notes', v)} />
            </Panel>
            <Panel title="Related chapters" description="Pick chapters to link manually. Nearby chapters are suggested automatically when empty.">
              <RefMultiSelect resource="chapters" value={form.relatedChapters} onChange={(v) => setField('relatedChapters', v)} params={refId(form.class) ? { class: refId(form.class) } : {}} />
            </Panel>
            <Panel title="SEO">
              <SeoFields
                value={form.seo}
                onChange={(v) => setField('seo', v)}
                fallbackTitle={`Class ${form.class?.number || ''} Maths अध्याय ${form.number ?? ''} – ${form.title?.hi || ''}`}
                fallbackDescription={form.shortDescription?.hi || form.shortDescription?.en}
                path={path}
              />
            </Panel>
          </EditorShell>
          <PreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} path={path} entityType="Chapter" id={id} data={form} />
        </>
      )}
    </EditorGate>
  );
}
