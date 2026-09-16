import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ErrorState } from '@/components/site/States.jsx';
import { api, errorMessage, get } from '@/lib/api';
import { adminUrl } from '@/lib/config';
import { useConfirm } from '../components/ConfirmDialog.jsx';
import { useUnsavedGuard } from '../components/EditorShell.jsx';
import { ColorField, DateTimeField, Field, L10nField, NumberField, SelectField, SwitchField, TextField } from '../components/fields/Fields.jsx';
import { RefSelect } from '../components/fields/RefSelect.jsx';
import { MediaField } from '../components/media/MediaFields.jsx';
import { PageHeader, Panel } from '../components/PageHeader.jsx';
import { ROBOTS_OPTIONS } from '../components/SeoFields.jsx';
import { DragHandle, SortableList, clientKey, moveItem, withKeys } from '../components/SortableList.jsx';
import { useAdminAuth } from '../lib/auth.jsx';
import { normalizeRefs, useResourceList, useResourceMutations } from '../lib/resources.js';
import { ListEditor } from './HomepagePages.jsx';

export function useSiteSettingsForm() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['admin', 'site-settings'], queryFn: () => get('/site-settings', { scope: 'admin' }) });
  const [form, setForm] = useState(null);
  const [baseline, setBaseline] = useState(null);

  useEffect(() => {
    if (query.data && !form) {
      setForm(query.data);
      setBaseline(JSON.stringify(query.data));
    }
  }, [query.data, form]);

  const dirty = Boolean(form) && JSON.stringify(form) !== baseline;
  useUnsavedGuard(dirty);

  const mutation = useMutation({
    mutationFn: (sections) => api.put('/site-settings', normalizeRefs(Object.fromEntries(sections.map((s) => [s, form[s]])))).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.setQueryData(['admin', 'site-settings'], data);
      queryClient.invalidateQueries({ queryKey: ['site'] });
      setForm(data);
      setBaseline(JSON.stringify(data));
      toast.success('Settings saved — the website is updated');
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return {
    query,
    form,
    dirty,
    saving: mutation.isPending,
    save: (sections) => mutation.mutate(sections),
    setSection: (section, value) => setForm((f) => ({ ...f, [section]: value })),
    patch: (section, values) => setForm((f) => ({ ...f, [section]: { ...(f[section] || {}), ...values } })),
  };
}

export function SaveBar({ dirty, saving, onSave, label = 'Save changes' }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-3 mt-6 flex items-center justify-end gap-3 border-t bg-background/95 px-3 py-3 backdrop-blur sm:-mx-6 sm:px-6">
      <span className={dirty ? 'text-xs font-semibold text-warning' : 'text-xs text-muted-foreground'}>{dirty ? 'Unsaved changes' : 'All changes saved'}</span>
      <Button onClick={onSave} disabled={saving || !dirty}>
        {saving ? <Loader2 className="animate-spin" /> : <Save />} {label}
      </Button>
    </div>
  );
}

function SettingsGate({ settings, children }) {
  if (settings.query.isError) return <ErrorState error={settings.query.error} onRetry={settings.query.refetch} />;
  if (!settings.form) return <Skeleton className="h-96 rounded-2xl" />;
  return children();
}

const SOCIAL_PLATFORMS = ['youtube', 'facebook', 'instagram', 'x', 'telegram', 'whatsapp', 'linkedin', 'website'].map((value) => ({ value, label: value === 'x' ? 'X (Twitter)' : value[0].toUpperCase() + value.slice(1) }));

