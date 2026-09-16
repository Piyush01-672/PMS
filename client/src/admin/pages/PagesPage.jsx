import { useState } from 'react';
import { toast } from 'sonner';
import { adminUrl } from '@/lib/config';
import { EditorShell } from '../components/EditorShell.jsx';
import { L10nField, LanguageModeField, SelectField, SlugField } from '../components/fields/Fields.jsx';
import { RichL10nField } from '../components/fields/RichL10nField.jsx';
import { LocalizedCell } from '../components/LocalizedCell.jsx';
import { Panel } from '../components/PageHeader.jsx';
import { PreviewDialog } from '../components/PreviewDialog.jsx';
import { ResourceListPage } from '../components/ResourceListPage.jsx';
import { SeoFields } from '../components/SeoFields.jsx';
import { stripTags } from '../lib/format.js';
import { EditorGate, useEditorForm } from '../lib/useEditorForm.jsx';

export function PagesList() {
  return (
    <ResourceListPage
      resource="pages"
      description="About Us, Contact, Privacy Policy, Terms & Conditions and any other standalone page."
      createPath={adminUrl('pages/new')}
      editPath={(p) => adminUrl(`pages/${p._id}`)}
      columns={[
        { header: 'Title', cell: (p) => <LocalizedCell value={p.title} /> },
        { header: 'URL', cell: (p) => <code className="text-xs">/{p.slug}</code> },
        { header: 'Template', className: 'hidden sm:table-cell', cell: (p) => p.template },
      ]}
    />
  );
}

const PAGE_DEFAULTS = { title: {}, slug: '', excerpt: {}, content: {}, template: 'default', languageMode: 'auto', seo: {}, status: 'draft', isVisible: true };

export function PageEditor({ id }) {
  const editor = useEditorForm({ resource: 'pages', id, defaults: PAGE_DEFAULTS, basePath: adminUrl('pages') });
  const [previewOpen, setPreviewOpen] = useState(false);
  const { form, setField } = editor;
  return (
    <EditorGate editor={editor}>
      {() => (
        <>
          <EditorShell
            title={editor.isNew ? 'New page' : form.title?.en || form.title?.hi}
            backTo={adminUrl('pages')}
            backLabel="All pages"
            doc={editor.doc}
            form={form}
            setField={setField}
            dirty={editor.dirty}
            saving={editor.saving}
            onSave={editor.save}
            onPreview={() => (editor.isNew ? toast.info('Save once to preview.') : setPreviewOpen(true))}
            onDuplicate={editor.duplicate}
            onDelete={() => editor.remove()}
            sidebar={
              <Panel title="Layout">
                <div className="space-y-3">
                  <SelectField
                    label="Template"
                    value={form.template}
                    onChange={(v) => setField('template', v)}
                    options={[
                      { value: 'default', label: 'Default' },
                      { value: 'contact', label: 'Contact (shows contact details)' },
                      { value: 'legal', label: 'Legal (shows last updated date)' },
                    ]}
                  />
                  <LanguageModeField value={form.languageMode} onChange={(v) => setField('languageMode', v)} />
                </div>
              </Panel>
            }
          >
            <Panel title="Page">
              <div className="grid gap-4 sm:grid-cols-2">
                <L10nField label="Title" required value={form.title} onChange={(v) => setField('title', v)} />
                <SlugField value={form.slug} onChange={(v) => setField('slug', v)} suggestion={form.title?.en} prefix="/" />
                <L10nField className="sm:col-span-2" label="Intro line" multiline rows={2} value={form.excerpt} onChange={(v) => setField('excerpt', v)} />
              </div>
            </Panel>
            <Panel title="Content">
              <RichL10nField value={form.content} onChange={(v) => setField('content', v)} />
            </Panel>
            <Panel title="SEO">
              <SeoFields value={form.seo} onChange={(v) => setField('seo', v)} fallbackTitle={form.title?.en} fallbackDescription={form.excerpt?.en || stripTags(form.content?.en).slice(0, 158)} path={`/${form.slug}`} />
            </Panel>
          </EditorShell>
          <PreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} path={`/${form.slug}`} entityType="Page" id={id} data={form} />
        </>
      )}
    </EditorGate>
  );
}
