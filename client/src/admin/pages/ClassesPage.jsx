import { Shapes, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { adminUrl } from '@/lib/config';
import { EditorShell } from '../components/EditorShell.jsx';
import { L10nField, NumberField, SlugField, SwitchField, TextField } from '../components/fields/Fields.jsx';
import { RefMultiSelect } from '../components/fields/RefSelect.jsx';
import { LocalizedCell } from '../components/LocalizedCell.jsx';
import { MediaField } from '../components/media/MediaFields.jsx';
import { PageHeader, Panel } from '../components/PageHeader.jsx';
import { PreviewDialog } from '../components/PreviewDialog.jsx';
import { ResourceListPage } from '../components/ResourceListPage.jsx';
import { SeoFields } from '../components/SeoFields.jsx';
import { EditorGate, useEditorForm } from '../lib/useEditorForm.jsx';
import { useResourceList } from '../lib/resources.js';

export function ClassesList() {
  return (
    <ResourceListPage
      resource="classes"
      description="Classes 6–12 (add future classes any time). Drag to change the order shown on the website."
      createPath={adminUrl('classes/new')}
      editPath={(item) => adminUrl(`classes/${item._id}`)}
      reorderable
      rowLabel={(c) => `Class ${c.number} — ${c.name?.en || c.name?.hi || ''}`}
      headerActions={
        <Button asChild variant="outline" size="lg">
          <Link to={adminUrl('subjects')}>
            <Shapes /> Subjects
          </Link>
        </Button>
      }
      columns={[
        { header: 'Class', className: 'w-16', cell: (c) => <span className="font-heading text-lg font-extrabold text-brand">{c.number}</span> },
        { header: 'Name', cell: (c) => <LocalizedCell value={c.name} /> },
        { header: 'Subjects', className: 'hidden md:table-cell', cell: (c) => c.subjects?.map((s) => s.name?.en || s.slug).join(', ') || '—' },
        { header: 'Featured', className: 'hidden sm:table-cell', cell: (c) => (c.featured ? <Star className="size-4 fill-current text-saffron" aria-label="Featured" /> : null) },
      ]}
    />
  );
}

const CLASS_DEFAULTS = { number: undefined, name: {}, slug: '', description: {}, badge: {}, featured: false, subjects: [], thumbnail: null, seo: {}, status: 'draft', isVisible: true };

export function ClassEditor({ id }) {
  const editor = useEditorForm({ resource: 'classes', id, defaults: CLASS_DEFAULTS, basePath: adminUrl('classes') });
  const subjects = useResourceList('subjects', { limit: 50 });
  const [previewOpen, setPreviewOpen] = useState(false);
  const { form, setField } = editor;

  useEffect(() => {
    if (editor.isNew && form && !form.subjects?.length && subjects.data?.items?.length) editor.initialize({ subjects: [subjects.data.items[0]] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor.isNew, subjects.data]);

  return (
    <EditorGate editor={editor}>
      {() => (
        <>
          <EditorShell
            title={editor.isNew ? 'New class' : `Class ${form.number}`}
            description="Class landing page, card on the homepage and SEO."
            backTo={adminUrl('classes')}
            backLabel="All classes"
            doc={editor.doc}
            form={form}
            setField={setField}
            dirty={editor.dirty}
            saving={editor.saving}
            onSave={editor.save}
            onPreview={() => (editor.isNew ? toast.info('Save once to preview.') : setPreviewOpen(true))}
            onDuplicate={editor.duplicate}
            onDelete={() => editor.remove()}
          >
            <Panel title="Class details">
              <div className="grid gap-4 sm:grid-cols-2">
                <NumberField label="Class number" required value={form.number} onChange={(v) => setField('number', v)} min={1} max={20} />
                <SlugField value={form.slug} onChange={(v) => setField('slug', v)} suggestion={form.number ? `class-${form.number}` : ''} prefix="/" />
                <L10nField label="Class name" required value={form.name} onChange={(v) => setField('name', v)} placeholder="कक्षा 10 गणित / Class 10 Mathematics" />
                <L10nField label="Badge" value={form.badge} onChange={(v) => setField('badge', v)} placeholder="Board Exam Special" />
                <L10nField className="sm:col-span-2" label="Description" multiline value={form.description} onChange={(v) => setField('description', v)} />
                <RefMultiSelect label="Subjects" hint="Mathematics today; more subjects later." resource="subjects" value={form.subjects} onChange={(v) => setField('subjects', v)} />
                <SwitchField label="Featured (large card on homepage)" checked={form.featured} onChange={(v) => setField('featured', v)} />
                <MediaField className="sm:col-span-2" label="Thumbnail / image" value={form.thumbnail} onChange={(v) => setField('thumbnail', v)} kind="thumbnail" />
              </div>
            </Panel>
            <Panel title="SEO">
              <SeoFields value={form.seo} onChange={(v) => setField('seo', v)} fallbackTitle={`NCERT Solutions for Class ${form.number || ''} Maths`} fallbackDescription={form.description?.en} path={`/${form.slug || `class-${form.number || ''}`}`} />
            </Panel>
          </EditorShell>
          <PreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} path={`/${form.slug}`} />
        </>
      )}
    </EditorGate>
  );
}

export function SubjectsList() {
  return (
    <div>
      <ResourceListPage
        resource="subjects"
        description="Subjects are shared across classes. Keep future subjects (Science, English…) private until you are ready to launch them."
        createPath={adminUrl('subjects/new')}
        editPath={(item) => adminUrl(`subjects/${item._id}`)}
        reorderable
        columns={[
          { header: 'Subject', cell: (s) => <LocalizedCell value={s.name} /> },
          { header: 'Slug', cell: (s) => <code className="text-xs">{s.slug}</code> },
          { header: 'On website', cell: (s) => (s.isPublic ? 'Public' : 'Private') },
        ]}
      />
    </div>
  );
}

const SUBJECT_DEFAULTS = { name: {}, slug: '', description: {}, icon: 'sigma', isPublic: false, seo: {}, status: 'draft', isVisible: true };

export function SubjectEditor({ id }) {
  const editor = useEditorForm({ resource: 'subjects', id, defaults: SUBJECT_DEFAULTS, basePath: adminUrl('subjects') });
  const { form, setField } = editor;
  return (
    <EditorGate editor={editor}>
      {() => (
        <EditorShell
          title={editor.isNew ? 'New subject' : form.name?.en || 'Subject'}
          backTo={adminUrl('subjects')}
          backLabel="All subjects"
          doc={editor.doc}
          form={form}
          setField={setField}
          dirty={editor.dirty}
          saving={editor.saving}
          onSave={editor.save}
          onDelete={() => editor.remove()}
        >
          <Panel title="Subject">
            <div className="grid gap-4 sm:grid-cols-2">
              <L10nField label="Name" required value={form.name} onChange={(v) => setField('name', v)} />
              <SlugField value={form.slug} onChange={(v) => setField('slug', v)} suggestion={form.name?.en === 'Mathematics' ? 'maths' : form.name?.en} prefix="/class-10/" />
              <L10nField className="sm:col-span-2" label="Description" multiline value={form.description} onChange={(v) => setField('description', v)} />
              <TextField label="Icon name" value={form.icon} onChange={(v) => setField('icon', v)} />
              <SwitchField label="Public on the student website" hint="Keep off for subjects that are still being prepared." checked={form.isPublic} onChange={(v) => setField('isPublic', v)} />
            </div>
          </Panel>
        </EditorShell>
      )}
    </EditorGate>
  );
}

export { PageHeader };