export function WebsiteSettingsPage() {
  const settings = useSiteSettingsForm();
  const { form, patch, setSection } = settings;
  return (
    <div>
      <PageHeader title="Website Settings" description="Brand, logo, contact details, social links and colours." />
      <SettingsGate settings={settings}>
        {() => (
          <>
            <Tabs defaultValue="brand">
              <TabsList className="flex-wrap">
                <TabsTrigger value="brand">Brand & logo</TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
                <TabsTrigger value="social">Social links</TabsTrigger>
                <TabsTrigger value="theme">Theme</TabsTrigger>
              </TabsList>
              <TabsContent value="brand" className="mt-4">
                <Panel title="Brand">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <L10nField label="Website name" value={form.brand?.name} onChange={(v) => patch('brand', { name: v })} />
                    <TextField label="Short name" value={form.brand?.shortName} onChange={(v) => patch('brand', { shortName: v })} />
                    <L10nField label="Tagline" value={form.brand?.tagline} onChange={(v) => patch('brand', { tagline: v })} />
                    <TextField label="Logo alt text" value={form.brand?.logoAlt} onChange={(v) => patch('brand', { logoAlt: v })} />
                    <MediaField label="Header logo" hint="Used in the header, admin panel and login page." value={form.brand?.logo} onChange={(v) => patch('brand', { logo: v })} kind="logo" />
                    <MediaField label="Footer logo" value={form.brand?.footerLogo} onChange={(v) => patch('brand', { footerLogo: v })} kind="logo" />
                    <MediaField label="Favicon" hint="Square PNG, at least 192×192px." value={form.brand?.favicon} onChange={(v) => patch('brand', { favicon: v })} kind="logo" />
                  </div>
                </Panel>
              </TabsContent>
              <TabsContent value="contact" className="mt-4">
                <Panel title="Contact details" description="Shown in the footer and on the Contact page.">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField label="Email" type="email" value={form.contact?.email} onChange={(v) => patch('contact', { email: v })} />
                    <TextField label="Phone" value={form.contact?.phone} onChange={(v) => patch('contact', { phone: v })} />
                    <TextField label="WhatsApp" value={form.contact?.whatsapp} onChange={(v) => patch('contact', { whatsapp: v })} />
                    <L10nField label="Address" multiline rows={2} value={form.contact?.address} onChange={(v) => patch('contact', { address: v })} />
                  </div>
                </Panel>
              </TabsContent>
              <TabsContent value="social" className="mt-4">
                <Panel title="Social links">
                  <ListEditor
                    value={form.social}
                    onChange={(v) => setSection('social', v)}
                    addLabel="Add social link"
                    createItem={() => ({ platform: 'youtube', url: '' })}
                    renderFields={(item, set) => (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <SelectField label="Platform" value={item.platform} onChange={(platform) => set({ platform })} options={SOCIAL_PLATFORMS} />
                        <TextField label="URL" value={item.url} onChange={(url) => set({ url })} placeholder="https://" />
                      </div>
                    )}
                  />
                </Panel>
              </TabsContent>
              <TabsContent value="theme" className="mt-4">
                <Panel title="Colours" description="Brick red and saffron match the PMS logo. Changes apply across the whole website.">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <ColorField label="Brand colour" value={form.theme?.brandColor} onChange={(v) => patch('theme', { brandColor: v })} />
                    <ColorField label="Accent colour" value={form.theme?.accentColor} onChange={(v) => patch('theme', { accentColor: v })} />
                    <ColorField label="Text colour" value={form.theme?.inkColor} onChange={(v) => patch('theme', { inkColor: v })} />
                    <SelectField
                      label="Default theme"
                      value={form.theme?.defaultMode}
                      onChange={(v) => patch('theme', { defaultMode: v })}
                      options={[
                        { value: 'light', label: 'Light' },
                        { value: 'dark', label: 'Dark' },
                        { value: 'system', label: "Follow the student's device" },
                      ]}
                    />
                  </div>
                </Panel>
              </TabsContent>
            </Tabs>
            <SaveBar dirty={settings.dirty} saving={settings.saving} onSave={() => settings.save(['brand', 'contact', 'social', 'theme'])} />
          </>
        )}
      </SettingsGate>
    </div>
  );
}

const ANNOUNCEMENT_FIELDS = ['text', 'badge', 'linkLabel', 'linkUrl', 'variant', 'startsAt', 'endsAt', 'isVisible'];
const pickFields = (obj, fields) => JSON.stringify(Object.fromEntries(fields.map((f) => [f, obj?.[f] ?? null])));

function AnnouncementCard({ item }) {
  const confirm = useConfirm();
  const { save, remove } = useResourceMutations('announcements');
  const [form, setForm] = useState(item);
  const dirty = pickFields(form, ANNOUNCEMENT_FIELDS) !== pickFields(item, ANNOUNCEMENT_FIELDS);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  return (
    <li className="rounded-xl border bg-background p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <L10nField className="sm:col-span-2" label="Announcement text" value={form.text} onChange={(text) => set({ text })} />
        <L10nField label="Badge" value={form.badge} onChange={(badge) => set({ badge })} />
        <SelectField
          label="Colour"
          value={form.variant}
          onChange={(variant) => set({ variant })}
          options={[
            { value: 'brand', label: 'Brand gradient' },
            { value: 'info', label: 'Indigo' },
            { value: 'success', label: 'Green' },
            { value: 'warning', label: 'Saffron' },
          ]}
        />
        <L10nField label="Link label" value={form.linkLabel} onChange={(linkLabel) => set({ linkLabel })} />
        <TextField label="Link URL" value={form.linkUrl} onChange={(linkUrl) => set({ linkUrl })} />
        <DateTimeField label="Show from (optional)" value={form.startsAt} onChange={(startsAt) => set({ startsAt })} />
        <DateTimeField label="Show until (optional)" value={form.endsAt} onChange={(endsAt) => set({ endsAt })} />
        <SwitchField label="Visible" checked={form.isVisible} onChange={(isVisible) => set({ isVisible })} />
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => confirm({ title: 'Delete this announcement?', destructive: true, confirmLabel: 'Delete', onConfirm: () => remove.mutateAsync({ id: item._id }) })}
        >
          <Trash2 className="text-destructive" /> Delete
        </Button>
        <Button size="sm" disabled={!dirty || save.isPending} onClick={() => save.mutate({ id: item._id, data: form }, { onSuccess: () => toast.success('Announcement saved') })}>
          {save.isPending ? <Loader2 className="animate-spin" /> : <Save />} Save
        </Button>
      </div>
    </li>
  );
}

