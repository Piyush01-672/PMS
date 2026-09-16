import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, ExternalLink, ImageUp, Loader2, Replace, Save, Search, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { YouTubeEmbed } from '@/components/content/YouTubeEmbed.jsx';
import { EmptyState, ErrorState } from '@/components/site/States.jsx';
import { api, errorMessage, get } from '@/lib/api';
import { adminUrl } from '@/lib/config';
import { imageUrl } from '@/lib/media';
import { extractYouTubeId } from '@/lib/youtube';
import { useConfirm } from '../components/ConfirmDialog.jsx';
import { EditorShell } from '../components/EditorShell.jsx';
import { L10nField, SelectField, SwitchField, TagsField, TextField, TextareaField } from '../components/fields/Fields.jsx';
import { LocalizedCell } from '../components/LocalizedCell.jsx';
import { MEDIA_KIND_OPTIONS, MediaGrid, MediaUploader } from '../components/media/MediaPicker.jsx';
import { PageHeader, Panel } from '../components/PageHeader.jsx';
import { ResourceListPage } from '../components/ResourceListPage.jsx';
import { useAdminAuth } from '../lib/auth.jsx';
import { formatBytes, formatDate } from '../lib/format.js';
import { EditorGate, useEditorForm } from '../lib/useEditorForm.jsx';

const USAGE_PATHS = {
  Class: 'classes',
  Chapter: 'chapters',
  Exercise: 'exercises',
  Question: 'questions',
  Note: 'notes',
  'Important Question': 'important-questions',
  'Homepage Section': 'homepage',
  Page: 'pages',
  Template: 'templates',
};

