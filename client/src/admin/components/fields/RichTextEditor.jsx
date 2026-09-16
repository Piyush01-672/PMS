import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TableKit } from '@tiptap/extension-table';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Eye,
  Heading2,
  Heading3,
  Highlighter,
  ImagePlus,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo2,
  RemoveFormatting,
  Sigma,
  Strikethrough,
  Table as TableIcon,
  Underline as UnderlineIcon,
  Undo2,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { RichContent } from '@/components/content/RichContent.jsx';
import { cn } from '@/lib/utils';
import { MediaPicker } from '../media/MediaPicker.jsx';
import { FormulaInput } from './FormulaInput.jsx';

function ToolButton({ active, label, onClick, children, disabled }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn('grid size-8 place-items-center rounded-md text-foreground/70 hover:bg-muted hover:text-foreground disabled:opacity-40', active && 'bg-brand-soft text-brand')}
    >
      {children}
    </button>
  );
}

function FormulaDialog({ open, onOpenChange, onInsert }) {
  const [latex, setLatex] = useState('');
  const [display, setDisplay] = useState(false);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Insert formula</DialogTitle>
        </DialogHeader>
        <FormulaInput value={latex} onChange={setLatex} display={display} autoFocus rows={3} />
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={display} onCheckedChange={setDisplay} /> Display on its own line (centered)
        </label>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!latex.trim()}
            onClick={() => {
              onInsert(display ? `$$${latex.trim()}$$` : `$${latex.trim()}$`, display);
              setLatex('');
              onOpenChange(false);
            }}
          >
            Insert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** TipTap editor. Output is HTML (sanitized again by the server). Math is typed as $…$ / $$…$$. */
