import katex from 'katex';
import renderMathInElement from 'katex/contrib/auto-render';
import { normalizeMath } from './mathContent.js';

const DELIMITERS = [
  { left: '$$', right: '$$', display: true },
  { left: '\\[', right: '\\]', display: true },
  { left: '$', right: '$', display: false },
  { left: '\\(', right: '\\)', display: false },
];

export const KATEX_OPTIONS = { throwOnError: false, strict: 'ignore', trust: false, output: 'htmlAndMathml' };

function renderStandaloneLatex(el) {
  const mathSyntax = /\\(?:frac|sqrt|sum|prod|int|lim)\b/;
  [el, ...el.querySelectorAll('p, div, span')].forEach((node) => {
    if (node.children.length || node.hasAttribute('data-latex') || node.closest('pre, code, .katex')) return;
    const latex = node.textContent?.trim();
    if (
      !latex ||
      latex.includes('$') ||
      ['\\(', '\\)', '\\[', '\\]'].some((delimiter) => latex.includes(delimiter)) ||
      !mathSyntax.test(latex)
    ) return;
    const expression = latex.replace(/\\(?:begin|end)\{[^}]+\}|\\[a-z]+/gi, ' ');
    if (/^[A-Za-z]{2,}\b/.test(latex) || /\b[A-Za-z]{3,}\b/.test(expression)) return;
    try {
      node.innerHTML = katex.renderToString(latex, { ...KATEX_OPTIONS, throwOnError: true, displayMode: true });
    } catch {
      // Keep invalid legacy source readable without interrupting the rest of the content.
    }
  });
}

export function renderMathContent(el) {
  renderStandaloneLatex(el);
  el.querySelectorAll('[data-latex]').forEach((node) => {
    try {
      const { latex, display } = normalizeMath(node.getAttribute('data-latex'), node.classList.contains('math-display'));
      katex.render(latex, node, { ...KATEX_OPTIONS, throwOnError: true, displayMode: display });
      node.removeAttribute('data-math-error');
    } catch {
      node.textContent = 'Invalid formula';
      node.setAttribute('data-math-error', 'true');
      node.setAttribute('role', 'note');
    }
  });
  renderMathInElement(el, {
    ...KATEX_OPTIONS,
    delimiters: DELIMITERS,
    ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'annotation'],
  });
}
