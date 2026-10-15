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
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { RichContent } from '@/components/content/RichContent.jsx';
import { cn } from '@/lib/utils';
import { MediaPicker } from '../media/MediaPicker.jsx';
import { FormulaInput } from './FormulaInput.jsx';

const QUICK_MATH_SNIPPETS = [
  { label: 'Fraction', value: '\\frac{a}{b}' },
  { label: 'Equation', value: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}' },
  { label: 'Square root', value: '\\sqrt{x + 1}' },
  { label: 'Exponent', value: 'x^{2}' },
  { label: 'Subscript', value: 'x_{n}' },
  { label: 'Matrix', value: '\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}' },
  { label: 'System', value: '\\begin{cases} x + y = 5 \\\\ x - y = 1 \\end{cases}' },
  { label: 'Integral', value: '\\int_{a}^{b} f(x)\\,dx' },
];

function escapeMathAttribute(value) {
  return String(value || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function mathMarkup(latex, displayMode = false) {
  const value = String(latex || '').trim();
  if (!value) return '';
  const cls = displayMode ? 'math-display' : 'math-inline';
  return `<span class="${cls}" data-latex="${escapeMathAttribute(value)}" data-type="math"></span>`;
}

function detectMathFromText(value) {
  if (!value) return null;
  const text = String(value).replace(/\u00a0/g, ' ').trim();
  if (!text) return null;
  const mathish = /(?:\\(?:frac|sqrt|sum|prod|int|lim|left|right|cdot|times|pi|theta)|[A-Za-z0-9]+\s*\/\s*[A-Za-z0-9]+|[=<>≤≥±÷×^_]|\\\[|\\\(|\$\$|\$)/;
  if (/[=<>≤≥±÷×^_]/.test(text) || /\\(?:frac|sqrt|sum|prod|int|lim)/.test(text) || /\b[A-Za-z0-9]\s*\/\s*[A-Za-z0-9]/.test(text)) {
    return text;
  }
  return null;
}

function mathMLToLatex(node) {
  if (!node) return '';
  if (node.nodeType === 3) return node.textContent || '';
  if (node.nodeType !== 1) return '';

  const tag = node.tagName?.toLowerCase?.() || '';
  const children = Array.from(node.childNodes).map(mathMLToLatex).join('');

  switch (tag) {
    case 'mfrac': {
      const [num, den] = Array.from(node.children);
      return `\\frac{${mathMLToLatex(num)}}{${mathMLToLatex(den)}}`;
    }
    case 'msqrt': return `\\sqrt{${children}}`;
    case 'mroot': {
      const [radicand, index] = Array.from(node.children);
      return `\\sqrt[${mathMLToLatex(index)}]{${mathMLToLatex(radicand)}}`;
    }
    case 'msup': {
      const [base, exp] = Array.from(node.children);
      return `${mathMLToLatex(base)}^{${mathMLToLatex(exp)}}`;
    }
    case 'msub': {
      const [base, sub] = Array.from(node.children);
      return `${mathMLToLatex(base)}_{${mathMLToLatex(sub)}}`;
    }
    case 'mtext': return node.textContent || '';
    case 'mi': return node.textContent || '';
    case 'mn': return node.textContent || '';
    case 'mo': {
      const value = node.textContent || '';
      const map = { '÷': '\\div ', '×': '\\times ', '−': '-', '–': '-', '≤': '\\le ', '≥': '\\ge ', '≠': '\\ne ', '±': '\\pm ', '∠': '\\angle ', 'π': '\\pi ', '∞': '\\infty ', '∑': '\\sum ', '∫': '\\int ' };
      return map[value] || value;
    }
    case 'mrow': return children;
    case 'math': return children;
    default: return children;
  }
}

function extractMathFromClipboard(event) {
  const data = event.clipboardData;
  if (!data) return null;

  const html = data.getData('text/html');
  if (html) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const latexNode = doc.querySelector('[data-latex]');
      if (latexNode) {
        const latex = latexNode.getAttribute('data-latex');
        if (latex) return { latex, display: latexNode.classList.contains('math-display') };
      }

      const mathNode = doc.querySelector('math');
      if (mathNode) {
        const latex = mathMLToLatex(mathNode).trim();
        if (latex) return { latex, display: true };
      }

      const text = doc.body.textContent || '';
      const latex = detectMathFromText(text);
      if (latex) return { latex, display: /\\(?:frac|sqrt|sum|prod|int|lim)|\\\[|\\\(|\$\$/.test(latex) };
    } catch {
      // ignore clipboard parse errors and fall back to plain text below
    }
  }

  const plain = data.getData('text/plain') || '';
  const latex = detectMathFromText(plain);
  if (latex) return { latex, display: false };

  return null;
}

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

function FormulaDialog({ open, onOpenChange, onInsert, defaultLatex = '', defaultDisplay = false }) {
  const [latex, setLatex] = useState(defaultLatex);
  const [display, setDisplay] = useState(defaultDisplay);

  useEffect(() => {
    if (open) {
      setLatex(defaultLatex);
      setDisplay(defaultDisplay);
    }
  }, [open, defaultLatex, defaultDisplay]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Insert formula</DialogTitle>
        </DialogHeader>

        <div className="mb-3 flex flex-wrap gap-2">
          {QUICK_MATH_SNIPPETS.map((snippet) => (
            <Button key={snippet.label} type="button" variant="outline" size="sm" onClick={() => setLatex((current) => `${current}${current ? ' ' : ''}${snippet.value}`)}>
              {snippet.label}
            </Button>
          ))}
        </div>

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
  const [formulaSeed, setFormulaSeed] = useState('');
  const [formulaDisplay, setFormulaDisplay] = useState(false);
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
    onPaste: ({ editor, event }) => {
      const math = extractMathFromClipboard(event);
      if (!math) return false;
      event.preventDefault();
      editor.commands.insertContent(mathMarkup(math.latex, math.display), { parse: false });
      return true;
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

  const openMathDialog = (seed = '', display = false) => {
    setFormulaSeed(seed);
    setFormulaDisplay(display);
    setFormulaOpen(true);
  };

  const convertSelectionToMath = () => {
    const selection = editor.state.selection;
    const latex = detectMathFromText(editor.state.doc.textBetween(selection.from, selection.to, ' '));
    if (!latex) {
      openMathDialog('', false);
      return;
    }
    editor.chain().deleteSelection().insertContent(mathMarkup(latex, false), { parse: false }).run();
  };

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
        <ToolButton label="Insert fraction" onClick={() => openMathDialog('\\frac{a}{b}', false)}>
          <Sigma className="size-4" />
        </ToolButton>
        <ToolButton label="Insert equation" onClick={() => openMathDialog('x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}', false)}>
          <Sigma className="size-4" />
        </ToolButton>
        <ToolButton label="Convert to math" onClick={convertSelectionToMath}>
          <Sigma className="size-4" />
        </ToolButton>
        <ToolButton label="Insert symbols" onClick={() => openMathDialog('\\times \\sqrt{x}', false)}>
          <Sigma className="size-4" />
        </ToolButton>
        <ToolButton label="Preview equation" onClick={() => openMathDialog(editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' '), false)}>
          <Eye className="size-4" />
        </ToolButton>
        <ToolButton label="Edit equation" onClick={() => openMathDialog(editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' '), false)}>
          <Eye className="size-4" />
        </ToolButton>
        <ToolButton label="Insert formula (LaTeX)" onClick={() => openMathDialog('', false)}>
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

      <FormulaDialog
        open={formulaOpen}
        onOpenChange={setFormulaOpen}
        defaultLatex={formulaSeed}
        defaultDisplay={formulaDisplay}
        onInsert={(text, display) => {
          const matches = String(text || '').match(/^\$\$?(.*)\$\$?$/s);
          const latex = (matches ? matches[1] : String(text || '')).trim();
          if (!latex) return;
          chain().insertContent(mathMarkup(latex, display), { parse: false }).run();
        }}
      />
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
