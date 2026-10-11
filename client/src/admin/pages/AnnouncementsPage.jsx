import { Megaphone, Plus } from 'lucide-react';
import { useState } from 'react';
import { adminUrl } from '@/lib/config';
import { EditorShell } from '../components/EditorShell.jsx';
import { Field, L10nField, SelectField, SwitchField } from '../components/fields/Fields.jsx';
import { LocalizedCell } from '../components/LocalizedCell.jsx';
import { Panel } from '../components/PageHeader.jsx';
import { ResourceListPage } from '../components/ResourceListPage.jsx';
import { EditorGate, useEditorForm } from '../lib/useEditorForm.jsx';

export function AnnouncementsList() {
  return (
    <ResourceListPage
      resource="announcements"
      title="Announcements (सूचनाएं व घोषणाएं)"
      description="Create and broadcast urgent announcements, exam alerts, and updates to students on the website header and homepage."
      createPath={adminUrl('announcements/new')}
      createLabel="New Announcement"
      editPath={(item) => adminUrl(`announcements/${item._id}`)}
      rowLabel={(a) => a.text?.en || a.text?.hi || 'Announcement'}
      columns={[
        { header: 'Badge', className: 'w-24', cell: (a) => <span className="rounded bg-brand-soft px-2 py-0.5 text-xs font-bold text-brand">{a.badge?.en || a.badge?.hi || 'Notice'}</span> },
        { header: 'Text', cell: (a) => <LocalizedCell value={a.text} /> },
        { header: 'Variant', className: 'hidden sm:table-cell', cell: (a) => <span className="capitalize text-xs font-semibold">{a.variant || 'brand'}</span> },
        {
          header: 'Visible',
          className: 'w-20',
          cell: (a) => (
            <span className={`text-xs font-semibold ${a.isVisible !== false ? 'text-emerald-600' : 'text-muted-foreground'}`}>
              {a.isVisible !== false ? 'Active' : 'Hidden'}
            </span>
          ),
        },
      ]}
    />
  );
}

export function AnnouncementEditor({ id }) {
  const form = useEditorForm({
    resource: 'announcements',
    id,
    entityType: 'Announcement',
    defaults: () => ({
      badge: { hi: 'सूचना', en: 'New Alert', mixed: 'New' },
      text: { hi: '', en: '', mixed: '' },
      linkLabel: { hi: 'अधिक जानें', en: 'Learn more', mixed: 'Learn more' },
      linkUrl: '',
      variant: 'brand',
      startsAt: null,
      endsAt: null,
      isVisible: true,
      sortOrder: 0,
    }),
  });

  const { doc, set, isNew } = form;

  return (
    <EditorGate form={form}>
      <EditorShell
        form={form}
        title={isNew ? 'New Announcement' : `Announcement — ${doc.text?.en || doc.text?.hi || ''}`}
      >
        <div className="grid gap-6">
          <Panel title="Announcement Message">
            <L10nField label="Badge Text" value={doc.badge} onChange={(badge) => set('badge', badge)} placeholder="e.g. Exam Alert / नया अपडेट" required />
            <L10nField label="Main Text" value={doc.text} onChange={(text) => set('text', text)} placeholder="e.g. Class 10 Board Exam 2026 Sample Papers and Solutions are now available!" required />

            <div className="grid gap-4 sm:grid-cols-2">
              <L10nField label="Link Button Label (Optional)" value={doc.linkLabel} onChange={(linkLabel) => set('linkLabel', linkLabel)} placeholder="e.g. View Sample Papers" />
              <Field label="Link Destination URL">
                <input
                  type="text"
                  value={doc.linkUrl || ''}
                  onChange={(e) => set('linkUrl', e.target.value)}
                  placeholder="/class-10/maths/resources or https://..."
                  className="h-9 w-full rounded-md border bg-transparent px-3 text-xs"
                />
              </Field>
            </div>

            <SelectField
              label="Color Theme / Variant"
              value={doc.variant || 'brand'}
              onChange={(variant) => set('variant', variant)}
              options={[
                { value: 'brand', label: 'Brand (Indigo / Blue)' },
                { value: 'info', label: 'Info (Sky Blue)' },
                { value: 'success', label: 'Success (Green)' },
                { value: 'warning', label: 'Warning (Orange / Saffron)' },
              ]}
            />
          </Panel>

          <Panel title="Visibility & Schedule">
            <SwitchField
              label="Active & Visible"
              hint="Instantly broadcast or hide this announcement from students."
              checked={doc.isVisible !== false}
              onChange={(isVisible) => set('isVisible', isVisible)}
            />
          </Panel>
        </div>
      </EditorShell>
    </EditorGate>
  );
}