export default function RichTextEditor({ value, onChange, placeholder, minimal = false, ariaLabel, lang }) {
  const [formulaOpen, setFormulaOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [preview, setPreview] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: { openOnClick: false, autolink: true, protocols: ['https', 'mailto', 'tel'] },
      }),
      TableKit.configure({ table: { resizable: false } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight,
      Image.configure({ inline: false }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'rich',
        'aria-label': ariaLabel || 'Rich text editor',
        'data-placeholder': placeholder || '',
        ...(lang ? { lang } : {}),
      },
    },
    onUpdate: ({ editor: instance }) => onChange(instance.isEmpty ? '' : instance.getHTML()),
  });

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            bold: e.isActive('bold'),
            italic: e.isActive('italic'),
            underline: e.isActive('underline'),
            strike: e.isActive('strike'),
            highlight: e.isActive('highlight'),
            h2: e.isActive('heading', { level: 2 }),
            h3: e.isActive('heading', { level: 3 }),
            bullet: e.isActive('bulletList'),
            ordered: e.isActive('orderedList'),
            quote: e.isActive('blockquote'),
            link: e.isActive('link'),
            table: e.isActive('table'),
            left: e.isActive({ textAlign: 'left' }),
            center: e.isActive({ textAlign: 'center' }),
            right: e.isActive({ textAlign: 'right' }),
            canUndo: e.can().undo(),
            canRedo: e.can().redo(),
          }
        : {},
  });

  if (!editor) return <div className="min-h-28 rounded-lg border bg-muted/40" />;
  const chain = () => editor.chain().focus();

  const applyLink = () => {
    if (!linkUrl.trim()) chain().extendMarkRange('link').unsetLink().run();
    else chain().extendMarkRange('link').setLink({ href: linkUrl.trim() }).run();
    setLinkOpen(false);
  };

  return (
    <div className="tiptap-editor overflow-hidden rounded-lg border bg-background focus-within:ring-3 focus-within:ring-ring/30">
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/40 px-1.5 py-1" role="toolbar" aria-label="Formatting">
        <ToolButton label="Bold" active={state.bold} onClick={() => chain().toggleBold().run()}>
          <Bold className="size-4" />
        </ToolButton>
        <ToolButton label="Italic" active={state.italic} onClick={() => chain().toggleItalic().run()}>
          <Italic className="size-4" />
        </ToolButton>
        <ToolButton label="Underline" active={state.underline} onClick={() => chain().toggleUnderline().run()}>
          <UnderlineIcon className="size-4" />
        </ToolButton>
        {!minimal && (
          <>
            <ToolButton label="Strikethrough" active={state.strike} onClick={() => chain().toggleStrike().run()}>
              <Strikethrough className="size-4" />
            </ToolButton>
            <ToolButton label="Highlight" active={state.highlight} onClick={() => chain().toggleHighlight().run()}>
              <Highlighter className="size-4" />
            </ToolButton>
            <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
            <ToolButton label="Heading" active={state.h2} onClick={() => chain().toggleHeading({ level: 2 }).run()}>
              <Heading2 className="size-4" />
            </ToolButton>
            <ToolButton label="Sub-heading" active={state.h3} onClick={() => chain().toggleHeading({ level: 3 }).run()}>
              <Heading3 className="size-4" />
            </ToolButton>
          </>
        )}
        <ToolButton label="Bullet list" active={state.bullet} onClick={() => chain().toggleBulletList().run()}>
          <List className="size-4" />
        </ToolButton>
        <ToolButton label="Numbered list" active={state.ordered} onClick={() => chain().toggleOrderedList().run()}>
          <ListOrdered className="size-4" />
        </ToolButton>
        {!minimal && (
          <>
            <ToolButton label="Quote" active={state.quote} onClick={() => chain().toggleBlockquote().run()}>
              <Quote className="size-4" />
            </ToolButton>
            <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
            <ToolButton label="Align left" active={state.left} onClick={() => chain().setTextAlign('left').run()}>
              <AlignLeft className="size-4" />
            </ToolButton>
            <ToolButton label="Align center" active={state.center} onClick={() => chain().setTextAlign('center').run()}>
              <AlignCenter className="size-4" />
            </ToolButton>
            <ToolButton label="Align right" active={state.right} onClick={() => chain().setTextAlign('right').run()}>
              <AlignRight className="size-4" />
            </ToolButton>
          </>
        )}
        <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
        <ToolButton
          label="Link"
          active={state.link}
          onClick={() => {
            setLinkUrl(editor.getAttributes('link').href || '');
            setLinkOpen(true);
          }}
        >
          <LinkIcon className="size-4" />
        </ToolButton>
        <ToolButton label="Insert formula (LaTeX)" onClick={() => setFormulaOpen(true)}>
          <Sigma className="size-4" />
        </ToolButton>
        {!minimal && (
          <>
            <ToolButton label="Insert image" onClick={() => setMediaOpen(true)}>
              <ImagePlus className="size-4" />
            </ToolButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" title="Table" aria-label="Table options" className={cn('grid size-8 place-items-center rounded-md text-foreground/70 hover:bg-muted', state.table && 'bg-brand-soft text-brand')}>
                  <TableIcon className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>Insert 3 × 3 table</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled={!state.table} onSelect={() => chain().addRowAfter().run()}>Add row</DropdownMenuItem>
                <DropdownMenuItem disabled={!state.table} onSelect={() => chain().addColumnAfter().run()}>Add column</DropdownMenuItem>
                <DropdownMenuItem disabled={!state.table} onSelect={() => chain().deleteRow().run()}>Delete row</DropdownMenuItem>
                <DropdownMenuItem disabled={!state.table} onSelect={() => chain().deleteColumn().run()}>Delete column</DropdownMenuItem>
                <DropdownMenuItem disabled={!state.table} onSelect={() => chain().toggleHeaderRow().run()}>Toggle header row</DropdownMenuItem>
                <DropdownMenuItem disabled={!state.table} variant="destructive" onSelect={() => chain().deleteTable().run()}>
                  Delete table
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
        <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
        <ToolButton label="Clear formatting" onClick={() => chain().unsetAllMarks().clearNodes().run()}>
          <RemoveFormatting className="size-4" />
        </ToolButton>
        <ToolButton label="Undo" disabled={!state.canUndo} onClick={() => chain().undo().run()}>
          <Undo2 className="size-4" />
        </ToolButton>
        <ToolButton label="Redo" disabled={!state.canRedo} onClick={() => chain().redo().run()}>
          <Redo2 className="size-4" />
        </ToolButton>
        <span className="flex-1" />
        <ToolButton label="Toggle rendered preview" active={preview} onClick={() => setPreview((v) => !v)}>
          <Eye className="size-4" />
        </ToolButton>
      </div>

      <EditorContent editor={editor} />

      {preview && (
        <div className="border-t bg-paper px-3 py-2.5 dark:bg-muted/30">
          <p className="mb-1 text-[10px] font-bold tracking-wide text-muted-foreground uppercase">Student view</p>
          <RichContent html={value} />
        </div>
      )}

      <FormulaDialog open={formulaOpen} onOpenChange={setFormulaOpen} onInsert={(text) => chain().insertContent(text).run()} />
      <MediaPicker
        open={mediaOpen}
        onOpenChange={setMediaOpen}
        onSelect={(media) => {
          const item = Array.isArray(media) ? media[0] : media;
          if (item?.url) chain().setImage({ src: item.url, alt: item.alt?.en || item.alt?.hi || item.title || '' }).run();
        }}
      />
      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link</DialogTitle>
          </DialogHeader>
          <Input autoFocus placeholder="https://… or /class-10/maths" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && applyLink()} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkOpen(false)}>
              Cancel
            </Button>
            <Button onClick={applyLink}>{linkUrl ? 'Apply link' : 'Remove link'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
