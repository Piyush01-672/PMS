import { Archive, CalendarClock, Copy, Eye, Loader2, RotateCcw, Save, Send, Trash2, Undo2 } from 'lucide-react';
import { useEffect } from 'react';
import { useBlocker } from 'react-router';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '../lib/auth.jsx';
import { formatDate } from '../lib/format.js';
import { useConfirm } from './ConfirmDialog.jsx';
import { DateTimeField, SwitchField } from './fields/Fields.jsx';
import { PageHeader, Panel } from './PageHeader.jsx';
import { StatusBadge } from './StatusBadge.jsx';

export function useUnsavedGuard(dirty) {
  const confirm = useConfirm();
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname);

  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    confirm({ title: 'Leave without saving?', description: 'You have unsaved changes on this page.', confirmLabel: 'Discard changes', destructive: true }).then((ok) =>
      ok ? blocker.proceed() : blocker.reset(),
    );
  }, [blocker, confirm]);

  useEffect(() => {
    if (!dirty) return undefined;
    const handler = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);
}

/**
 * Standard editor layout: form on the left, publishing controls on the right.
 * onSave(overrides) — overrides.status is set by Publish / Unpublish / Save draft buttons.
 */
export function EditorShell({
  title,
  description,
  backTo,
  backLabel,
  doc,
  form,
  setField,
  dirty,
  saving,
  onSave,
  onPreview,
  onDuplicate,
  onDelete,
  hasStatus = true,
  sidebar,
  children,
}) {
  const { can } = useAdminAuth();
  const isNew = !doc?._id;
  const status = form?.status || 'draft';
  const canPublish = can('content:publish');
  useUnsavedGuard(dirty && !saving);

  useEffect(() => {
    const onKey = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        onSave({});
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onSave]);

  const scheduled = form?.publishedAt && new Date(form.publishedAt) > new Date();

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        backTo={backTo}
        backLabel={backLabel}
        actions={
          <>
            {hasStatus && <StatusBadge doc={{ ...doc, ...form }} />}
            {dirty && <span className="text-xs font-semibold text-warning">Unsaved changes</span>}
            {onPreview && (
              <Button type="button" variant="outline" size="lg" onClick={onPreview}>
                <Eye /> Preview
              </Button>
            )}
            <Button type="button" size="lg" onClick={() => onSave({})} disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : <Save />} {isNew ? 'Save' : 'Save changes'}
            </Button>
          </>
        }
      />
      <div className="grid items-start gap-5 xl:grid-cols-12">
        <div className="min-w-0 space-y-5 xl:col-span-8">{children}</div>
        <aside className="space-y-4 xl:sticky xl:top-20 xl:col-span-4">
          {hasStatus && (
            <Panel title="Publish">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge doc={{ ...doc, ...form }} />
                </div>
                <div className="grid gap-2">
                  {status !== 'published' && (
                    <Button type="button" variant="outline" onClick={() => onSave({ status: 'draft' })} disabled={saving}>
                      <Save /> Save draft
                    </Button>
                  )}
                  {status !== 'published' && canPublish && (
                    <Button type="button" onClick={() => onSave({ status: 'published' })} disabled={saving}>
                      {scheduled ? <CalendarClock /> : <Send />} {scheduled ? 'Schedule' : 'Publish'}
                    </Button>
                  )}
                  {status === 'published' && (
                    <Button type="button" onClick={() => onSave({})} disabled={saving}>
                      <Save /> Update
                    </Button>
                  )}
                  {status === 'published' && canPublish && (
                    <Button type="button" variant="outline" onClick={() => onSave({ status: 'draft' })} disabled={saving}>
                      <Undo2 /> Unpublish
                    </Button>
                  )}
                  {status === 'archived' && (
                    <Button type="button" variant="ghost" onClick={() => onSave({ status: 'draft' })} disabled={saving}>
                      <RotateCcw /> Restore as draft
                    </Button>
                  )}
                  {!canPublish && <p className="text-xs text-muted-foreground">An admin needs to publish your draft.</p>}
                </div>
                <SwitchField label="Visible on website" hint="Hide without unpublishing." checked={form?.isVisible !== false} onChange={(v) => setField('isVisible', v)} />
                <DateTimeField label="Publish date" hint="Pick a future date to schedule publishing." value={form?.publishedAt} onChange={(v) => setField('publishedAt', v)} />
              </div>
            </Panel>
          )}

          {sidebar}

          {!isNew && (
            <Panel title="More actions">
              <div className="grid gap-2">
                {onDuplicate && (
                  <Button type="button" variant="outline" onClick={onDuplicate}>
                    <Copy /> Duplicate
                  </Button>
                )}
                {hasStatus && status !== 'archived' && canPublish && (
                  <Button type="button" variant="ghost" onClick={() => onSave({ status: 'archived' })}>
                    <Archive /> Archive
                  </Button>
                )}
                {onDelete && can('content:delete') && (
                  <Button type="button" variant="destructive" onClick={onDelete}>
                    <Trash2 /> Delete
                  </Button>
                )}
              </div>
              <dl className="mt-4 space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between gap-2">
                  <dt>Created</dt>
                  <dd>{formatDate(doc.createdAt)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Last updated</dt>
                  <dd>{formatDate(doc.updatedAt)}</dd>
                </div>
                {doc.publishedAt && (
                  <div className="flex justify-between gap-2">
                    <dt>Published</dt>
                    <dd>{formatDate(doc.publishedAt)}</dd>
                  </div>
                )}
              </dl>
            </Panel>
          )}
        </aside>
      </div>
    </div>
  );
}
