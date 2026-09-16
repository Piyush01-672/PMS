import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  ChartLine,
  CircleHelp,
  Copy,
  Eye,
  GraduationCap,
  Image,
  LayoutGrid,
  Link2,
  ListOrdered,
  Loader2,
  Megaphone,
  MonitorPlay,
  MoreHorizontal,
  NotebookPen,
  Pencil,
  Plus,
  Save,
  Send,
  Shapes,
  Sparkles,
  Star,
  Trash2,
  Type,
  Undo2,
} from 'lucide-react';
import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { ErrorState } from '@/components/site/States.jsx';
import { adminUrl } from '@/lib/config';
import { imageUrl } from '@/lib/media';
import { useConfirm } from '../components/ConfirmDialog.jsx';
import { EditorShell } from '../components/EditorShell.jsx';
import { Field, IconField, L10nField, NumberField, SelectField, SwitchField, TextField } from '../components/fields/Fields.jsx';
import { FormulaInput } from '../components/fields/FormulaInput.jsx';
import { RefMultiSelect } from '../components/fields/RefSelect.jsx';
import { VideoField } from '../components/fields/VideoField.jsx';
import { MediaField } from '../components/media/MediaFields.jsx';
import { MediaPicker } from '../components/media/MediaPicker.jsx';
import { PageHeader, Panel } from '../components/PageHeader.jsx';
import { PreviewDialog } from '../components/PreviewDialog.jsx';
import { DragHandle, SortableList, clientKey, itemKey, moveItem, withKeys } from '../components/SortableList.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { useAdminAuth } from '../lib/auth.jsx';
import { useResourceList, useResourceMutations } from '../lib/resources.js';
import { EditorGate, useEditorForm } from '../lib/useEditorForm.jsx';

const RichTextEditor = lazy(() => import('../components/fields/RichTextEditor.jsx'));

export const SECTION_TYPES = {
  hero: { label: 'Hero', icon: Sparkles, description: 'Main heading, search box, popular searches, buttons, image or video.', fields: ['badge', 'title', 'highlight', 'description', 'image', 'video', 'buttons'] },
  statistics: { label: 'Statistics', icon: ChartLine, description: 'Numbers such as total questions — automatic or typed.', fields: ['badge', 'title', 'description'], itemFields: ['value', 'title', 'icon'], itemsLabel: 'Statistics' },
  classGrid: { label: 'Class grid', icon: GraduationCap, description: 'Cards for every class, loaded from the database.', fields: ['badge', 'title', 'description', 'buttons'] },
  steps: { label: 'Steps / hierarchy', icon: ListOrdered, description: 'Class → अध्याय → प्रश्नावली → … → Final answer.', fields: ['badge', 'title', 'description'], itemFields: ['title', 'description', 'icon'], itemsLabel: 'Steps' },
  chapterGrid: { label: 'Chapter grid', icon: BookOpen, description: 'Selected or featured chapters.', fields: ['badge', 'title', 'description', 'buttons'] },
  cardGrid: { label: 'Card grid', icon: LayoutGrid, description: 'Cards with icon, text, formula and link.', fields: ['badge', 'title', 'description', 'buttons'], itemFields: ['title', 'description', 'badge', 'icon', 'url', 'latex', 'image'], itemsLabel: 'Cards' },
  questionList: { label: 'Question list', icon: Star, description: 'Important questions or selected NCERT questions.', fields: ['badge', 'title', 'description', 'buttons'] },
  notes: { label: 'Notes', icon: NotebookPen, description: 'Latest or selected notes.', fields: ['badge', 'title', 'description', 'buttons'] },
  videoSection: { label: 'Video section', icon: MonitorPlay, description: 'One or more YouTube videos.', fields: ['badge', 'title', 'description', 'video', 'buttons'] },
  imageGallery: { label: 'Image gallery', icon: Image, description: 'Zoomable image grid.', fields: ['badge', 'title', 'description'] },
  text: { label: 'Text section', icon: Type, description: 'Rich text with optional image and bullet points.', fields: ['badge', 'title', 'highlight', 'description', 'image', 'buttons'], itemFields: ['title', 'description', 'icon'], itemsLabel: 'Bullet points' },
  faq: { label: 'FAQ', icon: CircleHelp, description: 'Accordion of questions (adds FAQ schema for Google).', fields: ['badge', 'title', 'description'], itemFields: ['title', 'description'], itemsLabel: 'Questions', itemLabels: { title: 'Question', description: 'Answer' } },
  cta: { label: 'Call to action', icon: Megaphone, description: 'Highlighted banner with buttons.', fields: ['title', 'description', 'buttons'] },
  relatedContent: { label: 'Related links', icon: Link2, description: 'A grid of links.', fields: ['badge', 'title', 'description'], itemFields: ['title', 'url'], itemsLabel: 'Links' },
  custom: { label: 'Custom content block', icon: Shapes, description: 'Free rich-text block for anything else.', fields: ['badge', 'title', 'description', 'image', 'buttons'], itemFields: ['title', 'description', 'icon'], itemsLabel: 'Bullet points' },
};

