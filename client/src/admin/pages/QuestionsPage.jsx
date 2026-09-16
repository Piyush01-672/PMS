import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { DifficultyBadge } from '@/components/content/badges.jsx';
import { adminUrl } from '@/lib/config';
import { EditorShell } from '../components/EditorShell.jsx';
import { ChapterFilter, ClassFilter, ExerciseFilter, useQueryFilters } from '../components/filters.jsx';
import { LanguageModeField, NumberField, SelectField, SlugField, SwitchField, TagsField, TextField } from '../components/fields/Fields.jsx';
import { RefSelect } from '../components/fields/RefSelect.jsx';
import { RichL10nField } from '../components/fields/RichL10nField.jsx';
import { VideoField } from '../components/fields/VideoField.jsx';
import { LocalizedCell } from '../components/LocalizedCell.jsx';
import { MediaListField } from '../components/media/MediaFields.jsx';
import { Panel } from '../components/PageHeader.jsx';
import { PreviewDialog } from '../components/PreviewDialog.jsx';
import { ResourceListPage } from '../components/ResourceListPage.jsx';
import { SeoFields } from '../components/SeoFields.jsx';
import { SolutionBuilder } from '../components/SolutionBuilder.jsx';
import { stripTags } from '../lib/format.js';
import { refId, useResourceItem } from '../lib/resources.js';
import { EditorGate, useEditorForm } from '../lib/useEditorForm.jsx';

export const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Easy (सरल)' },
  { value: 'medium', label: 'Medium (मध्यम)' },
  { value: 'hard', label: 'Hard / HOTS (कठिन)' },
];

export function QuestionsList() {
  const [filters, setFilter, active] = useQueryFilters(['class', 'chapter', 'exercise']);
  return (
    <ResourceListPage
      resource="questions"
      description="Class → अध्याय → प्रश्नावली → Question. Choose a प्रश्नावली to drag-and-drop the question order."
      baseParams={active}
      filters={
        <>
          <ClassFilter value={filters.class} onChange={(v) => setFilter('class', v)} />
          <ChapterFilter classId={filters.class} value={filters.chapter} onChange={(v) => setFilter('chapter', v)} />
          <ExerciseFilter chapterId={filters.chapter} value={filters.exercise} onChange={(v) => setFilter('exercise', v)} />
        </>
      }
      createPath={adminUrl(`questions/new${filters.exercise ? `?exercise=${filters.exercise}` : ''}`)}
      editPath={(item) => adminUrl(`questions/${item._id}`)}
      reorderable
      reorderDisabledReason={filters.exercise ? undefined : 'Choose a class, अध्याय and प्रश्नावली to reorder questions.'}
      rowLabel={(q) => `Question ${q.number}${q.exercise ? ` (प्रश्नावली ${q.exercise.number})` : ''}`}
      columns={[
        { header: 'Q', className: 'w-12', cell: (q) => <span className="font-heading font-extrabold text-brand">{q.number}</span> },
        { header: 'Question', cell: (q) => <LocalizedCell value={q.text} html /> },
        { header: 'प्रश्नावली', className: 'hidden md:table-cell', cell: (q) => (q.exercise ? q.exercise.number : '—') },
        { header: 'Class', className: 'hidden lg:table-cell', cell: (q) => (q.class ? `Class ${q.class.number}` : '—') },
        { header: 'Level', className: 'hidden sm:table-cell', cell: (q) => <DifficultyBadge difficulty={q.difficulty} /> },
      ]}
    />
  );
}

const QUESTION_DEFAULTS = {
  exercise: null,
  number: '',
  slug: '',
  text: {},
  languageMode: 'auto',
  attachments: [],
  video: { video: null, placement: 'afterSolution' },
  hint: {},
  answer: {},
  importantPoint: {},
  difficulty: 'medium',
  marks: undefined,
  tags: [],
  isImportant: false,
  seo: {},
  status: 'draft',
  isVisible: true,
  solution: { blocks: [], languageMode: 'auto' },
};

const toQuestionForm = (doc) => ({
  ...doc,
  video: { video: doc.video?.video || null, placement: doc.video?.placement || 'afterSolution' },
  solution: { blocks: doc.solution?.blocks || [], languageMode: doc.solution?.languageMode || 'auto' },
});

