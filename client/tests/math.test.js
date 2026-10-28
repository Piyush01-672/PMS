import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { test } from 'node:test';
const dom = new JSDOM('<!doctype html><html><body></body></html>');
for (const key of ['window', 'document', 'DOMParser', 'NodeFilter', 'Node', 'Element', 'HTMLElement', 'MutationObserver', 'getComputedStyle']) globalThis[key] = dom.window[key];
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
const { Editor } = await import('@tiptap/core');
const { default: StarterKit } = await import('@tiptap/starter-kit');
const { MathNode, mathContent } = await import('../src/admin/components/fields/MathNode.js');
const { prepareRichHtml, normalizeMath, hasRichContent } = await import('../src/components/content/mathContent.js');
const { sanitizeRichText } = await import('../../server/src/lib/sanitize.js');
const latex = String.raw`\frac{3}{4}x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}`;
const editor = (content = '') => new Editor({ extensions: [StarterKit, MathNode], content });
test('native inline and display math survive insertion, server save and editor reopen', () => {
  for (const display of [false, true]) {
    const first = editor('<p>Before </p>');
    first.commands.insertContent(mathContent(latex, display));
    const saved = sanitizeRichText(first.getHTML());
    assert.ok(saved.includes('data-latex='));
    assert.ok(!saved.includes('&lt;span'));
    const reopened = editor(saved);
    const math = reopened.getJSON().content.flatMap(n => n.content || []).find(n => n.type === 'math');
    assert.deepEqual({ ...math.attrs }, { latex, display });
    assert.equal(sanitizeRichText(reopened.getHTML()), saved);
    first.destroy(); reopened.destroy();
  }
});
test('legacy escaped placeholders are recovered without decoding other HTML', () => {
  const source = `<p>&lt;span class="math-inline" data-latex="${latex}" data-type="math"&gt;&lt;/span&gt; &lt;img src=x onerror=alert(1)&gt;</p>`;
  const root = document.createElement('div'); root.innerHTML = prepareRichHtml(source);
  assert.equal(root.querySelector('[data-latex]').dataset.latex, latex);
  assert.equal(root.querySelector('img'), null);
  assert.ok(root.textContent.includes('<img'));
  assert.equal(prepareRichHtml(prepareRichHtml(source)), prepareRichHtml(source));
});
test('unsafe placeholder attributes and scripts never execute or become recovered HTML', () => {
  const source = '&lt;span class="math-inline" data-type="math" data-latex="x" onclick="alert(1)"&gt;&lt;/span&gt;<script>alert(1)</script>';
  const root = document.createElement('div'); root.innerHTML = prepareRichHtml(source);
  assert.equal(root.querySelector('span,script'), null);
});
test('delimiters are removed exactly once and display intent survives', () => {
  assert.deepEqual(normalizeMath(`$$${latex}$$`), { latex, display: true });
  assert.deepEqual(normalizeMath(String.raw`\[x^2\]`), { latex: 'x^2', display: true });
  assert.deepEqual(normalizeMath('$x$'), { latex: 'x', display: false });
});