const DEFAULT_CONFIG = {
  background: 'none',
  align: 'left',
  limit: 8,
  columns: 4,
  layout: 'default',
  showSearch: true,
  searchPlaceholder: {},
  searchButtonLabel: {},
  popularLabel: {},
  popularSearches: [],
  autoStats: false,
  content: '',
  classes: [],
  chapters: [],
  questions: [],
  importantQuestions: [],
  notes: [],
  videos: [],
  gallery: [],
};

export function HomepagePage() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { can } = useAdminAuth();
  const list = useResourceList('sections', { pageKey: 'home', limit: 100 });
  const { save, duplicate, remove, reorder, setStatus } = useResourceMutations('sections');
  const [items, setItems] = useState([]);
  const [orderDirty, setOrderDirty] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const canEdit = can('settings:write');

  useEffect(() => {
    if (list.data?.items && !orderDirty) setItems(list.data.items);
  }, [list.data, orderDirty]);

  const add = async (type) => {
    const meta = SECTION_TYPES[type];
    try {
      const doc = await save.mutateAsync({ data: { type, page: 'home', name: meta.label, title: { en: meta.label }, status: 'draft', sortOrder: items.length, config: { ...DEFAULT_CONFIG } } });
      toast.success(`${meta.label} section added as a draft`);
      navigate(adminUrl(`homepage/${doc._id}`));
    } catch {
      /* toast shown */
    }
  };

  const changeOrder = (next) => {
    setItems(next);
    setOrderDirty(true);
  };

  return (
    <div>
      <PageHeader
        title="Homepage"
        description="The homepage is built from these sections, top to bottom. Add, hide, reorder and edit them without touching code."
        actions={
          <>
            <Button variant="outline" size="lg" onClick={() => setPreviewOpen(true)}>
              <Eye /> Preview homepage
            </Button>
            {canEdit && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="lg">
                    <Plus /> Add section
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="max-h-[70vh] w-80 overflow-y-auto">
                  {Object.entries(SECTION_TYPES).map(([type, meta]) => {
                    const IconComponent = meta.icon;
                    return (
                      <DropdownMenuItem key={type} onSelect={() => add(type)} className="items-start">
                        <IconComponent className="mt-0.5" />
                        <span>
                          <span className="block font-semibold">{meta.label}</span>
                          <span className="block text-xs text-muted-foreground">{meta.description}</span>
                        </span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </>
        }
      />

      {orderDirty && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-saffron/40 bg-saffron-soft px-4 py-2.5 text-sm">
          <span className="font-semibold text-warning">Section order changed</span>
          <span className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOrderDirty(false)}>
              Cancel
            </Button>
            <Button size="sm" disabled={reorder.isPending} onClick={() => reorder.mutate(items.map((s) => s._id), { onSuccess: () => setOrderDirty(false) })}>
              {reorder.isPending ? <Loader2 className="animate-spin" /> : <Save />} Save order
            </Button>
          </span>
        </div>
      )}

      {list.isError && <ErrorState error={list.error} onRetry={list.refetch} />}
      {list.isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : (
        <SortableList
          items={items}
          onChange={canEdit ? changeOrder : () => {}}
          className="space-y-2"
          renderItem={(section, index, { ref, style, handleProps, isDragging }) => {
            const meta = SECTION_TYPES[section.type] || SECTION_TYPES.custom;
            const IconComponent = meta.icon;
            return (
              <li ref={ref} style={style} className={`flex items-center gap-2 rounded-2xl border bg-card p-2 pr-3 ${isDragging ? 'shadow-xl' : ''} ${section.isVisible === false ? 'opacity-60' : ''}`}>
                {canEdit && <DragHandle {...handleProps} />}
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                  <IconComponent className="size-5" />
                </span>
                <Link to={adminUrl(`homepage/${section._id}`)} className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold hover:text-brand">{section.title?.en || section.title?.hi || section.name || meta.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {index + 1}. {meta.label}
                    {section.name ? ` · ${section.name}` : ''}
                  </span>
                </Link>
                <StatusBadge doc={section} className="hidden sm:inline-flex" />
                {canEdit && (
                  <label className="hidden items-center gap-2 text-xs text-muted-foreground md:flex">
                    Visible
                    <Switch
                      checked={section.isVisible !== false}
                      onCheckedChange={(isVisible) => save.mutate({ id: section._id, data: { isVisible } }, { onSuccess: () => toast.success(isVisible ? 'Section shown' : 'Section hidden') })}
                      aria-label="Visible on homepage"
                    />
                  </label>
                )}
                <span className="hidden sm:flex">
                  <Button variant="ghost" size="icon-sm" disabled={!canEdit || index === 0} onClick={() => changeOrder(moveItem(items, index, index - 1))} aria-label="Move up">
                    <ArrowUp />
                  </Button>
                  <Button variant="ghost" size="icon-sm" disabled={!canEdit || index === items.length - 1} onClick={() => changeOrder(moveItem(items, index, index + 1))} aria-label="Move down">
                    <ArrowDown />
                  </Button>
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label="Section actions">
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => navigate(adminUrl(`homepage/${section._id}`))}>
                      <Pencil /> Edit
                    </DropdownMenuItem>
                    {canEdit && (
                      <>
                        <DropdownMenuItem onSelect={() => duplicate.mutate(section._id)}>
                          <Copy /> Duplicate
                        </DropdownMenuItem>
                        {section.status === 'published' ? (
                          <DropdownMenuItem onSelect={() => setStatus.mutate({ id: section._id, status: 'draft' })}>
                            <Undo2 /> Unpublish
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onSelect={() => setStatus.mutate({ id: section._id, status: 'published' })}>
                            <Send /> Publish
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() =>
                            confirm({
                              title: `Delete “${section.title?.en || meta.label}”?`,
                              description: 'The section is removed from the homepage. Classes, chapters and questions it shows are not affected.',
                              confirmLabel: 'Delete section',
                              destructive: true,
                              onConfirm: () => remove.mutateAsync({ id: section._id }),
                            })
                          }
                        >
                          <Trash2 /> Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            );
          }}
        />
      )}
      <PreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} path="/" />
    </div>
  );
}

function ListEditor({ label, hint, value = [], onChange, renderFields, createItem, addLabel = 'Add item' }) {
  const items = withKeys(value);
  const update = (index, patch) => onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  return (
    <Field label={label} hint={hint}>
      {items.length > 0 && (
        <SortableList
          items={items}
          onChange={onChange}
          className="space-y-2"
          renderItem={(item, index, { ref, style, handleProps }) => (
            <li ref={ref} style={style} className="rounded-xl border bg-background p-3">
              <div className="mb-2 flex items-center gap-1">
                <DragHandle {...handleProps} />
                <span className="text-xs font-semibold text-muted-foreground">#{index + 1}</span>
                <span className="ml-auto flex">
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => onChange(moveItem(items, index, index - 1))} disabled={index === 0} aria-label="Move up">
                    <ArrowUp />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => onChange(moveItem(items, index, index + 1))} disabled={index === items.length - 1} aria-label="Move down">
                    <ArrowDown />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => onChange(items.filter((_, i) => i !== index))} aria-label="Remove">
                    <Trash2 className="text-destructive" />
                  </Button>
                </span>
              </div>
              {renderFields(item, (patch) => update(index, patch))}
            </li>
          )}
        />
      )}
      <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => onChange([...items, { _key: clientKey(), ...createItem() }])}>
        <Plus /> {addLabel}
      </Button>
    </Field>
  );
}

