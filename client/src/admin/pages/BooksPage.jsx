import { BookOpen, ExternalLink, Plus, ShoppingBag, Star } from 'lucide-react';
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

export function BooksList() {
  const [filters, setFilter, active] = useQueryFilters(['class', 'category']);
  return (
    <ResourceListPage
      resource="books"
      title="Reference Books (संदर्भ पुस्तकें)"
      description="Manage recommended mathematics textbooks, reference guides, and external purchasing links (Amazon, Flipkart)."
      baseParams={active}
      filters={
        <div className="flex flex-wrap items-center gap-2">
          <ClassFilter value={filters.class} onChange={(v) => setFilter('class', v)} />
          <SelectField
            value={filters.category || ''}
            onChange={(v) => setFilter('category', v)}
            placeholder="All Categories"
            options={[
              { value: '', label: 'All Categories' },
              { value: 'recommended', label: 'Recommended Books' },
              { value: 'ncert', label: 'NCERT Mathematics' },
              { value: 'reference', label: 'Reference Books (RD Sharma, RS Aggarwal)' },
              { value: 'exam_prep', label: 'Exam Preparation Books' },
              { value: 'practice', label: 'Practice & Workbooks' },
              { value: 'olympiad', label: 'Olympiad & Competitive' },
            ]}
            className="w-48"
          />
        </div>
      }
      createPath={adminUrl(`books/new${filters.class ? `?class=${filters.class}` : ''}`)}
      createLabel="Add Reference Book"
      editPath={(item) => adminUrl(`books/${item._id}`)}
      rowLabel={(b) => `${b.author} — ${b.title?.en || b.title?.hi || 'Book'}`}
      columns={[
        { header: 'Title', cell: (b) => <LocalizedCell value={b.title} /> },
        { header: 'Author', cell: (b) => <span className="text-xs font-semibold">{b.author}</span> },
        {
          header: 'Category',
          className: 'hidden sm:table-cell',
          cell: (b) => (
            <span className="rounded-md bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-700 uppercase dark:bg-orange-950 dark:text-orange-300">
              {b.category?.replace(/_/g, ' ')}
            </span>
          ),
        },
        { header: 'Class', className: 'hidden md:table-cell', cell: (b) => (b.class ? `Class ${b.class.number}` : 'All') },
        {
          header: 'Purchase Link',
          className: 'hidden lg:table-cell',
          cell: (b) =>
            b.purchaseUrl ? (
              <a
                href={b.purchaseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
              >
                Link <ExternalLink className="size-3" />
              </a>
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            ),
        },
      ]}
    />
  );
}

export function BookEditor({ id }) {
  const [params] = useSearchParams();
  const form = useEditorForm({
    resource: 'books',
    id,
    basePath: adminUrl('books'),
    entityType: 'Book',
    defaults: () => ({
      class: params.get('class') || '',
      chapter: params.get('chapter') || '',
      topic: '',
      title: { hi: '', en: '', mixed: '' },
      slug: '',
      hasSolutions: true,
      pdfFile: null,
      pdfUrl: '',
      author: '',
      publisher: '',
      edition: '',
      category: 'recommended',
      description: { hi: '', en: '', mixed: '' },
      recommendedFor: { hi: '', en: '', mixed: '' },
      coverImage: null,
      coverUrl: '',
      purchaseUrl: '',
      price: '',
      availability: 'available',
      featured: false,
      rating: 4.8,
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
          title={isNew ? 'New Reference Book' : `Book — ${doc?.title?.en || doc?.title?.hi || doc?.author || ''}`}
        >
        <div className="grid gap-6">
          <Panel title="Book Information">
            <L10nField label="Book Title" value={doc.title} onChange={(title) => set('title', title)} placeholder="e.g. NCERT Mathematics Class 10 / R.D. Sharma" required />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="URL Slug (e.g. rs-aggarwal, rd-sharma, ml-aggarwal)" hint="Unique identifier for reference solution URLs. Leave blank to auto-generate.">
                <input
                  type="text"
                  value={doc.slug || ''}
                  onChange={(e) => set('slug', e.target.value)}
                  placeholder="e.g. rs-aggarwal"
                  className="h-9 w-full rounded-md border bg-transparent px-3 text-xs"
                />
              </Field>
              <Field label="Author (लेखक)" required>
                <input
                  type="text"
                  value={doc.author || ''}
                  onChange={(e) => set('author', e.target.value)}
                  placeholder="e.g. NCERT / Dr. R.D. Sharma"
                  className="h-9 w-full rounded-md border bg-transparent px-3 text-xs"
                />
              </Field>
              <Field label="Publisher (प्रकाशक)">
                <input
                  type="text"
                  value={doc.publisher || ''}
                  onChange={(e) => set('publisher', e.target.value)}
                  placeholder="e.g. Dhanpat Rai Publications"
                  className="h-9 w-full rounded-md border bg-transparent px-3 text-xs"
                />
              </Field>
              <Field label="Edition (संस्करण)">
                <input
                  type="text"
                  value={doc.edition || ''}
                  onChange={(e) => set('edition', e.target.value)}
                  placeholder="e.g. 2026 Edition"
                  className="h-9 w-full rounded-md border bg-transparent px-3 text-xs"
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Book Category / श्रेणी"
                value={doc.category || 'recommended'}
                onChange={(category) => set('category', category)}
                options={[
                  { value: 'recommended', label: 'Recommended Books (अनुशंसित पुस्तकें)' },
                  { value: 'ncert', label: 'NCERT Textbooks & Exemplars' },
                  { value: 'reference', label: 'Reference Books (R.D. Sharma / R.S. Aggarwal)' },
                  { value: 'exam_prep', label: 'Board Exam Preparation & PYQ' },
                  { value: 'practice', label: 'Workbooks & Practice Books' },
                  { value: 'olympiad', label: 'Olympiad & Competitive Maths' },
                  { value: 'other', label: 'Other Educational Book' },
                ]}
                required
              />
              <Field label="Optional Price Display">
                <input
                  type="text"
                  value={doc.price || ''}
                  onChange={(e) => set('price', e.target.value)}
                  placeholder="e.g. ₹450 / Approx ₹399"
                  className="h-9 w-full rounded-md border bg-transparent px-3 text-xs"
                />
              </Field>
            </div>

            <L10nField label="Recommended For (Student Guidance)" value={doc.recommendedFor} onChange={(recommendedFor) => set('recommendedFor', recommendedFor)} placeholder="e.g. Best for CBSE Board Exams & Concept Clarity" />
            <L10nField label="Detailed Description" value={doc.description} onChange={(description) => set('description', description)} placeholder="Overview of book topics, chapters covered, and benefits" />
          </Panel>

          <Panel title="Purchasing Link (Amazon / Flipkart / Publisher)">
            <Field
              label="External Buying / Purchase Link"
              hint="Paste the direct Amazon, Flipkart, or publisher bookstore URL where students can purchase this book."
            >
              <div className="relative">
                <input
                  type="url"
                  value={doc.purchaseUrl || ''}
                  onChange={(e) => set('purchaseUrl', e.target.value)}
                  placeholder="https://www.amazon.in/dp/..."
                  className="h-9 w-full rounded-md border bg-transparent pr-8 pl-3 text-xs"
                />
                {doc.purchaseUrl && (
                  <a
                    href={doc.purchaseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 text-brand hover:text-brand/80"
                    title="Test Link"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                )}
              </div>
            </Field>
          </Panel>

          <Panel title="Educational Association (Class / Chapter / Topic)">
            <div className="grid gap-4 sm:grid-cols-3">
              <RefSelect
                label="Class (कक्षा)"
                resource="classes"
                params={{ limit: 50 }}
                value={classId}
                onChange={(c) => {
                  set('class', c);
                  set('chapter', '');
                  set('topic', '');
                }}
                labelOf={(c) => `Class ${c.number} — ${c.name?.en || c.name?.hi || ''}`}
              />
              <RefSelect
                label="Specific Chapter (Optional)"
                resource="chapters"
                params={{ class: classId, limit: 100 }}
                disabled={!classId}
                value={chapterId}
                onChange={(ch) => {
                  set('chapter', ch);
                  set('topic', '');
                }}
                labelOf={(ch) => `अध्याय ${ch.number} — ${ch.title?.en || ch.title?.hi || ''}`}
              />
              <RefSelect
                label="Specific Topic (Optional)"
                resource="topics"
                params={{ chapter: chapterId, limit: 100 }}
                disabled={!chapterId}
                value={refId(doc.topic)}
                onChange={(tp) => set('topic', tp)}
                labelOf={(tp) => `Topic ${tp.number} — ${tp.title?.en || tp.title?.hi || ''}`}
              />
            </div>
          </Panel>

          <Panel title="Cover Image & Visuals">
            <MediaField label="Upload Book Cover Image" value={doc.coverImage} onChange={(coverImage) => set('coverImage', coverImage)} />
            <Field label="Or External Cover Image URL">
              <input
                type="url"
                value={doc.coverUrl || ''}
                onChange={(e) => set('coverUrl', e.target.value)}
                placeholder="https://images-na.ssl-images-amazon.com/images/..."
                className="h-9 w-full rounded-md border bg-transparent px-3 text-xs"
              />
            </Field>
          </Panel>

          <Panel title="PDF Preview / Solutions (Optional)">
            <MediaField
              label="Upload Book / Solutions PDF"
              kind="pdf"
              value={doc.pdfFile}
              onChange={(pdfFile) => set('pdfFile', pdfFile)}
              hint="Upload book notes or solutions PDF for student preview."
            />
            <Field label="Or External PDF URL">
              <input
                type="url"
                value={doc.pdfUrl || ''}
                onChange={(e) => set('pdfUrl', e.target.value)}
                placeholder="https://..."
                className="h-9 w-full rounded-md border bg-transparent px-3 text-xs"
              />
            </Field>
          </Panel>

          <Panel title="Display & Highlighting">
            <div className="space-y-3">
              <SwitchField
                label="Has Reference Solutions (संदर्भ समाधान उपलब्ध)"
                hint="Enable if this book has chapter & exercise solutions under Reference Solutions section."
                checked={doc.hasSolutions !== false}
                onChange={(hasSolutions) => set('hasSolutions', hasSolutions)}
              />
              <SwitchField
                label="Featured Book"
                hint="Highlight this book on the student homepage and chapter recommended books shelf."
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
