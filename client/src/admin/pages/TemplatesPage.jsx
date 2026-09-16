import { adminUrl } from '@/lib/config';
import { BLOCK_META, SolutionBuilder } from '../components/SolutionBuilder.jsx';
import { EditorShell } from '../components/EditorShell.jsx';
import { L10nField, SelectField, SwitchField, TextField } from '../components/fields/Fields.jsx';
import { VIDEO_PLACEMENT_OPTIONS } from '../components/fields/VideoField.jsx';
import { Panel } from '../components/PageHeader.jsx';
import { ResourceListPage } from '../components/ResourceListPage.jsx';
import { EditorGate, useEditorForm } from '../lib/useEditorForm.jsx';
import { DIFFICULTY_OPTIONS } from './QuestionsPage.jsx';

export function TemplatesList() {
  return (
    <ResourceListPage
      resource="templates"
      description="Reusable question layouts, e.g. QUESTION → HINT → STEPS → CONSTRUCTION DIAGRAM → VIDEO → FINAL ANSWER. Apply them from the solution builder."
      hasStatus={false}
      createPath={adminUrl('templates/new')}
      editPath={(t) => adminUrl(`templates/${t._id}`)}
      reorderable
      rowLabel={(t) => t.name}
      columns={[
        { header: 'Template', cell: (t) => <span className="font-semibold">{t.name}</span> },
        { header: 'Blocks', cell: (t) => <span className="text-xs text-muted-foreground">{(t.blocks || []).map((b) => BLOCK_META[b.type]?.label || b.type).join(' → ')}</span> },
        { header: 'Default', className: 'hidden sm:table-cell', cell: (t) => (t.isDefault ? 'Yes' : '') },
      ]}
    />
  );
}

const TEMPLATE_DEFAULTS = { name: '', description: {}, kind: 'question', blocks: [], questionDefaults: { difficulty: 'medium', videoPlacement: 'afterSolution', includeHint: false }, isDefault: false };

export function TemplateEditor({ id }) {
  const editor = useEditorForm({ resource: 'templates', id, defaults: TEMPLATE_DEFAULTS, basePath: adminUrl('templates'), label: (t) => t?.name });
  const { form, setField } = editor;
  const setDefaults = (patch) => setField('questionDefaults', { ...form.questionDefaults, ...patch });
  return (
    <EditorGate editor={editor}>
      {() => (
        <EditorShell
          title={editor.isNew ? 'New template' : form.name}
          backTo={adminUrl('templates')}
          backLabel="All templates"
          hasStatus={false}
          doc={editor.doc}
          form={form}
          setField={setField}
          dirty={editor.dirty}
          saving={editor.saving}
          onSave={editor.save}
          onDuplicate={editor.duplicate}
          onDelete={() => editor.remove()}
          sidebar={
            <Panel title="Question defaults">
              <div className="space-y-3">
                <SelectField label="Difficulty" value={form.questionDefaults?.difficulty} onChange={(v) => setDefaults({ difficulty: v })} options={DIFFICULTY_OPTIONS} />
                <SelectField label="Video position" value={form.questionDefaults?.videoPlacement} onChange={(v) => setDefaults({ videoPlacement: v })} options={VIDEO_PLACEMENT_OPTIONS} />
                <SwitchField label="Default template" checked={form.isDefault} onChange={(v) => setField('isDefault', v)} />
              </div>
            </Panel>
          }
        >
          <Panel title="Template">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Name" required value={form.name} onChange={(v) => setField('name', v)} placeholder="Construction question" />
              <SelectField
                label="Used for"
                value={form.kind}
                onChange={(v) => setField('kind', v)}
                options={[
                  { value: 'question', label: 'Questions' },
                  { value: 'importantQuestion', label: 'Important questions' },
                  { value: 'solution', label: 'Solutions' },
                ]}
              />
              <L10nField className="sm:col-span-2" label="Description" value={form.description} onChange={(v) => setField('description', v)} />
            </div>
          </Panel>
          <Panel title="Blocks" description="Content typed here is copied into new questions as a starting point.">
            <SolutionBuilder blocks={form.blocks} onChange={(v) => setField('blocks', v)} templateKind={form.kind} />
          </Panel>
        </EditorShell>
      )}
    </EditorGate>
  );
}
