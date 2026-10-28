import Image from '@tiptap/extension-image';

export function validImageUrl(value) {
  const src = String(value || '').trim();
  if (/^\/(?!\/)[^\s\\]*$/.test(src)) return src;
  try {
    const url = new URL(src);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : '';
  } catch { return ''; }
}

export function imageWidth(value) {
  const match = String(value || '').match(/^(\d+)(%|px)$/);
  if (!match) return '100%';
  const limit = match[2] === '%' ? 100 : 4096;
  return `${Math.min(limit, Math.max(1, Number(match[1])))}${match[2]}`;
}

export const ContentImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent(),
      caption: { default: '', parseHTML: (el) => el.closest('figure')?.querySelector('figcaption')?.textContent || '' },
      align: { default: 'center', parseHTML: (el) => el.closest('figure')?.getAttribute('data-align') || 'center' },
      contentWidth: { default: '100%', parseHTML: (el) => imageWidth(el.closest('figure')?.style.width || (el.getAttribute('width') ? `${el.getAttribute('width')}px` : '100%')) },
    };
  },
  parseHTML() {
    return [
      { tag: 'figure[data-image]', getAttrs: (el) => {
        const img = el.querySelector('img');
        if (!img || !validImageUrl(img.getAttribute('src'))) return false;
        return { src: img.getAttribute('src'), alt: img.getAttribute('alt') || '', title: img.getAttribute('title') || null,
          caption: el.querySelector('figcaption')?.textContent || '', align: el.getAttribute('data-align') || 'center', contentWidth: imageWidth(el.style.width) };
      } },
      { tag: 'img[src]', getAttrs: (el) => validImageUrl(el.getAttribute('src')) ? null : false },
    ];
  },
  renderHTML({ node }) {
    const { src, alt, title, caption, align, contentWidth } = node.attrs;
    const attrs = { 'data-image': '', 'data-align': ['left', 'center', 'right'].includes(align) ? align : 'center', style: `width: ${imageWidth(contentWidth)}` };
    const image = ['img', { src: validImageUrl(src), alt: alt || '', ...(title ? { title } : {}) }];
    return caption ? ['figure', attrs, image, ['figcaption', {}, String(caption)]] : ['figure', attrs, image];
  },
}).configure({ inline: false, allowBase64: false });