const BUTTON_VARIANTS = [
  { value: 'primary', label: 'Primary' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'outline', label: 'Outline' },
  { value: 'ghost', label: 'Ghost' },
  { value: 'link', label: 'Text link' },
];

function ButtonsEditor({ value, onChange }) {
  return (
    <ListEditor
      label="Buttons"
      value={value}
      onChange={onChange}
      addLabel="Add button"
      createItem={() => ({ label: {}, url: '', variant: 'primary', newTab: false })}
      renderFields={(button, set) => (
        <div className="grid gap-3 sm:grid-cols-2">
          <L10nField label="Label" value={button.label} onChange={(label) => set({ label })} />
          <TextField label="Link" value={button.url} onChange={(url) => set({ url })} placeholder="/class-10/maths · #classes · https://…" />
          <SelectField label="Style" value={button.variant || 'primary'} onChange={(variant) => set({ variant })} options={BUTTON_VARIANTS} />
          <SwitchField label="Open in new tab" checked={button.newTab} onChange={(newTab) => set({ newTab })} />
        </div>
      )}
    />
  );
}

function ItemsEditor({ type, value, onChange }) {
  const meta = SECTION_TYPES[type];
  const fields = new Set(meta.itemFields || []);
  const labels = meta.itemLabels || {};
  return (
    <ListEditor
      label={meta.itemsLabel || 'Items'}
      hint={type === 'statistics' ? 'Values can use {classes}, {chapters}, {exercises} or {questions} for live counts.' : undefined}
      value={value}
      onChange={onChange}
      addLabel={`Add ${(meta.itemsLabel || 'item').toLowerCase().replace(/s$/, '')}`}
      createItem={() => ({ title: {}, description: {}, badge: {}, icon: '', url: '', value: '', latex: '', image: null, isVisible: true })}
      renderFields={(item, set) => (
        <div className="grid gap-3 sm:grid-cols-2">
          {fields.has('value') && <TextField label="Value" value={item.value} onChange={(v) => set({ value: v })} placeholder="{questions} or 100%" />}
          {fields.has('title') && <L10nField label={labels.title || 'Title'} value={item.title} onChange={(title) => set({ title })} />}
          {fields.has('badge') && <L10nField label="Badge" value={item.badge} onChange={(badge) => set({ badge })} />}
          {fields.has('url') && <TextField label="Link" value={item.url} onChange={(url) => set({ url })} />}
          {fields.has('description') && <L10nField className="sm:col-span-2" label={labels.description || 'Description'} multiline rows={2} value={item.description} onChange={(description) => set({ description })} />}
          {fields.has('latex') && (
            <div className="sm:col-span-2">
              <FormulaInput label="Formula (optional)" value={item.latex} onChange={(latex) => set({ latex })} rows={1} />
            </div>
          )}
          {fields.has('image') && (
            <div className="sm:col-span-2">
              <MediaField label="Image (optional)" value={item.image} onChange={(image) => set({ image })} />
            </div>
          )}
          {fields.has('icon') && (
            <div className="sm:col-span-2">
              <IconField value={item.icon} onChange={(icon) => set({ icon })} />
            </div>
          )}
          <SwitchField label="Visible" checked={item.isVisible !== false} onChange={(isVisible) => set({ isVisible })} />
        </div>
      )}
    />
  );
}