function AnnouncementsPanel() {
  const list = useResourceList('announcements', { limit: 50 });
  const { save } = useResourceMutations('announcements');
  return (
    <Panel
      title="Announcement bar"
      description="The strip above the header. The first active announcement is shown."
      actions={
        <Button size="sm" variant="outline" onClick={() => save.mutate({ data: { text: { hi: 'नई घोषणा', en: 'New announcement' }, isVisible: false } }, { onSuccess: () => toast.success('Announcement added (hidden until you make it visible)') })}>
          <Plus /> Add
        </Button>
      }
    >
      {list.isPending ? (
        <Skeleton className="h-40" />
      ) : list.data?.items?.length ? (
        <ul className="space-y-3">
          {list.data.items.map((item) => (
            <AnnouncementCard key={`${item._id}-${item.updatedAt}`} item={item} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No announcements.</p>
      )}
    </Panel>
  );
}

export function HeaderSettingsPage() {
  const settings = useSiteSettingsForm();
  const { form, patch } = settings;
  return (
    <div>
      <PageHeader
        title="Header"
        description="Logo and brand name come from Website Settings; menu items from Navigation."
        actions={
          <>
            <Button asChild variant="outline" size="lg">
              <Link to={adminUrl('settings')}>Logo & brand</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to={adminUrl('navigation')}>Menu items</Link>
            </Button>
          </>
        }
      />
      <SettingsGate settings={settings}>
        {() => (
          <div className="space-y-5">
            <Panel title="Header options">
              <div className="grid gap-3 sm:grid-cols-2">
                <SwitchField label="Sticky header" checked={form.header?.sticky} onChange={(v) => patch('header', { sticky: v })} />
                <SwitchField label="Show search" checked={form.header?.showSearch} onChange={(v) => patch('header', { showSearch: v })} />
                <SwitchField label="Show हिंदी / ENG switch" checked={form.header?.showLanguageSwitch} onChange={(v) => patch('header', { showLanguageSwitch: v })} />
                <SwitchField label="Show light / dark switch" checked={form.header?.showThemeSwitch} onChange={(v) => patch('header', { showThemeSwitch: v })} />
                <SwitchField label="Show announcement bar" checked={form.header?.showAnnouncement} onChange={(v) => patch('header', { showAnnouncement: v })} />
                <SwitchField label="Show login button" checked={form.header?.showLoginButton} onChange={(v) => patch('header', { showLoginButton: v })} />
                <L10nField label="Search placeholder" value={form.header?.searchPlaceholder} onChange={(v) => patch('header', { searchPlaceholder: v })} />
                <L10nField label="Login button label" value={form.header?.loginLabel} onChange={(v) => patch('header', { loginLabel: v })} />
                <TextField label="Login button URL" value={form.header?.loginUrl} onChange={(v) => patch('header', { loginUrl: v })} />
              </div>
            </Panel>
            <SaveBar dirty={settings.dirty} saving={settings.saving} onSave={() => settings.save(['header'])} />
            <AnnouncementsPanel />
          </div>
        )}
      </SettingsGate>
    </div>
  );
}

const NAV_TYPES = [
  { value: 'link', label: 'Link' },
  { value: 'classes', label: 'Class list (automatic from database)' },
  { value: 'column', label: 'Group of links (dropdown / footer column)' },
];

export function NavEditor({ navKey, title, description }) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['admin', 'navigation', navKey], queryFn: () => get(`/navigation/${navKey}`) });
  const [items, setItems] = useState(null);
  const [baseline, setBaseline] = useState('');

  const load = (list) => {
    const next = withKeys(list).map((item) => ({ ...item, children: withKeys(item.children || []) }));
    setItems(next);
    setBaseline(JSON.stringify(next));
  };
  useEffect(() => {
    if (query.data && items === null) load(query.data.items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data, items]);

  const mutation = useMutation({
    mutationFn: () => api.put(`/navigation/${navKey}`, { items }).then((r) => r.data),
    onSuccess: (data) => {
      load(data.items);
      queryClient.invalidateQueries({ queryKey: ['site'] });
      toast.success(`${title} saved`);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const dirty = items !== null && JSON.stringify(items) !== baseline;
  const update = (index, patch) => setItems(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  return (
    <Panel
      title={title}
      description={description}
      actions={
        <Button size="sm" disabled={!dirty || mutation.isPending} onClick={() => mutation.mutate()}>
          {mutation.isPending ? <Loader2 className="animate-spin" /> : <Save />} Save menu
        </Button>
      }
    >
      {items === null ? (
        <Skeleton className="h-40" />
      ) : (
        <>
          <SortableList
            items={items}
            onChange={setItems}
            className="space-y-2"
            renderItem={(item, index, { ref, style, handleProps }) => (
              <li ref={ref} style={style} className={`rounded-xl border bg-background p-3 ${item.isVisible === false ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-2">
                  <DragHandle {...handleProps} />
                  <div className="grid flex-1 gap-3 sm:grid-cols-2">
                    <L10nField label="Label" value={item.label} onChange={(label) => update(index, { label })} />
                    <SelectField label="Type" value={item.type || 'link'} onChange={(type) => update(index, { type })} options={NAV_TYPES} />
                    {(item.type || 'link') === 'link' && (
                      <>
                        <TextField label="URL" value={item.url} onChange={(url) => update(index, { url })} placeholder="/about-us or https://…" />
                        <SwitchField label="Open in new tab" checked={item.newTab} onChange={(newTab) => update(index, { newTab })} />
                      </>
                    )}
                    <SwitchField label="Visible" checked={item.isVisible !== false} onChange={(isVisible) => update(index, { isVisible })} />
                    {item.type === 'column' && (
                      <div className="sm:col-span-2">
                        <ListEditor
                          label="Links in this group"
                          value={item.children}
                          onChange={(children) => update(index, { children })}
                          addLabel="Add link"
                          createItem={() => ({ label: {}, url: '', newTab: false, isVisible: true })}
                          renderFields={(child, set) => (
                            <div className="grid gap-3 sm:grid-cols-2">
                              <L10nField label="Label" value={child.label} onChange={(label) => set({ label })} />
                              <TextField label="URL" value={child.url} onChange={(url) => set({ url })} />
                              <SwitchField label="Open in new tab" checked={child.newTab} onChange={(newTab) => set({ newTab })} />
                              <SwitchField label="Visible" checked={child.isVisible !== false} onChange={(isVisible) => set({ isVisible })} />
                            </div>
                          )}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <Button variant="ghost" size="icon-sm" onClick={() => setItems(moveItem(items, index, index - 1))} disabled={index === 0} aria-label="Move up">
                      ↑
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => setItems(moveItem(items, index, index + 1))} disabled={index === items.length - 1} aria-label="Move down">
                      ↓
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => setItems(items.filter((_, i) => i !== index))} aria-label="Remove menu item">
                      <Trash2 className="text-destructive" />
                    </Button>
                  </div>
                </div>
              </li>
            )}
          />
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setItems([...items, { _key: clientKey(), label: {}, url: '', type: 'link', newTab: false, isVisible: true, children: [] }])}>
            <Plus /> Add menu item
          </Button>
        </>
      )}
    </Panel>
  );
}

export function NavigationPage() {
  return (
    <div>
      <PageHeader title="Navigation" description="Header menu, footer columns and footer bottom links. “Class list” items always show the live classes from the database." />
      <Tabs defaultValue="header">
        <TabsList>
          <TabsTrigger value="header">Header menu</TabsTrigger>
          <TabsTrigger value="footer">Footer columns</TabsTrigger>
          <TabsTrigger value="footerBottom">Footer bottom</TabsTrigger>
        </TabsList>
        <TabsContent value="header" className="mt-4">
          <NavEditor navKey="header" title="Header menu" description="Desktop menu. The mobile ☰ menu also lists every class with NCERT Solutions, अध्याय, प्रश्नावली, Important Questions and Notes." />
        </TabsContent>
        <TabsContent value="footer" className="mt-4">
          <NavEditor navKey="footer" title="Footer columns" />
        </TabsContent>
        <TabsContent value="footerBottom" className="mt-4">
          <NavEditor navKey="footerBottom" title="Footer bottom links" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function FooterSettingsPage() {
  const settings = useSiteSettingsForm();
  const { form, patch } = settings;
  return (
    <div>
      <PageHeader title="Footer" description="Footer text, badges and link columns." />
      <SettingsGate settings={settings}>
        {() => (
          <div className="space-y-5">
            <Panel title="Footer content">
              <div className="grid gap-4 sm:grid-cols-2">
                <L10nField className="sm:col-span-2" label="Description" multiline rows={3} value={form.footer?.description} onChange={(v) => patch('footer', { description: v })} />
                <L10nField label="Copyright" hint="{year} is replaced with the current year." value={form.footer?.copyright} onChange={(v) => patch('footer', { copyright: v })} />
                <SwitchField label="Show social links" checked={form.footer?.showSocial} onChange={(v) => patch('footer', { showSocial: v })} />
                <L10nField className="sm:col-span-2" label="Disclaimer" multiline rows={2} value={form.footer?.disclaimer} onChange={(v) => patch('footer', { disclaimer: v })} />
                <div className="sm:col-span-2">
                  <ListEditor
                    label="Badges"
                    value={(form.footer?.badges || []).map((b) => (typeof b === 'object' ? b : { hi: b, en: b }))}
                    onChange={(badges) => patch('footer', { badges: badges.map(({ _key, ...b }) => b) })}
                    addLabel="Add badge"
                    createItem={() => ({ hi: '', en: '' })}
                    renderFields={(badge, set) => <L10nField label="Badge text" value={badge} onChange={(v) => set(v)} />}
                  />
                </div>
              </div>
            </Panel>
            <SaveBar dirty={settings.dirty} saving={settings.saving} onSave={() => settings.save(['footer'])} />
            <NavEditor navKey="footer" title="Footer columns" description="MATHEMATICS (class list), IMPORTANT LINKS and any other column." />
            <NavEditor navKey="footerBottom" title="Footer bottom links" />
          </div>
        )}
      </SettingsGate>
    </div>
  );
}

export function LanguageSettingsPage() {
  const settings = useSiteSettingsForm();
  const { form, patch, setSection } = settings;
  const [newKey, setNewKey] = useState('');
  return (
    <div>
      <PageHeader title="Language" description="Default language, the हिंदी / ENG switch and all frontend terminology (अध्याय, प्रश्नावली, हल…)." />
      <SettingsGate settings={settings}>
        {() => {
          const terms = form.terminology || [];
          const updateTerm = (index, patchValue) => setSection('terminology', terms.map((t, i) => (i === index ? { ...t, ...patchValue } : t)));
          return (
            <div className="space-y-5">
              <Panel title="Language switch">
                <div className="grid gap-3 sm:grid-cols-3">
                  <SelectField
                    label="Default language"
                    value={form.language?.default}
                    onChange={(v) => patch('language', { default: v })}
                    options={[
                      { value: 'hi', label: 'हिंदी' },
                      { value: 'en', label: 'English' },
                    ]}
                  />
                  <SwitchField label="Enable हिंदी / ENG switch" checked={form.language?.enableToggle} onChange={(v) => patch('language', { enableToggle: v })} />
                  <SwitchField label="Show “हिंदी में देखें / View in English” on study pages" checked={form.language?.showLanguageNotice} onChange={(v) => patch('language', { showLanguageNotice: v })} />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Content is never auto-translated. Every question, solution block and page has its own हिंदी, English and Mixed fields plus a language mode.
                </p>
              </Panel>
              <Panel title="Terminology" description="Labels used across the student website. Per the requirement, “अध्याय” and “प्रश्नावली” are used in both languages by default.">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[34rem] text-sm">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground">
                        <th className="pb-2 font-semibold">Key</th>
                        <th className="pb-2 font-semibold">हिंदी mode</th>
                        <th className="pb-2 font-semibold">ENG mode</th>
                        <th className="w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {terms.map((t, index) => (
                        <tr key={t.key} className="border-t">
                          <td className="py-1.5 pr-2 font-mono text-xs">{t.key}</td>
                          <td className="py-1.5 pr-2">
                            <Input className="h-8" lang="hi" value={t.hi} onChange={(e) => updateTerm(index, { hi: e.target.value })} aria-label={`${t.key} Hindi`} />
                          </td>
                          <td className="py-1.5 pr-2">
                            <Input className="h-8" value={t.en} onChange={(e) => updateTerm(index, { en: e.target.value })} aria-label={`${t.key} English`} />
                          </td>
                          <td>
                            <Button variant="ghost" size="icon-sm" onClick={() => setSection('terminology', terms.filter((_, i) => i !== index))} aria-label={`Reset ${t.key} to default`} title="Remove (falls back to the built-in default)">
                              <Trash2 />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 flex gap-2">
                  <Input className="h-9 max-w-xs font-mono" placeholder="newTermKey" value={newKey} onChange={(e) => setNewKey(e.target.value.replace(/[^A-Za-z0-9_]/g, ''))} aria-label="New term key" />
                  <Button
                    variant="outline"
                    disabled={!newKey || terms.some((t) => t.key === newKey)}
                    onClick={() => {
                      setSection('terminology', [...terms, { key: newKey, hi: '', en: '' }]);
                      setNewKey('');
                    }}
                  >
                    <Plus /> Add term
                  </Button>
                </div>
              </Panel>
              <SaveBar dirty={settings.dirty} saving={settings.saving} onSave={() => settings.save(['language', 'terminology'])} />
            </div>
          );
        }}
      </SettingsGate>
    </div>
  );
}

const SEO_ROUTE_FIELDS = ['title', 'description', 'robots', 'canonical', 'ogImage'];

function SeoRouteCard({ item }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(item);
  const dirty = pickFields(normalizeRefs(form), SEO_ROUTE_FIELDS) !== pickFields(normalizeRefs(item), SEO_ROUTE_FIELDS);
  const mutation = useMutation({
    mutationFn: () => api.put(`/seo-settings/${item.routeKey}`, normalizeRefs(form)).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'seo-settings'] });
      queryClient.invalidateQueries({ queryKey: ['site'] });
      toast.success(`${item.label} SEO saved`);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  return (
    <Panel
      title={item.label}
      actions={
        <Button size="sm" disabled={!dirty || mutation.isPending} onClick={() => mutation.mutate()}>
          {mutation.isPending ? <Loader2 className="animate-spin" /> : <Save />} Save
        </Button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <L10nField label="SEO title" value={form.title} onChange={(title) => set({ title })} />
        <SelectField label="Robots" value={form.robots || 'index,follow'} onChange={(robots) => set({ robots })} options={ROBOTS_OPTIONS} />
        <L10nField className="sm:col-span-2" label="Meta description" multiline rows={2} value={form.description} onChange={(description) => set({ description })} />
        <TextField label="Canonical URL" value={form.canonical} onChange={(canonical) => set({ canonical })} />
        <MediaField label="Open Graph image" value={form.ogImage} onChange={(ogImage) => set({ ogImage })} />
      </div>
    </Panel>
  );
}

const AUDIT_PATHS = { Class: 'classes', Chapter: 'chapters', Exercise: 'exercises', Question: 'questions', Note: 'notes', Page: 'pages' };

export function SeoPage() {
  const settings = useSiteSettingsForm();
  const routes = useQuery({ queryKey: ['admin', 'seo-settings'], queryFn: () => get('/seo-settings') });
  const audit = useQuery({ queryKey: ['admin', 'seo-audit'], queryFn: () => get('/seo/audit') });
  const { can } = useAdminAuth();
  const { form, patch } = settings;
  return (
    <div>
      <PageHeader
        title="SEO"
        description="Titles, descriptions, canonical URLs, Open Graph images, breadcrumb / article / FAQ schema and the sitemap. Each class, अध्याय, प्रश्नावली, question, note and page also has its own SEO panel."
        actions={
          <>
            <Button asChild variant="outline" size="lg">
              <a href="/sitemap.xml" target="_blank" rel="noreferrer">
                <ExternalLink /> sitemap.xml
              </a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="/robots.txt" target="_blank" rel="noreferrer">
                <ExternalLink /> robots.txt
              </a>
            </Button>
          </>
        }
      />
      <div className="space-y-5">
        <SettingsGate settings={settings}>
          {() => (
            <>
              <Panel title="Global SEO defaults">
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField label="Website URL" hint="e.g. https://www.passionmathsstudy.com — used for canonical URLs and the sitemap." value={form.seo?.siteUrl} onChange={(v) => patch('seo', { siteUrl: v })} />
                  <TextField label="Title template" hint="%s is replaced by the page title." value={form.seo?.titleTemplate} onChange={(v) => patch('seo', { titleTemplate: v })} />
                  <L10nField label="Default title" value={form.seo?.defaultTitle} onChange={(v) => patch('seo', { defaultTitle: v })} />
                  <TextField label="Organization name (schema)" value={form.seo?.organizationName} onChange={(v) => patch('seo', { organizationName: v })} />
                  <L10nField className="sm:col-span-2" label="Default meta description" multiline rows={2} value={form.seo?.defaultDescription} onChange={(v) => patch('seo', { defaultDescription: v })} />
                  <MediaField label="Default Open Graph image" value={form.seo?.defaultOgImage} onChange={(v) => patch('seo', { defaultOgImage: v })} />
                  <div className="grid gap-4">
                    <TextField label="X / Twitter handle" value={form.seo?.twitterHandle} onChange={(v) => patch('seo', { twitterHandle: v })} placeholder="@passionmaths" />
                    <TextField label="Google site verification" value={form.seo?.googleSiteVerification} onChange={(v) => patch('seo', { googleSiteVerification: v })} />
                  </div>
                </div>
              </Panel>
              {can('settings:write') && <SaveBar dirty={settings.dirty} saving={settings.saving} onSave={() => settings.save(['seo'])} />}
            </>
          )}
        </SettingsGate>

        {routes.data?.items?.map((item) => (
          <SeoRouteCard key={`${item.routeKey}-${item.updatedAt || ''}`} item={item} />
        ))}

        <Panel title="Missing SEO fields" description="Published content without a custom SEO title or meta description. Automatic values are used until you add them.">
          {audit.isPending ? (
            <Skeleton className="h-24" />
          ) : audit.data?.items?.length ? (
            <ul className="max-h-96 divide-y overflow-y-auto">
              {audit.data.items.map((row) => (
                <li key={`${row.type}-${row.id}`} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="min-w-0 truncate">
                    <span className="text-muted-foreground">{row.type}:</span> {row.label}
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    <span className="text-xs text-warning">missing {row.missing.join(' & ')}</span>
                    <Link to={adminUrl(`${AUDIT_PATHS[row.type]}/${row.id}`)} className="text-xs font-semibold text-brand hover:underline">
                      Edit
                    </Link>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-success">Every published item has a custom SEO title and description.</p>
          )}
        </Panel>
      </div>
    </div>
  );
}

const PLACEMENTS = [
  { value: 'belowHeader', label: 'Below header' },
  { value: 'inContent', label: 'Inside content (between questions)' },
  { value: 'sidebar', label: 'Sidebar (desktop)' },
  { value: 'afterContent', label: 'After content' },
  { value: 'aboveFooter', label: 'Above footer' },
];
const PAGE_TYPES = ['home', 'class', 'subject', 'chapter', 'exercise', 'question', 'notes', 'page', 'search'];
const AD_FIELDS = ['name', 'placement', 'device', 'pageTypes', 'code', 'minHeightMobile', 'minHeightDesktop', 'isEnabled'];

function AdSlotCard({ slot }) {
  const { can } = useAdminAuth();
  const confirm = useConfirm();
  const { save, remove } = useResourceMutations('ad-slots');
  const [form, setForm] = useState(slot);
  const dirty = pickFields(form, AD_FIELDS) !== pickFields(slot, AD_FIELDS);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const canCode = can('ads:code');
  return (
    <li className="rounded-2xl border bg-card p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <TextField label="Name" value={form.name} onChange={(name) => set({ name })} />
        <SelectField label="Placement" value={form.placement} onChange={(placement) => set({ placement })} options={PLACEMENTS} />
        <SelectField
          label="Device"
          value={form.device}
          onChange={(device) => set({ device })}
          options={[
            { value: 'all', label: 'All devices' },
            { value: 'desktop', label: 'Desktop only' },
            { value: 'mobile', label: 'Mobile only' },
          ]}
        />
        <SwitchField label="Enabled" checked={form.isEnabled} onChange={(isEnabled) => set({ isEnabled })} />
        <NumberField label="Reserved height — mobile (px)" value={form.minHeightMobile} onChange={(v) => set({ minHeightMobile: v })} min={0} max={600} />
        <NumberField label="Reserved height — desktop (px)" value={form.minHeightDesktop} onChange={(v) => set({ minHeightDesktop: v })} min={0} max={600} />
        <Field label="Show on pages" hint="None selected = all pages" className="sm:col-span-2">
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {PAGE_TYPES.map((type) => (
              <label key={type} className="flex items-center gap-1.5 text-sm capitalize">
                <Checkbox
                  checked={(form.pageTypes || []).includes(type)}
                  onCheckedChange={(checked) => set({ pageTypes: checked ? [...(form.pageTypes || []), type] : (form.pageTypes || []).filter((t) => t !== type) })}
                />
                {type}
              </label>
            ))}
          </div>
        </Field>
        <Field label="Ad code (AdSense or sponsor HTML)" hint={canCode ? 'Runs inside a sandboxed frame — it cannot cover questions or read the page.' : 'Only the owner account can change ad code.'} className="sm:col-span-2 lg:col-span-4">
          <Textarea rows={4} className="font-mono text-xs" value={form.code} onChange={(e) => set({ code: e.target.value })} disabled={!canCode} />
        </Field>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => confirm({ title: `Delete “${slot.name}”?`, destructive: true, confirmLabel: 'Delete', onConfirm: () => remove.mutateAsync({ id: slot._id }) })}>
          <Trash2 className="text-destructive" /> Delete
        </Button>
        <Button size="sm" disabled={!dirty || save.isPending} onClick={() => save.mutate({ id: slot._id, data: canCode ? form : { ...form, code: slot.code } }, { onSuccess: () => toast.success('Ad space saved') })}>
          {save.isPending ? <Loader2 className="animate-spin" /> : <Save />} Save
        </Button>
      </div>
    </li>
  );
}

export function AdsPage() {
  const settings = useSiteSettingsForm();
  const slots = useResourceList('ad-slots', { limit: 50 });
  const { save } = useResourceMutations('ad-slots');
  return (
    <div>
      <PageHeader
        title="Ad Spaces"
        description="Reserved places for Google AdSense or educational sponsors. Nothing is shown until ads are switched on and a space is enabled."
        actions={
          <Button size="lg" variant="outline" onClick={() => save.mutate({ data: { name: 'New ad space', placement: 'afterContent' } }, { onSuccess: () => toast.success('Ad space added (disabled)') })}>
            <Plus /> Add ad space
          </Button>
        }
      />
      <div className="space-y-5">
        <SettingsGate settings={settings}>
          {() => (
            <Panel title="Advertising">
              <SwitchField
                label="Show advertisements on the website"
                hint="Before enabling AdSense, publish a Privacy Policy that mentions cookies and set up a consent banner if required."
                checked={settings.form.ads?.enabled}
                onChange={(enabled) => settings.patch('ads', { enabled })}
              />
              <SaveBar dirty={settings.dirty} saving={settings.saving} onSave={() => settings.save(['ads'])} />
            </Panel>
          )}
        </SettingsGate>
        {slots.isPending ? (
          <Skeleton className="h-60 rounded-2xl" />
        ) : (
          <ul className="space-y-4">
            {(slots.data?.items || []).map((slot) => (
              <AdSlotCard key={`${slot._id}-${slot.updatedAt}`} slot={slot} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const RELATED_TYPES = [
  { value: 'Chapter', label: 'अध्याय (Chapter)', resource: 'chapters' },
  { value: 'Exercise', label: 'प्रश्नावली (Exercise)', resource: 'exercises' },
  { value: 'Question', label: 'Question', resource: 'questions' },
  { value: 'Note', label: 'Note', resource: 'notes' },
  { value: 'ImportantQuestion', label: 'Important question', resource: 'important-questions' },
  { value: 'Page', label: 'Page', resource: 'pages' },
];
const resourceOf = (type) => RELATED_TYPES.find((t) => t.value === type)?.resource;

function RelatedEditor({ sourceType, source }) {
  const queryClient = useQueryClient();
  const existing = useQuery({
    queryKey: ['admin', 'related-content', 'for', sourceType, source],
    queryFn: () => get('/related-content', { scope: 'admin', sourceType, source }),
  });
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (!existing.data) return;
    const doc = existing.data.items[0];
    setForm(doc ? { ...doc, source, items: withKeys(doc.items) } : { sourceType, source, items: [], autoFill: true, limit: 6, isVisible: true });
  }, [existing.data, sourceType, source]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = normalizeRefs({ ...form, source });
      delete payload._id;
      return (form._id ? api.put(`/related-content/${form._id}`, payload) : api.post('/related-content', payload)).then((r) => r.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'related-content'] });
      toast.success('Related content saved');
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  if (!form) return <Skeleton className="h-40 rounded-2xl" />;
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  return (
    <Panel
      title="Related links for this item"
      description="Manual links appear first. With “Auto-fill” on, the remaining slots are filled from the same class, अध्याय, प्रश्नावली and tags."
      actions={
        <Button size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 className="animate-spin" /> : <Save />} Save
        </Button>
      }
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <SwitchField label="Auto-fill" checked={form.autoFill} onChange={(autoFill) => set({ autoFill })} />
        <SwitchField label="Show related section" checked={form.isVisible} onChange={(isVisible) => set({ isVisible })} />
        <NumberField label="Maximum links" value={form.limit} onChange={(limit) => set({ limit })} min={1} max={24} />
      </div>
      <ListEditor
        label="Manual links"
        value={form.items}
        onChange={(items) => set({ items })}
        addLabel="Add link"
        createItem={() => ({ targetType: 'Exercise', target: null, url: '', label: {} })}
        renderFields={(item, setItem) => (
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField label="Link to" value={item.targetType} onChange={(targetType) => setItem({ targetType, target: null })} options={[...RELATED_TYPES, { value: 'Url', label: 'Custom URL' }]} />
            {item.targetType === 'Url' ? (
              <TextField label="URL" value={item.url} onChange={(url) => setItem({ url })} />
            ) : (
              <RefSelect key={item.targetType} label="Item" resource={resourceOf(item.targetType)} value={item.target} onChange={(target) => setItem({ target })} />
            )}
            <L10nField className="sm:col-span-2" label="Custom label (optional)" value={item.label} onChange={(label) => setItem({ label })} />
          </div>
        )}
      />
    </Panel>
  );
}

export function RelatedContentPage() {
  const [sourceType, setSourceType] = useState('Exercise');
  const [source, setSource] = useState(null);
  const configured = useResourceList('related-content', { limit: 100 });
  return (
    <div>
      <PageHeader title="Related Content" description="Choose any अध्याय, प्रश्नावली, question, note or page and control the related links shown below it." />
      <div className="grid items-start gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <Panel title="Choose content">
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectField
                label="Content type"
                value={sourceType}
                onChange={(v) => {
                  setSourceType(v);
                  setSource(null);
                }}
                options={RELATED_TYPES}
              />
              <RefSelect key={sourceType} label="Item" resource={resourceOf(sourceType)} value={source} onChange={setSource} />
            </div>
          </Panel>
          {source && <RelatedEditor key={`${sourceType}-${source._id}`} sourceType={sourceType} source={source._id} />}
        </div>
        <Panel title="Items with manual links">
          {configured.data?.items?.length ? (
            <ul className="space-y-1 text-sm">
              {configured.data.items.map((row) => (
                <li key={row._id}>
                  <button
                    type="button"
                    className="w-full rounded-lg px-2 py-1.5 text-left hover:bg-muted"
                    onClick={() => {
                      setSourceType(row.sourceType);
                      setSource(row.source);
                    }}
                  >
                    <span className="text-muted-foreground">{row.sourceType}:</span> {row.source?.title?.en || row.source?.title?.hi || (row.source?.number ? `#${row.source.number}` : row.source?.slug || 'item')}
                    <span className="block text-xs text-muted-foreground">{row.items.length} manual link(s)</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">None yet — related links are generated automatically.</p>
          )}
        </Panel>
      </div>
    </div>
  );
}
