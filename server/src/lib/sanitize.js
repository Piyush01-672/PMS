import sanitizeHtml from 'sanitize-html';

const TEXT_ALIGN = [/^(left|right|center|justify)$/];

// Rich text produced by the admin editor (TipTap). Math is stored as $...$ / $$...$$ text
// or as <span data-latex="..."> nodes and rendered with KaTeX on the client.
const RICH_OPTIONS = {
  allowedTags: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'mark', 'sub', 'sup', 'code', 'pre',
    'blockquote', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'a', 'hr', 'span', 'div',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'colgroup', 'col',
    'img', 'figure', 'figcaption',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel', 'title'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    span: ['class', 'data-latex', 'data-type'],
    div: ['class', 'data-latex', 'data-type'],
    mark: ['data-color'],
    th: ['colspan', 'rowspan', 'colwidth', 'style'],
    td: ['colspan', 'rowspan', 'colwidth', 'style'],
    col: ['style', 'span'],
    ol: ['start', 'type'],
    p: ['style'],
    h2: ['style'],
    h3: ['style'],
    h4: ['style'],
    code: ['class'],
  },
  allowedClasses: {
    span: ['math-inline', 'math-display', 'hi', 'en'],
    div: ['math-display', 'callout', 'callout-note', 'callout-warning'],
    code: ['language-latex', 'language-text'],
  },
  allowedStyles: {
    '*': { 'text-align': TEXT_ALIGN },
    col: { width: [/^\d+(px|%)$/], 'min-width': [/^\d+(px|%)$/] },
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['http', 'https'] },
  allowProtocolRelative: false,
  transformTags: {
    a: (tagName, attribs) => {
      const attrs = { ...attribs };
      if (attrs.target === '_blank') attrs.rel = 'noopener noreferrer';
      else delete attrs.target;
      return { tagName, attribs: attrs };
    },
    b: 'strong',
    i: 'em',
  },
};

export function sanitizeRichText(value) {
  if (value == null) return '';
  const html = sanitizeHtml(String(value), RICH_OPTIONS).trim();
  return html === '<p></p>' ? '' : html;
}

const ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' };

export function stripHtml(value) {
  if (!value) return '';
  return sanitizeHtml(String(value).replace(/<\/(p|div|li|h\d|tr|br)>/gi, ' $&'), {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (m) => ENTITIES[m])
    .replace(/\s+/g, ' ')
    .trim();
}

// Plain single-line text fields: remove any markup.
export function sanitizePlain(value) {
  if (value == null) return '';
  return stripHtml(value);
}

const SVG_TAGS = [
  'svg', 'g', 'path', 'line', 'polyline', 'polygon', 'rect', 'circle', 'ellipse', 'text', 'tspan',
  'defs', 'pattern', 'marker', 'linearGradient', 'radialGradient', 'stop', 'clipPath', 'title', 'desc',
];
const SVG_ATTRS = [
  'xmlns', 'viewBox', 'width', 'height', 'x', 'y', 'x1', 'x2', 'y1', 'y2', 'cx', 'cy', 'r', 'rx', 'ry',
  'd', 'points', 'fill', 'fill-opacity', 'fill-rule', 'stroke', 'stroke-width', 'stroke-dasharray',
  'stroke-linecap', 'stroke-linejoin', 'stroke-opacity', 'opacity', 'transform', 'font-family',
  'font-size', 'font-weight', 'font-style', 'text-anchor', 'dominant-baseline', 'id', 'class',
  'preserveAspectRatio', 'marker-end', 'marker-start', 'markerWidth', 'markerHeight', 'refX', 'refY',
  'orient', 'patternUnits', 'offset', 'stop-color', 'stop-opacity', 'gradientUnits', 'clip-path',
  'dx', 'dy', 'letter-spacing', 'role', 'aria-label', 'version',
];

// SVG uploads: keep drawing primitives only (no scripts, event handlers, foreignObject, external refs).
export function sanitizeSvg(buffer) {
  const clean = sanitizeHtml(buffer.toString('utf8'), {
    allowedTags: SVG_TAGS,
    allowedAttributes: { '*': SVG_ATTRS },
    allowedSchemes: [],
    parser: { lowerCaseTags: false, lowerCaseAttributeNames: false, xmlMode: true },
    selfClosing: ['path', 'line', 'polyline', 'polygon', 'rect', 'circle', 'ellipse', 'stop'],
    exclusiveFilter: (frame) =>
      Object.values(frame.attribs || {}).some((v) => /url\(\s*['"]?\s*(?!#)/i.test(String(v))),
  });
  if (!/<svg[\s>]/.test(clean)) return null;
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>\n${clean}`, 'utf8');
}