export function QuestionEditor({ id }) {
  const [params] = useSearchParams();
  const editor = useEditorForm({
    resource: 'questions',
    id,
    basePath: adminUrl('questions'),
    defaults: { ...QUESTION_DEFAULTS, exercise: params.get('exercise') || null },
    toForm: toQuestionForm,
    label: (doc) => `Question ${doc?.number}`,
  });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [classId, setClassId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const { form, setField, setForm } = editor;
  const exerciseDetail = useResourceItem('exercises', refId(form?.exercise));
  const exercise = exerciseDetail.data;

  useEffect(() => {
    if (exercise && !chapterId) {
      setChapterId(exercise.chapter?._id || '');
      setClassId(exercise.chapter?.class?._id || '');
    }
  }, [exercise, chapterId]);

  const chapter = exercise?.chapter;
  const path = chapter?.class?.slug && chapter?.subject?.slug && exercise?.slug && form?.slug ? `/${chapter.class.slug}/${chapter.subject.slug}/${chapter.slug}/${exercise.slug}/${form.slug}` : null;
  const setSolution = (patch) => setForm((f) => ({ ...f, solution: { ...f.solution, ...patch } }));

  return (
    <EditorGate editor={editor}>
      {() => (
        <>
          <EditorShell
            title={editor.isNew ? 'New question' : `Question ${form.number}`}
            description={exercise ? `Class ${chapter?.class?.number} · अध्याय ${chapter?.number} · प्रश्नावली ${exercise.number}` : 'Choose where this question belongs.'}
            backTo={adminUrl(`questions${exercise ? `?class=${chapter?.class?._id}&chapter=${chapter?._id}&exercise=${exercise._id}` : ''}`)}
            backLabel="Questions"
            doc={editor.doc}
            form={form}
            setField={setField}
            dirty={editor.dirty}
            saving={editor.saving}
            onSave={editor.save}
            onPreview={() => (path && !editor.isNew ? setPreviewOpen(true) : toast.info('Save once to preview.'))}
            onDuplicate={editor.duplicate}
            onDelete={() => editor.remove({ description: 'Deletes this question and its solution only. The प्रश्नावली and other questions are not affected.' })}
            sidebar={
              <Panel title="Question settings">
                <div className="space-y-3">
                  <SelectField label="Difficulty" value={form.difficulty} onChange={(v) => setField('difficulty', v)} options={DIFFICULTY_OPTIONS} />
                  <NumberField label="Marks" value={form.marks} onChange={(v) => setField('marks', v)} min={0} max={100} />
                  <SwitchField label="Important question" hint="Highlight as exam-important." checked={form.isImportant} onChange={(v) => setField('isImportant', v)} />
                  <LanguageModeField value={form.languageMode} onChange={(v) => setField('languageMode', v)} />
                  <TagsField value={form.tags} onChange={(v) => setField('tags', v)} hint="Topics (e.g. pythagoras, triangle). Used for related content." />
                </div>
              </Panel>
            }
          >
            <Panel title="1. Location">
              <div className="grid gap-4 sm:grid-cols-3">
                <RefSelect
                  label="Class"
                  resource="classes"
                  value={classId || null}
                  onChange={(v) => {
                    setClassId(v?._id || '');
                    setChapterId('');
                    setField('exercise', null);
                  }}
                />
                <RefSelect
                  label="अध्याय"
                  resource="chapters"
                  value={chapterId || null}
                  disabled={!classId}
                  params={{ class: classId }}
                  onChange={(v) => {
                    setChapterId(v?._id || '');
                    setField('exercise', null);
                  }}
                />
                <RefSelect label="प्रश्नावली" required resource="exercises" value={form.exercise} disabled={!chapterId && !form.exercise} params={chapterId ? { chapter: chapterId } : classId ? { class: classId } : {}} onChange={(v) => setField('exercise', v)} />
                <TextField label="Question number" required value={form.number} onChange={(v) => setField('number', v)} placeholder="3 or 3(ii)" />
                <div className="sm:col-span-2">
                  <SlugField value={form.slug} onChange={(v) => setField('slug', v)} suggestion={form.number ? `prashn-${form.number}` : ''} />
                </div>
              </div>
            </Panel>

            <Panel title="2. Question" description="Type in हिंदी, English or Mixed. Use the Σ button (or $…$) for formulas, e.g. $\angle A = 60^\circ$.">
              <RichL10nField value={form.text} onChange={(v) => setField('text', v)} placeholder="यदि त्रिभुज ABC में ∠A = 60° और ∠B = 70°, तो ∠C ज्ञात कीजिए।" />
            </Panel>

            <Panel title="3. Images, figures, diagrams & graphs" description="Unlimited images. Choose whether each shows with the question or below the solution. If none are added, the section is hidden.">
              <MediaListField value={form.attachments} onChange={(v) => setField('attachments', v)} showKind showPlacement kind="diagrams" />
            </Panel>

            <Panel title="4. YouTube video">
              <VideoField
                value={form.video?.video}
                onChange={(video) => setField('video', { ...form.video, video })}
                placement={form.video?.placement}
                onPlacementChange={(placement) => setField('video', { ...form.video, placement })}
                hint="Paste a YouTube link and choose where the player appears. You can also add a YouTube block between solution steps."
              />
            </Panel>

            <Panel title="5. Step-by-step solution" description="Add blocks (Explanation → Steps → Formula → Diagram → Video → Final Answer) in any order. Drag to reorder.">
              <div className="space-y-4">
                <SolutionBuilder
                  blocks={form.solution?.blocks}
                  onChange={(blocks) => setSolution({ blocks })}
                  onTemplateApplied={(template) =>
                    setForm((f) => ({
                      ...f,
                      difficulty: template.questionDefaults?.difficulty || f.difficulty,
                      video: { ...f.video, placement: template.questionDefaults?.videoPlacement || f.video?.placement },
                    }))
                  }
                />
                <div className="max-w-sm">
                  <LanguageModeField label="Solution language mode" value={form.solution?.languageMode} onChange={(languageMode) => setSolution({ languageMode })} />
                </div>
              </div>
            </Panel>

            <Panel title="6. Hint, short answer & important point">
              <div className="space-y-4">
                <RichL10nField label="Hint (students can reveal it)" value={form.hint} onChange={(v) => setField('hint', v)} minimal />
                <RichL10nField label="Short answer" hint="Used as the final answer when the solution has no “Final answer” block, and in search/FAQ snippets." value={form.answer} onChange={(v) => setField('answer', v)} minimal />
                <RichL10nField label="Important point" value={form.importantPoint} onChange={(v) => setField('importantPoint', v)} minimal />
              </div>
            </Panel>

            <Panel title="7. SEO">
              <SeoFields
                value={form.seo}
                onChange={(v) => setField('seo', v)}
                fallbackTitle={exercise ? `Class ${chapter?.class?.number} Maths अध्याय ${chapter?.number} प्रश्नावली ${exercise.number} प्रश्न ${form.number} Solution` : ''}
                fallbackDescription={stripTags(form.text?.hi || form.text?.en || form.text?.mixed).slice(0, 158)}
                path={path}
              />
            </Panel>
          </EditorShell>
          <PreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} path={path} entityType="Question" id={id} data={form} solution={form.solution} />
        </>
      )}
    </EditorGate>
  );
}

export function SolutionsList() {
  return (
    <ResourceListPage
      resource="solutions"
      description="Every question has one block-based solution. Open a row to edit it inside the question editor."
      hasStatus={false}
      canDuplicate={false}
      editPath={(s) => adminUrl(`questions/${s.question?._id}`)}
      rowLabel={(s) => `Solution of question ${s.question?.number || ''}`}
      columns={[
        { header: 'Question', cell: (s) => (s.question ? `Q${s.question.number}` : 'Deleted question') },
        { header: 'प्रश्नावली', className: 'hidden sm:table-cell', cell: (s) => s.question?.exercise?.number || '—' },
        { header: 'Class', className: 'hidden md:table-cell', cell: (s) => (s.question?.class ? `Class ${s.question.class.number}` : '—') },
        { header: 'Blocks', cell: (s) => s.blocks?.length || 0 },
        { header: 'Types', className: 'hidden lg:table-cell', cell: (s) => <span className="text-xs text-muted-foreground">{[...new Set((s.blocks || []).map((b) => b.type))].join(' · ')}</span> },
      ]}
    />
  );
}
