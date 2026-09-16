import DOMPurify from 'dompurify';
import katex from 'katex';
import renderMathInElement from 'katex/contrib/auto-render';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';

const PURIFY_CONFIG = {
  ADD_ATTR: ['target', 'data-latex', 'data-type', 'colwidth'],
  FORBID_TAGS: ['style', 'script', 'iframe', 'form', 'input', 'object', 'embed'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick'],
};

const DELIMITERS = [
  { left: '$$', right: '$$', display: true },
  { left: '\\[', right: '\\]', display: true },
  { left: '$', right: '$', display: false },
  { left: '\\(', right: '\\)', display: false },
];

export const KATEX_OPTIONS = { throwOnError: false, strict: 'ignore', trust: false, output: 'htmlAndMathml' };

/** Sanitized CMS HTML with KaTeX math ($…$, $$…$$ and <span data-latex>). */
export function RichContent({ html, className, as: Tag = 'div', ...props }) {
  const ref = useRef(null);
  const clean = useMemo(() => DOMPurify.sanitize(String(html || ''), PURIFY_CONFIG), [html]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = clean;
    el.querySelectorAll('table').forEach((table) => {
      if (table.parentElement?.classList.contains('table-scroll')) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'table-scroll';
      table.replaceWith(wrapper);
      wrapper.appendChild(table);
    });
    el.querySelectorAll('[data-latex]').forEach((node) => {
      try {
        katex.render(node.getAttribute('data-latex') || '', node, { ...KATEX_OPTIONS, displayMode: node.classList.contains('math-display') });
      } catch {
        /* leave source visible */
      }
    });
    renderMathInElement(el, { ...KATEX_OPTIONS, delimiters: DELIMITERS, ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'] });
    el.querySelectorAll('img').forEach((img) => {
      img.loading = 'lazy';
      img.decoding = 'async';
    });
    el.querySelectorAll('a[href^="http"]').forEach((a) => {
      if (!a.href.startsWith(window.location.origin)) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      }
    });
  }, [clean]);

  return <Tag ref={ref} className={cn('rich', className)} {...props} />;
}
