import katex from 'katex';
import { Check, Copy } from 'lucide-react';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { KATEX_OPTIONS } from './RichContent.jsx';

export function MathFormula({ latex, display = true, className }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(latex || '', { ...KATEX_OPTIONS, displayMode: display });
    } catch {
      return null;
    }
  }, [latex, display]);

  if (!latex) return null;
  if (!html) return <code className="font-mono text-sm">{latex}</code>;
  return (
    <div
      className={cn(display ? 'math-scroll py-1 text-center' : 'inline', className)}
      role="math"
      aria-label={latex}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function CopyLatexButton({ latex, className }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(latex);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      className={cn('inline-flex items-center gap-1 rounded-md border bg-background px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground', className)}
      aria-label="Copy LaTeX"
    >
      {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />} LaTeX
    </button>
  );
}