function GalleryField({ value = [], onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <Field label="Gallery images">
      {value.length > 0 && (
        <SortableList
          items={value}
          onChange={onChange}
          as="ul"
          className="grid grid-cols-2 gap-2 sm:grid-cols-4"
          renderItem={(media, index, { ref, style, handleProps }) => (
            <li ref={ref} style={style} className="relative rounded-xl border bg-white p-1">
              <img src={imageUrl(media, 240)} alt="" className="aspect-square w-full object-contain" />
              <span className="absolute top-1 left-1 rounded bg-background/90">
                <DragHandle {...handleProps} className="size-7" />
              </span>
              <Button type="button" variant="secondary" size="icon-sm" className="absolute top-1 right-1" onClick={() => onChange(value.filter((_, i) => i !== index))} aria-label="Remove image">
                <Trash2 />
              </Button>
            </li>
          )}
        />
      )}
      <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setOpen(true)}>
        <Plus /> Add images
      </Button>
      <MediaPicker open={open} onOpenChange={setOpen} multiple onSelect={(list) => onChange([...value, ...list.filter((m) => !value.some((v) => itemKey(v) === m._id))])} />
    </Field>
  );
}

function ConfigFields({ type, config, onChange }) {
  const set = (patch) => onChange({ ...config, ...patch });
  const limit = <NumberField label="Maximum items" value={config.limit} onChange={(v) => set({ limit: v })} min={1} max={48} />;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {type === 'hero' && (
        <>
          <SwitchField className="sm:col-span-2" label="Show search box" checked={config.showSearch !== false} onChange={(v) => set({ showSearch: v })} />
          <L10nField label="Search placeholder" value={config.searchPlaceholder} onChange={(v) => set({ searchPlaceholder: v })} />
          <L10nField label="Search button label" value={config.searchButtonLabel} onChange={(v) => set({ searchButtonLabel: v })} />
          <L10nField label="Popular searches label" value={config.popularLabel} onChange={(v) => set({ popularLabel: v })} />
          <div className="sm:col-span-2">
            <ListEditor
              label="Popular searches"
              value={config.popularSearches}
              onChange={(v) => set({ popularSearches: v })}
              addLabel="Add popular search"
              createItem={() => ({ label: {}, query: '' })}
              renderFields={(item, setItem) => (
                <div className="grid gap-3 sm:grid-cols-2">
                  <L10nField label="Chip label" value={item.label} onChange={(label) => setItem({ label })} />
                  <TextField label="Search query" value={item.query} onChange={(query) => setItem({ query })} placeholder="Class 10 Ex 5.2" />
                </div>
              )}
            />
          </div>
        </>
      )}
      {type === 'classGrid' && (
        <>
          <RefMultiSelect label="Classes" hint="Leave empty to show every published class." resource="classes" value={config.classes} onChange={(v) => set({ classes: v })} />
          <SelectField
            label="Layout"
            value={config.layout || 'default'}
            onChange={(v) => set({ layout: v })}
            options={[
              { value: 'default', label: 'Equal cards' },
              { value: 'featured', label: 'Featured classes as large cards' },
            ]}
          />
        </>
      )}
      {type === 'chapterGrid' && (
        <>
          <RefMultiSelect label="Chapters" hint="Leave empty to show chapters marked as featured." resource="chapters" value={config.chapters} onChange={(v) => set({ chapters: v })} />
          {limit}
        </>
      )}
      {type === 'questionList' && (
        <>
          <RefMultiSelect label="Important questions" hint="Leave both empty to show the latest important questions." resource="important-questions" value={config.importantQuestions} onChange={(v) => set({ importantQuestions: v })} />
          <RefMultiSelect label="NCERT questions" resource="questions" value={config.questions} onChange={(v) => set({ questions: v })} />
          {limit}
        </>
      )}
      {type === 'notes' && (
        <>
          <RefMultiSelect label="Notes" hint="Leave empty to show the latest notes." resource="notes" value={config.notes} onChange={(v) => set({ notes: v })} />
          {limit}
        </>
      )}
      {type === 'videoSection' && <RefMultiSelect label="More videos" hint="Shown after the main video." resource="videos" value={config.videos} onChange={(v) => set({ videos: v })} />}
      {type === 'imageGallery' && (
        <div className="sm:col-span-2">
          <GalleryField value={config.gallery} onChange={(v) => set({ gallery: v })} />
        </div>
      )}
      {type === 'statistics' && <SwitchField label="Live counts from the database" hint="Enables {classes}, {chapters}, {exercises}, {questions}." checked={config.autoStats} onChange={(v) => set({ autoStats: v })} />}
      {['statistics', 'cardGrid'].includes(type) && <NumberField label="Columns (desktop)" value={config.columns} onChange={(v) => set({ columns: v })} min={1} max={6} />}
      {['text', 'custom'].includes(type) && (
        <Field label="Content" className="sm:col-span-2">
          <Suspense fallback={<div className="min-h-28 animate-pulse rounded-lg border bg-muted/40" />}>
            <RichTextEditor value={config.content} onChange={(content) => set({ content })} />
          </Suspense>
        </Field>
      )}
      {type !== 'hero' && (
        <>
          <SelectField
            label="Background"
            value={config.background || 'none'}
            onChange={(v) => set({ background: v })}
            options={[
              { value: 'none', label: 'None' },
              { value: 'muted', label: 'Soft grey' },
              { value: 'grid', label: 'Notebook grid' },
              { value: 'brand', label: 'Brand colour' },
              { value: 'dark', label: 'Dark' },
            ]}
          />
          <SelectField
            label="Heading alignment"
            value={config.align || 'left'}
            onChange={(v) => set({ align: v })}
            options={[
              { value: 'left', label: 'Left' },
              { value: 'center', label: 'Center' },
            ]}
          />
        </>
      )}
    </div>
  );
}

