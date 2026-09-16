import { lazy, Suspense, useState } from 'react';
import { cn } from '@/lib/utils';
import { Field } from './Fields.jsx';

const RichTextEditor = lazy(() => import('./RichTextEditor.jsx'));

const TABS = [
  { key: 'hi', label: 'हिंदी' },
  { key: 'en', label: 'English' },
  { key: 'mixed', label: 'Mixed' },
];

const filled = (html) => Boolean(String(html || '').replace(/<[^>]+>/g, '').trim() || /<img|<table/.test(html || ''));

/** Rich text in हिंदी / English / Mixed. Each tab keeps its own editor so nothing is auto-translated. */
export function RichL10nField({ label, hint, error, required, value, onChange, modes = ['hi', 'en', 'mixed'], minimal, placeholder, className }) {
  const tabs = TABS.filter((t) => modes.includes(t.key));
  const current = value || {};
  const [active, setActive] = useState(() => tabs.find((t) => filled(current[t.key]))?.key || tabs[0].key);

  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={className}
      aside={
        tabs.length > 1 && (
          <div className="flex rounded-lg bg-muted p-0.5" role="tablist" aria-label={`${label || 'Content'} language`}>
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
                {filled(current[tab.key]) && <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-success" aria-hidden="true" />}
              </button>
            ))}
          </div>
        )
      }
    >
      <Suspense fallback={<div className="min-h-28 animate-pulse rounded-lg border bg-muted/40" />}>
        <RichTextEditor
          key={active}
          value={current[active] || ''}
          onChange={(html) => onChange({ ...current, [active]: html })}
          minimal={minimal}
          placeholder={placeholder}
          ariaLabel={`${label || 'Content'} (${active})`}
          lang={active === 'en' ? 'en' : 'hi'}
        />
      </Suspense>
    </Field>
  );
}
