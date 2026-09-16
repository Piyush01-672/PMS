import { Lock, Unlock, X } from 'lucide-react';
import { useId, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ICON_NAMES, Icon } from '@/lib/icons';
import { cn } from '@/lib/utils';

export function Field({ label, hint, error, required, htmlFor, children, className, aside }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {(label || aside) && (
        <div className="flex items-center justify-between gap-2">
          {label && (
            <Label htmlFor={htmlFor} className="text-[13px] font-semibold">
              {label}
              {required && (
                <span className="text-destructive" aria-hidden="true">
                  {' '}
                  *
                </span>
              )}
            </Label>
          )}
          {aside}
        </div>
      )}
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p className="text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextField({ label, hint, error, required, value, onChange, className, inputClassName, ...props }) {
  const id = useId();
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={id} className={className}>
      <Input id={id} value={value ?? ''} onChange={(e) => onChange(e.target.value)} aria-invalid={Boolean(error)} className={cn('h-9', inputClassName)} {...props} />
    </Field>
  );
}

export function TextareaField({ label, hint, error, required, value, onChange, className, rows = 3, ...props }) {
  const id = useId();
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={id} className={className}>
      <Textarea id={id} rows={rows} value={value ?? ''} onChange={(e) => onChange(e.target.value)} aria-invalid={Boolean(error)} {...props} />
    </Field>
  );
}

export function NumberField({ label, hint, error, required, value, onChange, className, ...props }) {
  const id = useId();
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={id} className={className}>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
        aria-invalid={Boolean(error)}
        className="h-9"
        {...props}
      />
    </Field>
  );
}

export function SwitchField({ label, hint, checked, onChange, className }) {
  const id = useId();
  return (
    <div className={cn('flex items-start justify-between gap-4 rounded-xl border bg-background px-3 py-2.5', className)}>
      <div>
        <Label htmlFor={id} className="text-[13px] font-semibold">
          {label}
        </Label>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <Switch id={id} checked={Boolean(checked)} onCheckedChange={onChange} />
    </div>
  );
}

