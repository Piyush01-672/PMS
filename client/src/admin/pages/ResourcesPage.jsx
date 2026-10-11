import { Download, Eye, FileText, Plus, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { adminUrl } from '@/lib/config';
import { EditorShell } from '../components/EditorShell.jsx';
import { ClassFilter, useQueryFilters } from '../components/filters.jsx';
import { Field, L10nField, SelectField, SwitchField } from '../components/fields/Fields.jsx';
import { RefSelect } from '../components/fields/RefSelect.jsx';
import { LocalizedCell } from '../components/LocalizedCell.jsx';
import { MediaField } from '../components/media/MediaFields.jsx';
import { Panel } from '../components/PageHeader.jsx';
import { ResourceListPage } from '../components/ResourceListPage.jsx';
import { refId, useResourceList } from '../lib/resources.js';
import { EditorGate, useEditorForm } from '../lib/useEditorForm.jsx';

export function ResourcesList() {
  const [filters, setFilter, active] = useQueryFilters(['class', 'resourceType']);
  return (
    <ResourceListPage
      resource="resources"
      title="PDFs & Downloadable Resources (पीडीएफ व अध्ययन सामग्री)"
      description="Manage PDF notes, worksheets, assignments, formula sheets, sample papers, and practice files."
      baseParams={active}
      filters={
        <div className="flex flex-wrap items-center gap-2">
          <ClassFilter value={filters.class} onChange={(v) => setFilter('class', v)} />
          <SelectField
            value={filters.resourceType || ''}
            onChange={(v) => setFilter('resourceType', v)}
            placeholder="All Resource Types"
            options={[
              { value: '', label: 'All Resource Types' },
              { value: 'notes', label: 'Chapter Notes' },
              { value: 'ncert_notes', label: 'NCERT Notes' },
              { value: 'ncert_books', label: 'NCERT Books' },
              { value: 'cbse_sample_papers', label: 'CBSE Sample Papers' },
              { value: 'extra_questions', label: 'Extra Questions' },
              { value: 'important_questions', label: 'Important Questions' },
              { value: 'english_summaries', label: 'English Summaries' },
              { value: 'syllabus', label: 'Syllabus' },
              { value: 'formula_sheet', label: 'Formula Sheet' },
              { value: 'worksheet', label: 'Worksheet' },
              { value: 'assignment', label: 'Assignment' },
              { value: 'practice_paper', label: 'Practice Paper' },
              { value: 'sample_paper', label: 'Sample Paper' },
              { value: 'previous_year_paper', label: 'Previous Year Paper' },
              { value: 'solution', label: 'Solution PDF' },
              { value: 'form', label: 'Registration / Form' },
              { value: 'revision', label: 'Revision Material' },
              { value: 'question_bank', label: 'Question Bank' },
              { value: 'other', label: 'Other Document' },
            ]}
            className="w-52"
          />
        </div>
      }
      createPath={adminUrl(`resources/new${filters.class ? `?class=${filters.class}` : ''}`)}
      createLabel="Upload / Add Resource"
      editPath={(item) => adminUrl(`resources/${item._id}`)}
      rowLabel={(r) => r.title?.en || r.title?.hi || 'Resource'}
      columns={[
        { header: 'Title', cell: (r) => <LocalizedCell value={r.title} /> },
        {
          header: 'Type',
          className: 'hidden sm:table-cell',
          cell: (r) => (
            <span className="rounded-md bg-brand-soft px-2 py-0.5 text-[11px] font-bold text-brand uppercase">
              {r.resourceType?.replace(/_/g, ' ')}
            </span>
          ),
        },
        { header: 'Class', className: 'hidden md:table-cell', cell: (r) => (r.class ? `Class ${r.class.number}` : 'All') },
        { header: 'Chapter', className: 'hidden lg:table-cell', cell: (r) => (r.chapter ? `अध्याय ${r.chapter.number}` : '—') },
        {
          header: 'Download',
          className: 'hidden sm:table-cell',
          cell: (r) => (
            <span className={`text-xs font-semibold ${r.downloadAllowed !== false ? 'text-emerald-600' : 'text-rose-500'}`}>
              {r.downloadAllowed !== false ? 'Allowed' : 'Disabled'}
            </span>
          ),
        },
      ]}
    />
  );
}

export function ResourceEditor({ id }) {
  const [params] = useSearchParams();
  const form = useEditorForm({
    resource: 'resources',
    id,
    basePath: adminUrl('resources'),
    entityType: 'Resource',
    defaults: () => ({
      class: params.get('class') || '',
      chapter: params.get('chapter') || '',
      exercise: params.get('exercise') || '',
      book: params.get('book') || '',
      topic: '',
      title: { hi: '', en: '', mixed: '' },
      description: { hi: '', en: '', mixed: '' },
      resourceType: 'notes',
      file: null,
      fileUrl: '',
      fileSize: '',
      fileType: 'pdf',
      videoUrl: '',
      externalUrl: '',
      thumbnail: null,
      downloadAllowed: true,
      featured: false,
      status: 'published',
      isVisible: true,
      sortOrder: 0,
      tags: [],
    }),
  });

  const { doc, set, isNew } = form;
  const classId = refId(doc?.class);
  const chapterId = refId(doc?.chapter);

  const classes = useResourceList('classes', { limit: 50 });
  const classItems = classes.data?.items || [];
  const selectedClass = classItems.find((c) => String(c._id) === String(classId));
  const mathSubject = selectedClass?.subjects?.[0];

  useEffect(() => {
    if (mathSubject && doc && !doc.subject) {
      set('subject', mathSubject._id || mathSubject);
    }
  }, [mathSubject, doc?.subject, set]);

  return (
    <EditorGate form={form}>
      {() => (
        <EditorShell
          form={form}
          title={isNew ? 'New PDF / Downloadable Resource' : `Resource — ${doc?.title?.en || doc?.title?.hi || ''}`}
        >
        <div className="grid gap-6">
          <Panel title="Resource Details">
            <L10nField label="Resource Title" value={doc.title} onChange={(title) => set('title', title)} placeholder="e.g. Chapter 04 Quadratic Equations Notes PDF" required />
            <L10nField label="Description" value={doc.description} onChange={(description) => set('description', description)} placeholder="Short description of this study material or worksheet" />

            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Resource Type / श्रेणी"
                value={doc.resourceType || 'notes'}
                onChange={(resourceType) => set('resourceType', resourceType)}
                options={[
                  { value: 'notes', label: 'Chapter Notes (अध्याय नोट्स)' },
                  { value: 'ncert_notes', label: 'NCERT Notes (एनसीईआरटी नोट्स)' },
                  { value: 'ncert_books', label: 'NCERT Textbooks (एनसीईआरटी पुस्तकें)' },
                  { value: 'cbse_sample_papers', label: 'CBSE Sample Papers (सैंपल पेपर्स)' },
                  { value: 'extra_questions', label: 'Extra Questions (अतिरिक्त प्रश्न)' },
                  { value: 'important_questions', label: 'Important Questions (महत्वपूर्ण प्रश्न)' },
                  { value: 'english_summaries', label: 'English Summaries' },
                  { value: 'syllabus', label: 'Syllabus (पाठ्यक्रम)' },
                  { value: 'formula_sheet', label: 'Formula Sheet (सूत्र पत्रक)' },
                  { value: 'worksheet', label: 'Practice Worksheet (अभ्यास पत्रक)' },
                  { value: 'assignment', label: 'Homework Assignment (गृहकार्य)' },
                  { value: 'practice_paper', label: 'Practice Paper' },
                  { value: 'sample_paper', label: 'Sample Paper' },
                  { value: 'previous_year_paper', label: 'Previous Year Paper' },
                  { value: 'solution', label: 'Step-by-step Solution PDF' },
                  { value: 'form', label: 'Registration / Activity Form' },
                  { value: 'revision', label: 'Quick Revision Notes' },
                  { value: 'question_bank', label: 'Question Bank' },
                  { value: 'other', label: 'Other Downloadable File' },
                ]}
                required
              />
              <Field label="File Size (e.g. 2.4 MB)" hint="Optional manual size label if not auto-computed">
                <input
                  type="text"
                  value={doc.fileSize || ''}
                  onChange={(e) => set('fileSize', e.target.value)}
                  placeholder="e.g. 2.4 MB"
                  className="h-9 w-full rounded-md border bg-transparent px-3 text-xs"
                />
              </Field>
            </div>
          </Panel>

          <Panel title="Educational Placement (Class / Chapter / Exercise / Book)">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <RefSelect
                label="Class (कक्षा)"
                resource="classes"
                params={{ limit: 50 }}
                value={classId}
                onChange={(c) => {
                  set('class', c);
                  set('chapter', '');
                  set('exercise', '');
                  set('topic', '');
                }}
                labelOf={(c) => `Class ${c.number} — ${c.name?.en || c.name?.hi || ''}`}
              />
              <RefSelect
                label="Chapter (अध्याय)"
                resource="chapters"
                params={{ class: classId, limit: 100 }}
                disabled={!classId}
                value={chapterId}
                onChange={(ch) => {
                  set('chapter', ch);
                  set('exercise', '');
                  set('topic', '');
                }}
                labelOf={(ch) => `अध्याय ${ch.number} — ${ch.title?.en || ch.title?.hi || ''}`}
              />
              <RefSelect
                label="Exercise (Optional — प्रश्नावली)"
                resource="exercises"
                params={{ chapter: chapterId, limit: 100 }}
                disabled={!chapterId}
                value={refId(doc.exercise)}
                onChange={(ex) => set('exercise', ex)}
                labelOf={(ex) => `Ex ${ex.number || ''} — ${ex.title?.en || ex.title?.hi || ''}`}
              />
              <RefSelect
                label="Reference Book (Optional — संदर्भ पुस्तक)"
                resource="books"
                params={{ limit: 50 }}
                value={refId(doc.book)}
                onChange={(b) => set('book', b)}
                labelOf={(b) => b.title?.en || b.title?.hi || b.name || 'Book'}
              />
            </div>
          </Panel>

          <Panel title="File Attachment, Video & Links">
            <MediaField
              label="Upload PDF / Document File"
              kind="pdf"
              value={doc.file}
              onChange={(file) => set('file', file)}
              hint="Upload PDF from your computer or choose from Media Library."
            />

            <Field label="Or External File URL" hint="Direct link to hosted PDF / Google Drive / Cloud storage file.">
              <input
                type="url"
                value={doc.fileUrl || ''}
                onChange={(e) => set('fileUrl', e.target.value)}
                placeholder="https://..."
                className="h-9 w-full rounded-md border bg-transparent px-3 text-xs"
              />
            </Field>

            <Field label="YouTube / Video Lesson URL" hint="Embed video lesson (e.g. https://www.youtube.com/watch?v=...)">
              <input
                type="url"
                value={doc.videoUrl || ''}
                onChange={(e) => set('videoUrl', e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="h-9 w-full rounded-md border bg-transparent px-3 text-xs"
              />
            </Field>

            <Field label="External Website URL" hint="Optional link to external study portal or resource.">
              <input
                type="url"
                value={doc.externalUrl || ''}
                onChange={(e) => set('externalUrl', e.target.value)}
                placeholder="https://..."
                className="h-9 w-full rounded-md border bg-transparent px-3 text-xs"
              />
            </Field>

            <MediaField label="Optional Document Thumbnail / Preview Cover" value={doc.thumbnail} onChange={(thumbnail) => set('thumbnail', thumbnail)} />
          </Panel>

          <Panel title="Permissions & Options">
            <div className="space-y-3">
              <SwitchField
                label="Allow Student Downloads"
                hint="When enabled, students will see a 'Download PDF' button. If disabled, students can only preview."
                checked={doc.downloadAllowed !== false}
                onChange={(downloadAllowed) => set('downloadAllowed', downloadAllowed)}
              />
              <SwitchField
                label="Featured Resource"
                hint="Highlight this PDF on the Subject / Dashboard downloads area."
                checked={Boolean(doc.featured)}
                onChange={(featured) => set('featured', featured)}
              />
            </div>
          </Panel>
        </div>
      </EditorShell>
    )}
  </EditorGate>
  );
}
