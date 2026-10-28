import { Node } from '@tiptap/core';
import katex from 'katex';
import { normalizeMath } from '../../../components/content/mathContent.js';

export function mathContent(latex, display = false) {
  return { type: 'math', attrs: normalizeMath(latex, display) };
}

export const MathNode = Node.create({
  name: 'math',
  group: 'inline',
  inline: true,
  atom: true,
  addAttributes() {
    return {
      latex: { default: '', parseHTML: (el) => normalizeMath(el.getAttribute('data-latex')).latex },
      display: { default: false, parseHTML: (el) => normalizeMath(el.getAttribute('data-latex'), el.classList.contains('math-display')).display },
    };
  },
  parseHTML() { return [{ tag: 'span[data-latex]' }, { tag: 'div[data-latex]' }]; },
  renderHTML({ node }) {
    return ['span', { class: node.attrs.display ? 'math-display' : 'math-inline', 'data-type': 'math', 'data-latex': node.attrs.latex }];
  },
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('span');
      dom.className = node.attrs.display ? 'math-display' : 'math-inline';
      dom.contentEditable = 'false';
      try {
        katex.render(node.attrs.latex, dom, { displayMode: node.attrs.display, throwOnError: true, trust: false });
      } catch {
        dom.textContent = 'Invalid formula — select and edit';
      }
      return { dom };
    };
  },
});