export function SelectField({ label, hint, error, required, value, onChange, options, placeholder = 'Select…', className, allowEmpty = false }) {
  const id = useId();
  const EMPTY = '__empty__';
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={id} className={className}>
      <Select value={value === undefined || value === null || value === '' ? (allowEmpty ? EMPTY : undefined) : String(value)} onValueChange={(v) => onChange(v === EMPTY ? '' : v)}>
        <SelectTrigger id={id} className="h-9 w-full" aria-invalid={Boolean(error)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {allowEmpty && <SelectItem value={EMPTY}>— None —</SelectItem>}
          {options.map((option) => (
            <SelectItem key={String(option.value)} value={String(option.value)}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

const LANG_TABS = [
  { key: 'hi', label: 'हिंदी' },
  { key: 'en', label: 'English' },
  { key: 'mixed', label: 'Mixed' },
];

/** Localized value editor with हिंदी / English / Mixed tabs. */
export function L10nField({ label, hint, error, required, value, onChange, multiline = false, rows = 3, modes = ['hi', 'en'], placeholder, className }) {
  const id = useId();
  const tabs = LANG_TABS.filter((t) => modes.includes(t.key));
  const [active, setActive] = useState(tabs[0].key);
  const current = value || {};
  const set = (text) => onChange({ ...current, [active]: text });
  const filled = (key) => Boolean(String(current[key] || '').trim());
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      htmlFor={`${id}-${active}`}
      className={className}
      aside={
        <div className="flex rounded-lg bg-muted p-0.5" role="tablist" aria-label={`${label} language`}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active === tab.key}
              onClick={() => setActive(tab.key)}
              className={cn('relative rounded-md px-2 py-0.5 text-[11px] font-bold', active === tab.key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground')}
            >
              {tab.label}
              {filled(tab.key) && <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-success" aria-hidden="true" />}
            </button>
          ))}
        </div>
      }
    >
      {multiline ? (
        <Textarea id={`${id}-${active}`} rows={rows} value={current[active] || ''} onChange={(e) => set(e.target.value)} placeholder={placeholder} lang={active === 'hi' ? 'hi' : 'en'} />
      ) : (
        <Input id={`${id}-${active}`} className="h-9" value={current[active] || ''} onChange={(e) => set(e.target.value)} placeholder={placeholder} lang={active === 'hi' ? 'hi' : 'en'} />
      )}
    </Field>
  );
}

export function slugifyClient(input) {
  return String(input || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\./g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

export function SlugField({ label = 'URL slug', value, onChange, suggestion, prefix, hint, error }) {
  const id = useId();
  const [locked, setLocked] = useState(Boolean(value));
  const effective = locked ? value : slugifyClient(suggestion) || value;
  return (
    <Field label={label} hint={hint || 'Lowercase English letters, numbers and hyphens (SEO-friendly).'} error={error} htmlFor={id}>
      <div className="flex items-center gap-2">
        {prefix && <span className="hidden max-w-[45%] truncate text-xs text-muted-foreground sm:inline">{prefix}</span>}
        <Input
          id={id}
          className="h-9 font-mono text-sm"
          value={effective || ''}
          onChange={(e) => {
            setLocked(true);
            onChange(slugifyClient(e.target.value));
          }}
          onBlur={() => !locked && effective !== value && onChange(effective)}
        />
        <button
          type="button"
          onClick={() => {
            if (locked) onChange(slugifyClient(suggestion));
            setLocked(!locked);
          }}
          className="grid size-9 shrink-0 place-items-center rounded-lg border text-muted-foreground hover:text-foreground"
          title={locked ? 'Auto-generate from title' : 'Edit slug manually'}
          aria-label={locked ? 'Auto-generate slug' : 'Edit slug manually'}
        >
          {locked ? <Lock className="size-4" /> : <Unlock className="size-4" />}
        </button>
      </div>
    </Field>
  );
}

export function LanguageModeField({ value, onChange, label = 'Language mode' }) {
  return (
    <SelectField
      label={label}
      hint="Auto follows the हिंदी/ENG switch. Mixed keeps Hindi-English terminology exactly as typed."
      value={value || 'auto'}
      onChange={onChange}
      options={[
        { value: 'auto', label: 'Auto (Hindi + English)' },
        { value: 'hi', label: 'Hindi only' },
        { value: 'en', label: 'English only' },
        { value: 'mixed', label: 'Mixed Hindi-English' },
      ]}
    />
  );
}

export function TagsField({ label = 'Tags', value = [], onChange, hint = 'Press Enter or comma to add.' }) {
  const id = useId();
  const [draft, setDraft] = useState('');
  const add = () => {
    const tags = draft
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    if (tags.length) onChange([...new Set([...(value || []), ...tags])]);
    setDraft('');
  };
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-lg border bg-background px-2 py-1.5 focus-within:ring-3 focus-within:ring-ring/30">
        {(value || []).map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
            {tag}
            <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))} aria-label={`Remove ${tag}`}>
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              add();
            } else if (e.key === 'Backspace' && !draft && value?.length) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={add}
          className="min-w-24 flex-1 bg-transparent text-sm outline-none"
        />
      </div>
    </Field>
  );
}

const toLocalInput = (value) => {
  if (!value) return '';
  const d = new Date(value);
  const offset = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
};

export function DateTimeField({ label, hint, value, onChange }) {
  const id = useId();
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <Input id={id} type="datetime-local" className="h-9" value={toLocalInput(value)} onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)} />
    </Field>
  );
}

export function ColorField({ label, value, onChange, hint }) {
  const id = useId();
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <div className="flex items-center gap-2">
        <input type="color" value={value || '#000000'} onChange={(e) => onChange(e.target.value)} className="h-9 w-12 cursor-pointer rounded-md border bg-background p-1" aria-label={label} />
        <Input id={id} className="h-9 font-mono" value={value || ''} onChange={(e) => onChange(e.target.value)} maxLength={7} />
      </div>
    </Field>
  );
}

export function IconField({ label = 'Icon', value, onChange }) {
  return (
    <Field label={label}>
      <div className="flex max-h-32 flex-wrap gap-1 overflow-y-auto rounded-lg border bg-background p-1.5">
        {ICON_NAMES.map((name) => (
          <button
            key={name}
            type="button"
            title={name}
            aria-label={name}
            aria-pressed={value === name}
            onClick={() => onChange(value === name ? '' : name)}
            className={cn('grid size-8 place-items-center rounded-md', value === name ? 'bg-brand text-white' : 'hover:bg-muted')}
          >
            <Icon name={name} className="size-4" />
          </button>
        ))}
      </div>
    </Field>
  );
}
