import { PNG_1x1 } from './helpers.js';
import assert from 'node:assert/strict';
import test from 'node:test';
import { detectImage } from '../src/lib/imageInfo.js';
import { passwordError, passwordProblems } from '../src/lib/permissions.js';
import { sanitizeRichText, sanitizeSvg, stripHtml } from '../src/lib/sanitize.js';
import { parseQuery } from '../src/services/search.js';
import { slugify } from '../src/utils/slug.js';
import { extractYouTubeId } from '../src/utils/youtube.js';

test('extracts YouTube ids from every common URL format', () => {
  const id = 'dQ-w4_w9WgX';
  for (const url of [
    `https://www.youtube.com/watch?v=${id}`,
    `https://youtube.com/watch?v=${id}&t=42s`,
    `https://youtu.be/${id}`,
    `https://youtu.be/${id}?si=abc`,
    `https://m.youtube.com/watch?v=${id}`,
    `https://www.youtube.com/embed/${id}`,
    `https://www.youtube.com/shorts/${id}`,
    `https://www.youtube-nocookie.com/embed/${id}`,
    `youtu.be/${id}`,
    id,
  ]) {
    assert.equal(extractYouTubeId(url), id, url);
  }
  for (const bad of ['', 'https://vimeo.com/123', 'https://evil.com/watch?v=dQ-w4_w9WgX', 'https://youtu.be/short', 'javascript:alert(1)']) {
    assert.equal(extractYouTubeId(bad), null, bad);
  }
});

test('detects real image types from bytes, not file names', () => {
  assert.deepEqual(detectImage(PNG_1x1), { format: 'png', mimeType: 'image/png', width: 1, height: 1 });
  const svg = detectImage(Buffer.from('<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 150"></svg>'));
  assert.equal(svg.format, 'svg');
  assert.equal(svg.width, 300);
  assert.equal(svg.height, 150);
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x01, 0x2c, 0x02, 0x58, 0x03, 0, 0, 0, 0, 0, 0]);
  assert.deepEqual(detectImage(jpeg), { format: 'jpg', mimeType: 'image/jpeg', width: 600, height: 300 });
  assert.equal(detectImage(Buffer.from('MZ\x90\x00 this is an exe')), null);
  assert.equal(detectImage(Buffer.from('GIF89a')), null);
});

test('rich text sanitizer removes scripts, handlers and javascript: links but keeps math and tables', () => {
  const dirty =
    '<p onclick="x()">Hi <script>alert(1)</script><img src=x onerror=alert(1)> $x^2$ <a href="javascript:alert(1)">bad</a> <a href="https://ncert.nic.in" target="_blank">ok</a></p><table><tr><td style="text-align:center;color:red">1</td></tr></table>';
  const clean = sanitizeRichText(dirty);
  assert.ok(!/script|onerror|onclick|javascript:/i.test(clean), clean);
  assert.ok(clean.includes('$x^2$'));
  assert.ok(clean.includes('rel="noopener noreferrer"'));
  assert.ok(clean.includes('text-align:center'));
  assert.ok(!clean.includes('color:red'));
  assert.equal(stripHtml('<p>a &lt; b</p><p>c</p>'), 'a < b c');
});

test('SVG sanitizer strips scripts, event handlers and external references', () => {
  const svg = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" onload="alert(1)"><script>alert(1)</script><foreignObject><div>x</div></foreignObject><circle cx="5" cy="5" r="4" fill="red"/><use href="https://evil/x.svg#a"/><rect fill="url(https://evil/p)" width="2" height="2"/></svg>',
  );
  const clean = sanitizeSvg(svg).toString();
  assert.ok(!/script|onload|foreignObject|evil/i.test(clean), clean);
  assert.ok(clean.includes('<circle'));
  assert.ok(clean.includes('viewBox'));
});

test('search query parser understands class / अध्याय / प्रश्नावली / question numbers in Hindi and English', () => {
  assert.deepEqual(parseQuery('Class 10 AP Ex 5.2 Q3'), { classNumber: 10, chapterNumber: null, exerciseNumber: '5.2', questionNumber: '3', terms: ['ap'] });
  assert.deepEqual(parseQuery('कक्षा 9 अध्याय 5 प्रश्नावली 5.1'), { classNumber: 9, chapterNumber: 5, exerciseNumber: '5.1', questionNumber: null, terms: [] });
  assert.deepEqual(parseQuery('Pythagoras theorem').terms, ['pythagoras', 'theorem']);
  assert.equal(parseQuery('chapter 12').chapterNumber, 12);
});

test('password policy and slugs', () => {
  assert.ok(passwordProblems('short').length > 0);
  assert.deepEqual(passwordProblems('Strong#Pass123'), []);
  assert.ok(passwordProblems('Owner#Pass123', 'owner@site.com').includes('not contain your email name'));
  assert.equal(passwordError('Owner#Pass123', 'owner@site.com'), 'Password must not contain the name part of the email address');
  assert.equal(passwordError('short', ''), 'Password must have at least 10 characters, an uppercase letter, a number, a symbol');
  assert.equal(passwordError('Strong#Pass123'), null);
  assert.equal(slugify('Prashnavali 5.2'), 'prashnavali-5-2');
  assert.equal(slugify('  Class 10 — Maths!! '), 'class-10-maths');
  assert.equal(slugify('त्रिभुज', 'fallback'), 'fallback');
});