const SECTION_DEFAULTS = { page: 'home', type: 'text', name: '', badge: {}, title: {}, highlight: {}, description: {}, image: null, video: null, buttons: [], items: [], config: DEFAULT_CONFIG, status: 'draft', isVisible: true };
const toSectionForm = (doc) => ({ ...doc, config: { ...DEFAULT_CONFIG, ...(doc.config || {}) } });

export function SectionEditor({ id }) {
  const editor = useEditorForm({ resource: 'sections', id, defaults: SECTION_DEFAULTS, basePath: adminUrl('homepage'), toForm: toSectionForm, label: (s) => s?.title?.en || s?.name });
  const [previewOpen, setPreviewOpen] = useState(false);
  const { form, setField } = editor;
  const meta = SECTION_TYPES[form?.type] || SECTION_TYPES.custom;
  const fields = new Set(meta.fields);

  return (
    <EditorGate editor={editor}>
      {() => (
        <>
          <EditorShell
            title={`${meta.label} section`}
            description={meta.description}
            backTo={adminUrl('homepage')}
            backLabel="Homepage sections"
            doc={editor.doc}
            form={form}
            setField={setField}
            dirty={editor.dirty}
            saving={editor.saving}
            onSave={editor.save}
            onPreview={() => {
              if (editor.dirty) toast.info('Save your changes first — the preview shows the saved version (drafts included).');
              setPreviewOpen(true);
            }}
            onDuplicate={editor.duplicate}
            onDelete={() => editor.remove({ description: 'The section is removed from the homepage. The content it shows is not deleted.' })}
            sidebar={
              <Panel title="Section">
                <div className="space-y-3">
                  <SelectField label="Section type" value={form.type} onChange={(v) => setField('type', v)} options={Object.entries(SECTION_TYPES).map(([value, m]) => ({ value, label: m.label }))} />
                  <TextField label="Internal name / anchor" hint="Used as the #anchor, e.g. #classes." value={form.name} onChange={(v) => setField('name', v)} />
                </div>
              </Panel>
            }
          >
            <Panel title="Heading & text">
              <div className="grid gap-4 sm:grid-cols-2">
                {fields.has('badge') && <L10nField label="Badge" value={form.badge} onChange={(v) => setField('badge', v)} />}
                {fields.has('title') && <L10nField label="Heading" value={form.title} onChange={(v) => setField('title', v)} />}
                {fields.has('highlight') && <L10nField label="Highlighted words" hint="Shown in brand colour after the heading." value={form.highlight} onChange={(v) => setField('highlight', v)} />}
                {fields.has('description') && <L10nField className="sm:col-span-2" label="Description" multiline rows={3} value={form.description} onChange={(v) => setField('description', v)} />}
              </div>
            </Panel>
            {(fields.has('image') || fields.has('video')) && (
              <Panel title="Image & video">
                <div className="grid gap-4">
                  {fields.has('image') && <MediaField label="Image" value={form.image} onChange={(v) => setField('image', v)} />}
                  {fields.has('video') && <VideoField label="YouTube video" value={form.video} onChange={(v) => setField('video', v)} />}
                </div>
              </Panel>
            )}
            <Panel title="Settings">
              <ConfigFields type={form.type} config={form.config} onChange={(v) => setField('config', v)} />
            </Panel>
            {meta.itemFields && (
              <Panel title={meta.itemsLabel}>
                <ItemsEditor type={form.type} value={form.items} onChange={(v) => setField('items', v)} />
              </Panel>
            )}
            {fields.has('buttons') && (
              <Panel title="Buttons">
                <ButtonsEditor value={form.buttons} onChange={(v) => setField('buttons', v)} />
              </Panel>
            )}
          </EditorShell>
          <PreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} path={`/${form.name ? `#${form.name}` : ''}`} />
        </>
      )}
    </EditorGate>
  );
}

export { ListEditor };
