import DOMPurify from 'dompurify';

export function hasRichContent(value) {
  return Boolean(String(value || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() ||
    /<img\b|<table\b|<(?:span|div)\b[^>]*\bdata-latex\s*=/i.test(value || ''));
}

export function normalizeMath(latex, display = false) {
  let source = String(latex || '').trim();
  for (const [left, right, block] of [['$$', '$$', true], ['\\[', '\\]', true], ['\\(', '\\)', false], ['$', '$', false]]) {
    if (source.startsWith(left) && source.endsWith(right) && source.length >= left.length + right.length) {
      source = source.slice(left.length, -right.length).trim();
      display ||= block;
      break;
    }
  }
  // Older dialog code greedily stripped $$...$$ and left one closing $ in
  // data-latex. This function is only called for explicitly identified math.
  if (/\\[a-zA-Z]+/.test(source) && /(?<!\\)\$$/.test(source) &&
      (source.match(/(?<!\\)\$/g) || []).length === 1) {
    source = source.slice(0, -1).trimEnd();
  }
  return { latex: source, display };
}

// Only recover empty formula placeholders from text. Never decode arbitrary HTML.
export function prepareRichHtml(value) {
  const root = document.createElement('div');
  root.innerHTML = DOMPurify.sanitize(String(value || ''));
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const texts = [];
  while (walker.nextNode()) texts.push(walker.currentNode);
  for (const text of texts) {
    if (text.parentElement.closest('pre, code, [data-latex]')) continue;
    const pattern = /<(span|div)\b([^<>]*)>\s*<\/\1\s*>/gi;
    const fragment = document.createDocumentFragment();
    let end = 0;
    for (const match of text.data.matchAll(pattern)) {
      const parsed = new DOMParser().parseFromString(match[0], 'text/html').body.firstElementChild;
      if (!parsed || !parsed.hasAttribute('data-latex') || parsed.getAttribute('data-type') !== 'math' ||
          !['math-inline', 'math-display'].some((cls) => parsed.classList.contains(cls)) ||
          [...parsed.attributes].some((attr) => !['class', 'data-latex', 'data-type'].includes(attr.name))) continue;
      fragment.append(document.createTextNode(text.data.slice(end, match.index)));
      const node = document.createElement('span');
      node.className = parsed.classList.contains('math-display') ? 'math-display' : 'math-inline';
      node.dataset.type = 'math';
      node.dataset.latex = parsed.getAttribute('data-latex');
      fragment.append(node);
      end = match.index + match[0].length;
    }
    if (end) {
      fragment.append(document.createTextNode(text.data.slice(end)));
      text.replaceWith(fragment);
    }
  }
  return root.innerHTML;
}