test('math-only content is available to language selection and student sections', () => {
  assert.equal(hasRichContent('<p><span data-latex="x" class="math-inline"></span></p>'), true);
  assert.equal(hasRichContent('<p></p>'), false);
  assert.equal(hasRichContent('<p>&nbsp;</p>'), false);
});
test('normal formatting survives compatibility parsing and server sanitization', () => {
  const source = '<h2>Heading</h2><p>Text <a href="https://example.com">link</a></p><ul><li>Item</li></ul><table><tbody><tr><td>Cell</td></tr></tbody></table><img src="https://example.com/a.png" alt="Image">';
  const root = document.createElement('div'); root.innerHTML = sanitizeRichText(prepareRichHtml(source));
  for (const tag of ['h2', 'p', 'a', 'ul', 'li', 'table', 'td', 'img']) assert.ok(root.querySelector(tag));
});
const { renderMathContent } = await import('../src/components/content/renderMathContent.js');
function renderSaved(source) {
  const root = document.createElement('div');
  root.innerHTML = prepareRichHtml(sanitizeRichText(source));
  renderMathContent(root);
  return root;
}
test('actual Exercise 2.1 corruption renders instead of producing red KaTeX error', () => {
  const broken = String.raw`\frac{3}{4}x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$`;
  const saved = `<p>&lt;span class="math-display" data-latex="${broken}" data-type="math"&gt;&lt;/span&gt;</p><p>Exercise 2.1 - Find the principal values (NCERT Solutions)<br>Important Formulas:<br>* The range of sin⁻¹(x) is [-π/2, π/2].</p>`;
  const root = renderSaved(saved);
  assert.equal(root.querySelectorAll('.katex').length, 1);
  assert.ok(root.querySelector('.katex-display .mfrac'));
  assert.equal(root.querySelector('.katex-error'), null);
  assert.ok(root.textContent.includes('The range of sin⁻¹(x) is [-π/2, π/2].'));
  assert.equal(root.querySelector('annotation').textContent, broken.slice(0, -1));
  const reopened = editor(prepareRichHtml(saved));
  assert.ok(!reopened.getHTML().includes('{2a}$'));
  reopened.destroy();
});
test('all four delimiters and legacy inline/block nodes render without duplication', () => {
  const root = renderSaved(String.raw`<p>Inline \(x^2\), $y^2$</p><p>\[x+1\]</p><p>$$y+1$$</p><p><span class="math-inline" data-latex="x" data-type="math"></span><span class="math-display" data-latex="y" data-type="math"></span></p>`);
  assert.equal(root.querySelectorAll('.katex').length, 6);
  assert.equal(root.querySelectorAll('.katex-display').length, 3);
  renderMathContent(root);
  assert.equal(root.querySelectorAll('.katex').length, 6);
});
test('ordinary text, escaped currency, invalid math and untrusted commands stay safe', () => {
  const root = renderSaved(String.raw`<p>a-b</p><p>1/2</p><p>Price is $5 today</p><p><span data-latex="\frac{" data-type="math"></span></p><p><span data-latex="\href{javascript:alert(1)}{click}" data-type="math"></span></p>`);
  assert.equal(root.children[0].querySelector('.katex'), null);
  assert.equal(root.children[1].querySelector('.katex'), null);
  assert.ok(root.textContent.includes('Price is $5 today'));
  assert.ok(root.querySelector('[data-math-error]'));
  assert.ok(root.textContent.includes('Invalid formula'));
  assert.ok(!root.textContent.includes('\\frac{'));
  assert.equal(root.querySelector('a,script,[onclick]'), null);
  assert.equal(normalizeMath(String.raw`\text{cost}\$`).latex, String.raw`\text{cost}\$`);
});
const { ContentImage, validImageUrl, imageWidth } = await import('../src/admin/components/fields/ContentImage.js');
test('images, captions, alignment and responsive widths survive server save and editor reopen with math', () => {
  for (const align of ['left','center','right']) {
    const make = (content) => new Editor({ extensions: [StarterKit, MathNode, ContentImage], content });
    const first = make('<h2>Example</h2><p>Before</p><ul><li>After</li></ul>');
    const before = first.getText();
    first.commands.insertContentAt(10, { type: 'image', attrs: { src: 'https://example.com/diagram.png', alt: 'Triangle ABC', caption: '<script>caption as text</script>', align, contentWidth: '50%' } });
    first.commands.insertContentAt(first.state.doc.content.size - 2, mathContent(latex, true));
    const saved = sanitizeRichText(first.getHTML());
    const second = make(saved);
    const nodes = []; second.state.doc.descendants(n => nodes.push(n));
    const image = nodes.find(n => n.type.name === 'image');
    assert.equal(image.attrs.src, 'https://example.com/diagram.png');
    assert.equal(image.attrs.alt, 'Triangle ABC');
    assert.equal(image.attrs.align, align);
    assert.equal(image.attrs.contentWidth, '50%');
    assert.equal(image.attrs.caption, '<script>caption as text</script>');
    assert.ok(second.getText().includes('Before'));
    assert.ok(second.getText().includes('After'));
    assert.ok(nodes.some(n => n.type.name === 'math'));
    const rendered = renderSaved(saved);
    assert.ok(rendered.querySelector('figure img'));
    assert.equal(rendered.querySelector('script'), null);
    assert.equal(rendered.querySelector('figure').style.width, '50%');
    assert.equal(rendered.querySelectorAll('.katex').length, 1);
    first.destroy(); second.destroy();
  }
});
test('image URL and width validation reject unsafe sources and constrain size', () => {
  for(const src of ['javascript:alert(1)', 'data:image/png;base64,AA', '//evil.test/img.png', 'file:///secret', '/\\evil.test/x']) assert.equal(validImageUrl(src), '');
  assert.equal(validImageUrl('/uploads/image.png'), '/uploads/image.png');
  assert.equal(imageWidth('500%'), '100%');
  assert.equal(imageWidth('99999px'), '4096px');
});
test('advanced mathematical notation survives native node save and renders without errors', () => {
  for (const source of [String.raw`\frac{3}{4}x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}`, String.raw`x_i^2 + \alpha \leq \beta`, String.raw`\sum_{n=1}^{\infty}\frac{1}{n^2}`, String.raw`\int_0^1 x^2\,dx`, String.raw`\begin{bmatrix} a & b \\ c & d \end{bmatrix}`]) {
    const e=editor(); e.commands.insertContent(mathContent(source, true));
    const root=renderSaved(e.getHTML());
    assert.equal(root.querySelectorAll('.katex').length,1);
    assert.equal(root.querySelector('.katex-error'),null);
    assert.equal(root.querySelector('annotation').textContent,source);
    e.destroy();
  }
});