export function UsageList({ items, loading }) {
  if (loading) return <Skeleton className="h-10" />;
  if (!items?.length) return <p className="text-sm text-muted-foreground">Not used anywhere yet.</p>;
  return (
    <ul className="space-y-1 text-sm">
      {items.map((u) => (
        <li key={`${u.type}-${u.id}`} className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate">
            <span className="text-muted-foreground">{u.type}:</span> {u.label}
          </span>
          {USAGE_PATHS[u.type] && (
            <Link to={adminUrl(`${USAGE_PATHS[u.type]}/${u.id}`)} className="shrink-0 text-xs font-semibold text-brand hover:underline">
              Open
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}

function MediaDetails({ media, onClose }) {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { can } = useAdminAuth();
  const fileRef = useRef(null);
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (media) setForm({ title: media.title || '', alt: media.alt || {}, caption: media.caption || {}, description: media.description || '', kind: media.kind, tags: media.tags || [] });
  }, [media]);

  const usage = useQuery({ queryKey: ['admin', 'media', 'usage', media?._id], queryFn: () => get(`/media/${media._id}/usage`), enabled: Boolean(media) });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin', 'media'] });

  const save = useMutation({
    mutationFn: () => api.put(`/media/${media._id}`, form).then((r) => r.data),
    onSuccess: (doc) => {
      toast.success('Image details saved');
      refresh();
      onClose(doc);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const replace = useMutation({
    mutationFn: (file) => {
      const data = new FormData();
      data.append('file', file);
      return api.post(`/media/${media._id}/replace`, data).then((r) => r.data);
    },
    onSuccess: (doc) => {
      toast.success('File replaced — every page using this image now shows the new file');
      refresh();
      onClose(doc);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const remove = () => {
    const used = usage.data?.items || [];
    confirm({
      title: 'Delete this image?',
      description: used.length
        ? `This image is used in ${used.length} place(s):\n${used
            .slice(0, 6)
            .map((u) => `• ${u.type}: ${u.label}`)
            .join('\n')}\n\nDeleting removes it from those pages.`
        : 'The file will be permanently removed from storage.',
      confirmLabel: used.length ? 'Force delete' : 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          await api.delete(`/media/${media._id}`, { params: used.length ? { force: 'true' } : undefined });
          toast.success('Image deleted');
          refresh();
          onClose(null);
        } catch (error) {
          toast.error(errorMessage(error));
          throw error;
        }
      },
    });
  };

  const absoluteUrl = media ? new URL(media.url, window.location.origin).href : '';

  return (
    <Dialog open={Boolean(media)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        {media && form && (
          <>
            <DialogHeader>
              <DialogTitle>{media.title || media.originalName}</DialogTitle>
              <DialogDescription>
                {media.width && media.height ? `${media.width} × ${media.height}px · ` : ''}
                {formatBytes(media.bytes)} · {media.format?.toUpperCase()} · {media.provider} · uploaded {formatDate(media.createdAt)}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex aspect-square items-center justify-center rounded-xl border bg-white p-3">
                  <img src={imageUrl(media, 960)} alt={media.alt?.en || ''} className="max-h-full max-w-full object-contain" />
                </div>
                <div className="flex gap-2">
                  <Input readOnly value={absoluteUrl} className="h-9 font-mono text-xs" aria-label="Image URL" onFocus={(e) => e.target.select()} />
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Copy image URL"
                    onClick={async () => {
                      await navigator.clipboard.writeText(absoluteUrl);
                      toast.success('URL copied');
                    }}
                  >
                    <Copy />
                  </Button>
                  <Button asChild variant="outline" size="icon" aria-label="Open image">
                    <a href={media.url} target="_blank" rel="noreferrer">
                      <ExternalLink />
                    </a>
                  </Button>
                </div>
                <Panel title="Used in">
                  <UsageList items={usage.data?.items} loading={usage.isPending} />
                </Panel>
              </div>
              <div className="space-y-3">
                <TextField label="Title" value={form.title} onChange={(title) => setForm({ ...form, title })} />
                <L10nField label="Alt text" hint="Describe the image for screen readers and Google Images." value={form.alt} onChange={(alt) => setForm({ ...form, alt })} />
                <L10nField label="Caption" value={form.caption} onChange={(caption) => setForm({ ...form, caption })} multiline rows={2} />
                <TextareaField label="Description" value={form.description} onChange={(description) => setForm({ ...form, description })} rows={2} />
                <SelectField label="Type" value={form.kind} onChange={(kind) => setForm({ ...form, kind })} options={MEDIA_KIND_OPTIONS} />
                <TagsField value={form.tags} onChange={(tags) => setForm({ ...form, tags })} />
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button onClick={() => save.mutate()} disabled={save.isPending}>
                    {save.isPending ? <Loader2 className="animate-spin" /> : <Save />} Save details
                  </Button>
                  <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={replace.isPending}>
                    {replace.isPending ? <Loader2 className="animate-spin" /> : <Replace />} Replace file
                  </Button>
                  <input ref={fileRef} type="file" accept=".png,.jpg,.jpeg,.webp,.svg" className="sr-only" onChange={(e) => e.target.files?.[0] && replace.mutate(e.target.files[0])} />
                  {can('media:delete') && (
                    <Button variant="destructive" onClick={remove}>
                      <Trash2 /> Delete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function MediaLibraryPage({ diagrams = false }) {
  const { can } = useAdminAuth();
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [kind, setKind] = useState(diagrams ? 'diagrams' : '');
  const [page, setPage] = useState(1);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(q);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

  const list = useQuery({
    queryKey: ['admin', 'media', 'library', debounced, kind, page],
    queryFn: () => get('/media', { q: debounced || undefined, kind: kind || undefined, page, limit: 40 }),
    placeholderData: (previous) => previous,
  });

  return (
    <div>
      <PageHeader
        title={diagrams ? 'Diagrams & Graphs' : 'Images & Media'}
        description={
          diagrams
            ? 'Geometry diagrams, construction diagrams, coordinate graphs and figures. Attach them to questions and solution blocks.'
            : 'Every image on the website. Upload once and reuse anywhere; replacing a file updates every page that uses it.'
        }
        actions={
          can('media:write') && (
            <Button size="lg" onClick={() => setUploadOpen(true)}>
              <ImageUp /> Upload
            </Button>
          )
        }
      />
      <div className="mb-4 flex flex-col gap-2 rounded-2xl border bg-card p-3 sm:flex-row">
        <label className="relative flex-1">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input className="h-9 pl-8" placeholder="Search title, alt text, tags…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search media" />
        </label>
        <select
          value={kind}
          onChange={(e) => {
            setKind(e.target.value);
            setPage(1);
          }}
          className="h-9 rounded-lg border bg-background px-2 text-sm"
          aria-label="Filter by type"
        >
          <option value="">All types</option>
          <option value="diagrams">Diagrams, graphs, figures & constructions</option>
          {MEDIA_KIND_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {list.isError ? (
        <ErrorState error={list.error} onRetry={list.refetch} />
      ) : list.isPending ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
          ))}
        </div>
      ) : list.data.items.length === 0 ? (
        <EmptyState
          title="No images found"
          description={q ? 'Try a different search.' : 'Upload your first image.'}
          action={
            can('media:write') && (
              <Button onClick={() => setUploadOpen(true)}>
                <ImageUp /> Upload
              </Button>
            )
          }
        />
      ) : (
        <MediaGrid items={list.data.items} selected={selected ? [selected] : []} onToggle={setSelected} className="lg:grid-cols-5" />
      )}

      {list.data?.pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          {page} / {list.data.pages} · {list.data.total} images
          <Button variant="outline" size="sm" disabled={page >= list.data.pages} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </div>
      )}

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Upload images</DialogTitle>
            <DialogDescription>Files are checked for real image content. SVGs are cleaned of scripts before storage.</DialogDescription>
          </DialogHeader>
          <MediaUploader defaultKind={diagrams ? 'diagram' : 'image'} onUploaded={() => setUploadOpen(false)} />
        </DialogContent>
      </Dialog>

      <MediaDetails media={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

export function DiagramsPage() {
  return <MediaLibraryPage diagrams />;
}

export function VideosList() {
  return (
    <ResourceListPage
      resource="videos"
      title="YouTube Videos"
      description="Every video is stored once. Paste a YouTube URL in any question, solution block, chapter, exercise or homepage section to use it."
      hasStatus={false}
      canDuplicate={false}
      createPath={adminUrl('videos/new')}
      createLabel="Add video"
      editPath={(v) => adminUrl(`videos/${v._id}`)}
      rowLabel={(v) => v.title?.en || v.title?.hi || v.youtubeId}
      columns={[
        {
          header: 'Video',
          cell: (v) => (
            <div className="flex items-center gap-3">
              <img src={v.thumbnailUrl} alt="" loading="lazy" className="aspect-video w-24 shrink-0 rounded-md object-cover" />
              <LocalizedCell value={v.title} />
            </div>
          ),
        },
        { header: 'YouTube ID', className: 'hidden sm:table-cell', cell: (v) => <code className="text-xs">{v.youtubeId}</code> },
        { header: 'Visibility', className: 'hidden md:table-cell', cell: (v) => (v.isVisible ? 'Visible' : 'Hidden') },
      ]}
    />
  );
}

const VIDEO_DEFAULTS = { url: '', title: {}, description: {}, tags: [], isVisible: true };

export function VideoEditor({ id }) {
  const editor = useEditorForm({ resource: 'videos', id, defaults: VIDEO_DEFAULTS, basePath: adminUrl('videos'), label: (v) => v?.title?.en || v?.title?.hi || v?.youtubeId });
  const usage = useQuery({ queryKey: ['admin', 'videos', 'usage', id], queryFn: () => get(`/videos/${id}/usage`), enabled: !editor.isNew });
  const { form, setField } = editor;
  const youtubeId = extractYouTubeId(form?.url || '');
  const used = usage.data?.items || [];

  return (
    <EditorGate editor={editor}>
      {() => (
        <EditorShell
          title={editor.isNew ? 'Add YouTube video' : form.title?.en || form.title?.hi || form.youtubeId}
          backTo={adminUrl('videos')}
          backLabel="All videos"
          hasStatus={false}
          doc={editor.doc}
          form={form}
          setField={setField}
          dirty={editor.dirty}
          saving={editor.saving}
          onSave={editor.save}
          onDelete={() =>
            editor.remove({
              force: used.length > 0,
              description: used.length ? `This video is used in ${used.length} place(s). It will disappear from those pages.` : undefined,
            })
          }
          sidebar={
            !editor.isNew && (
              <Panel title="Used in">
                <UsageList items={used} loading={usage.isPending} />
              </Panel>
            )
          }
        >
          <Panel title="Video">
            <div className="grid gap-4">
              <TextField
                label="YouTube URL"
                required
                value={form.url}
                onChange={(v) => setField('url', v)}
                placeholder="https://www.youtube.com/watch?v=XXXXXXXXXXX or https://youtu.be/XXXXXXXXXXX"
                error={form.url && !youtubeId ? 'Invalid YouTube URL' : undefined}
                hint={youtubeId ? `Video ID: ${youtubeId}` : undefined}
              />
              <L10nField label="Title" value={form.title} onChange={(v) => setField('title', v)} />
              <L10nField label="Description" multiline rows={3} value={form.description} onChange={(v) => setField('description', v)} />
              <TagsField value={form.tags} onChange={(v) => setField('tags', v)} />
              <SwitchField label="Visible on website" hint="Hidden videos are removed from every page without deleting them." checked={form.isVisible} onChange={(v) => setField('isVisible', v)} />
            </div>
          </Panel>
          <Panel title="Player preview">
            {youtubeId ? (
              <YouTubeEmbed video={{ youtubeId, title: form.title, description: form.description, isVisible: true }} />
            ) : (
              <p className="text-sm text-muted-foreground">Paste a valid YouTube URL to preview the player.</p>
            )}
          </Panel>
        </EditorShell>
      )}
    </EditorGate>
  );
}
