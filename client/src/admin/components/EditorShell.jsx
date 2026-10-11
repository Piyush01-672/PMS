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
  previewUrl,
  onDuplicate,
  onDelete,
  hasStatus = true,
  sidebar,
  children,
}) {
  const { can } = useAdminAuth();
  const isEditor = form && typeof form.save === 'function';
  const f = isEditor ? form.form : form;
  const d = doc || (isEditor ? (form.form || form.doc) : doc);
  const sf = setField || (isEditor ? form.setField : () => {});
  const isUnsaved = dirty !== undefined ? dirty : (isEditor ? form.dirty : false);
  const isSaving = saving !== undefined ? saving : (isEditor ? form.saving : false);
  const doSave = onSave || (isEditor ? form.save : () => {});
  const doDuplicate = onDuplicate || (isEditor ? form.duplicate : undefined);
  const doDelete = onDelete || (isEditor && form.remove ? () => form.remove() : undefined);
  const isNew = isEditor ? form.isNew : !d?._id;
  const status = f?.status || 'draft';
  const canPublish = can('content:publish');
  useUnsavedGuard(isUnsaved && !isSaving);

  useEffect(() => {
    const onKey = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        doSave({});
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [doSave]);

  const scheduled = f?.publishedAt && new Date(f.publishedAt) > new Date();

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        backTo={backTo}
        backLabel={backLabel}
        actions={
          <>
            {hasStatus && <StatusBadge doc={{ ...(d || {}), ...(f || {}) }} />}
            {isUnsaved && <span className="text-xs font-semibold text-warning">Unsaved changes</span>}
            {onPreview && (
              <Button type="button" variant="outline" size="lg" onClick={onPreview}>
                <Eye /> Preview
              </Button>
            )}
            <Button type="button" size="lg" onClick={() => doSave({})} disabled={isSaving}>
              {isSaving ? <Loader2 className="animate-spin" /> : <Save />} {isNew ? 'Save' : 'Save changes'}
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
                  <StatusBadge doc={{ ...(d || {}), ...(f || {}) }} />
                </div>
                <div className="grid gap-2">
                  {status !== 'published' && (
                    <Button type="button" variant="outline" onClick={() => doSave({ status: 'draft' })} disabled={isSaving}>
                      <Save /> Save draft
                    </Button>
                  )}
                  {status !== 'published' && canPublish && (
                    <Button type="button" onClick={() => doSave({ status: 'published' })} disabled={isSaving}>
                      {scheduled ? <CalendarClock /> : <Send />} {scheduled ? 'Schedule' : 'Publish'}
                    </Button>
                  )}
                  {status === 'published' && (
                    <Button type="button" onClick={() => doSave({})} disabled={isSaving}>
                      <Save /> Update
                    </Button>
                  )}
                  {status === 'published' && canPublish && (
                    <Button type="button" variant="outline" onClick={() => doSave({ status: 'draft' })} disabled={isSaving}>
                      <Undo2 /> Unpublish
                    </Button>
                  )}
                  {status === 'archived' && (
                    <Button type="button" variant="ghost" onClick={() => doSave({ status: 'draft' })} disabled={isSaving}>
                      <RotateCcw /> Restore as draft
                    </Button>
                  )}
                  {!canPublish && <p className="text-xs text-muted-foreground">An admin needs to publish your draft.</p>}
                </div>
                <SwitchField label="Visible on website" hint="Hide without unpublishing." checked={f?.isVisible !== false} onChange={(v) => sf('isVisible', v)} />
                <DateTimeField label="Publish date" hint="Pick a future date to schedule publishing." value={f?.publishedAt} onChange={(v) => sf('publishedAt', v)} />
              </div>
            </Panel>
          )}

          {sidebar}

          {!isNew && d && (
            <Panel title="More actions">
              <div className="grid gap-2">
                {doDuplicate && (
                  <Button type="button" variant="outline" onClick={doDuplicate}>
                    <Copy /> Duplicate
                  </Button>
                )}
                {hasStatus && status !== 'archived' && canPublish && (
                  <Button type="button" variant="ghost" onClick={() => doSave({ status: 'archived' })}>
                    <Archive /> Archive
                  </Button>
                )}
                {doDelete && can('content:delete') && (
                  <Button type="button" variant="destructive" onClick={doDelete}>
                    <Trash2 /> Delete
                  </Button>
                )}
              </div>
              <dl className="mt-4 space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between gap-2">
                  <dt>Created</dt>
                  <dd>{formatDate(d.createdAt)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Last updated</dt>
                  <dd>{formatDate(d.updatedAt)}</dd>
                </div>
                {d.publishedAt && (
                  <div className="flex justify-between gap-2">
                    <dt>Published</dt>
                    <dd>{formatDate(d.publishedAt)}</dd>
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
