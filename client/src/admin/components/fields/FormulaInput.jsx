import katex from 'katex';
import { useId, useMemo, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { MathFormula } from '@/components/content/MathFormula.jsx';
import { Field } from './Fields.jsx';

export const LATEX_SNIPPETS = [
  { label: 'a/b', latex: '\\frac{a}{b}', title: 'Fraction' },
  { label: '√x', latex: '\\sqrt{x}', title: 'Square root' },
  { label: 'ⁿ√x', latex: '\\sqrt[n]{x}', title: 'nth root' },
  { label: 'x²', latex: 'x^{2}', title: 'Power' },
  { label: 'xₙ', latex: 'x_{n}', title: 'Subscript' },
  { label: '∠', latex: '\\angle ', title: 'Angle' },
  { label: '°', latex: '^\\circ', title: 'Degree' },
  { label: '△', latex: '\\triangle ', title: 'Triangle' },
  { label: 'θ', latex: '\\theta', title: 'Theta' },
  { label: 'π', latex: '\\pi', title: 'Pi' },
  { label: '≤', latex: '\\le ', title: 'Less or equal' },
  { label: '≥', latex: '\\ge ', title: 'Greater or equal' },
  { label: '≠', latex: '\\ne ', title: 'Not equal' },
  { label: '±', latex: '\\pm ', title: 'Plus minus' },
  { label: '×', latex: '\\times ', title: 'Times' },
  { label: '⇒', latex: '\\Rightarrow ', title: 'Implies' },
  { label: 'sin', latex: '\\sin\\theta', title: 'Sine' },
  { label: '∫', latex: '\\int_{a}^{b} f(x)\\,dx', title: 'Integral' },
  { label: 'Σ', latex: '\\sum_{i=1}^{n} i', title: 'Summation' },
  { label: 'lim', latex: '\\lim_{x \\to 0} f(x)', title: 'Limit' },
  { label: 'd/dx', latex: '\\frac{d}{dx}', title: 'Derivative' },
  { label: 'vec', latex: '\\vec{a}', title: 'Vector' },
  { label: '[ ]', latex: '\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}', title: 'Matrix' },
  { label: '|A|', latex: '\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}', title: 'Determinant' },
  { label: '{ }', latex: '\\begin{cases} x + y = 5 \\\\ x - y = 1 \\end{cases}', title: 'System of equations' },
];

export function latexError(latex) {
  if (!latex?.trim()) return null;
  try {
    katex.renderToString(latex, { throwOnError: true, strict: 'ignore' });
    return null;
  } catch (error) {
    return error.message.replace(/^KaTeX parse error: /, '');
  }
}

/** LaTeX editor with snippet palette and live KaTeX preview. */
export function FormulaInput({ label = 'Formula (LaTeX)', value, onChange, hint, rows = 2, display = true, autoFocus }) {
  const id = useId();
  const ref = useRef(null);
  const error = useMemo(() => latexError(value), [value]);

  const insert = (snippet) => {
    const el = ref.current;
    const text = value || '';
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    const next = `${text.slice(0, start)}${snippet}${text.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + snippet.length, start + snippet.length);
    });
  };

  return (
    <Field label={label} hint={hint || 'Example: x^2 + 2x + 1 = 0 · \\frac{a}{b} · \\angle A = 60^\\circ'} error={error} htmlFor={id}>
      <div className="mb-1.5 flex flex-wrap gap-1">
        {LATEX_SNIPPETS.map((s) => (
          <button key={s.title} type="button" title={s.title} onClick={() => insert(s.latex)} className="h-7 min-w-8 rounded-md border bg-background px-1.5 text-xs font-medium hover:border-brand/40 hover:text-brand">
            {s.label}
          </button>
        ))}
      </div>
      <Textarea
        ref={ref}
        id={id}
        rows={rows}
        value={value || ''}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="font-mono text-sm"
        aria-invalid={Boolean(error)}
      />
      {value?.trim() && !error && (
        <div className="mt-2 rounded-lg border border-dashed bg-paper px-3 py-2 dark:bg-muted/40" aria-label="Formula preview">
          <MathFormula latex={value} display={display} />
        </div>
      )}
    </Field>
  );
}
