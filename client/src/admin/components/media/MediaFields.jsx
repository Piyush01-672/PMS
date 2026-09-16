import { ArrowDown, ArrowUp, ImagePlus, Replace, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { imageUrl } from '@/lib/media';
import { cn } from '@/lib/utils';
import { Field, L10nField, SelectField } from '../fields/Fields.jsx';
import { DragHandle, SortableList, clientKey, itemKey, moveItem } from '../SortableList.jsx';
import { MediaPicker } from './MediaPicker.jsx';

function Thumb({ media, className }) {
  if (!media?.url) return <span className={cn('grid place-items-center rounded-lg bg-muted text-[10px] text-muted-foreground', className)}>No preview</span>;
  return (
    <span className={cn('flex items-center justify-center overflow-hidden rounded-lg border bg-white p-1', className)}>
      <img src={imageUrl(media, 240)} alt="" className="max-h-full max-w-full object-contain" />
    </span>
  );
}

/** Single image reference (logo, thumbnail, OG image…). */
export function MediaField({ label, hint, value, onChange, kind, className }) {
  const [open, setOpen] = useState(false);
  const media = value && typeof value === 'object' ? value : null;
  return (
    <Field label={label} hint={hint} className={className}>
      <div className="flex items-center gap-3 rounded-xl border bg-background p-2">
        <Thumb media={media} className="size-16 shrink-0" />
        <div className="min-w-0 flex-1 text-sm">
          {media ? (
            <>
              <p className="truncate font-medium">{media.title || media.originalName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {media.width && media.height ? `${media.width}×${media.height} · ` : ''}
                {media.alt?.en || media.alt?.hi || 'No alt text'}
              </p>
            </>
          ) : value ? (
            <p className="text-xs text-muted-foreground">Selected image</p>
          ) : (
            <p className="text-xs text-muted-foreground">No image selected</p>
          )}
        </div>
        <div className="flex gap-1">
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
            {value ? <Replace /> : <ImagePlus />} {value ? 'Change' : 'Choose'}
          </Button>
          {value && (
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => onChange(null)} aria-label="Remove image">
              <Trash2 />
            </Button>
          )}
        </div>
      </div>
      <MediaPicker open={open} onOpenChange={setOpen} kind={kind} onSelect={(m) => onChange(m)} />
    </Field>
  );
}

/**
 * Unlimited images for a question / note / solution block, each with its own type, caption and alt text.
 * showKind: attachments (question figure/diagram/graph/construction); showPlacement: question vs solution.
 */
export function MediaListField({ label, hint, value = [], onChange, showKind = false, showPlacement = false, kind }) {
  const [open, setOpen] = useState(false);
  const items = value.map((item) => (itemKey(item) ? item : { ...item, _key: clientKey() }));
  const update = (index, patch) => onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  return (
    <Field label={label} hint={hint}>
      {items.length > 0 && (
        <SortableList
          items={items}
          onChange={onChange}
          className="space-y-2"
          renderItem={(item, index, { ref, style, handleProps }) => (
            <li ref={ref} style={style} className="rounded-xl border bg-background p-2">
              <div className="flex gap-2">
                <DragHandle {...handleProps} />
                <Thumb media={item.media} className="size-20 shrink-0" />
                <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                  {showKind && (
                    <SelectField
                      label="Type"
                      value={item.kind || 'image'}
                      onChange={(v) => update(index, { kind: v })}
                      options={[
                        { value: 'image', label: 'Image' },
                        { value: 'figure', label: 'Figure' },
                        { value: 'diagram', label: 'Diagram' },
                        { value: 'graph', label: 'Graph' },
                        { value: 'construction', label: 'Construction' },
                      ]}
                    />
                  )}
                  {showPlacement && (
                    <SelectField
                      label="Show with"
                      value={item.placement || 'question'}
                      onChange={(v) => update(index, { placement: v })}
                      options={[
                        { value: 'question', label: 'Question (below question text)' },
                        { value: 'solution', label: 'Solution (below solution steps)' },
                      ]}
                    />
                  )}
                  <L10nField label="Caption" value={item.caption} onChange={(caption) => update(index, { caption })} />
                  <L10nField label="Alt text" value={item.alt} onChange={(alt) => update(index, { alt })} />
                </div>
                <div className="flex flex-col gap-1">
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => onChange(moveItem(items, index, index - 1))} aria-label="Move up" disabled={index === 0}>
                    <ArrowUp />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => onChange(moveItem(items, index, index + 1))} aria-label="Move down" disabled={index === items.length - 1}>
                    <ArrowDown />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => onChange(items.filter((_, i) => i !== index))} aria-label="Remove image">
                    <Trash2 className="text-destructive" />
                  </Button>
                </div>
              </div>
            </li>
          )}
        />
      )}
      <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setOpen(true)}>
        <ImagePlus /> Add images
      </Button>
      <MediaPicker
        open={open}
        onOpenChange={setOpen}
        multiple
        kind={kind}
        onSelect={(list) =>
          onChange([
            ...items,
            ...list.map((media) => ({ _key: clientKey(), media, kind: ['figure', 'diagram', 'graph', 'construction'].includes(media.kind) ? media.kind : 'image', caption: media.caption || {}, alt: media.alt || {}, placement: 'question' })),
          ])
        }
      />
    </Field>
  );
}
