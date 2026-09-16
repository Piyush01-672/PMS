import { PNG_1x1, createAdmin, login, startServer, stopServer } from './helpers.js';
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import request from 'supertest';

let app;
let owner;

before(async () => {
  ({ app } = await startServer());
  await createAdmin({ email: 'owner@test.local' });
  owner = await login(app, 'owner@test.local');
});

after(stopServer);

test('uploads an image with SEO metadata and serves it with safe headers', async () => {
  const res = await owner
    .post('/api/media/upload')
    .field('title', 'Triangle ABC figure')
    .field('altHi', 'त्रिभुज ABC')
    .field('altEn', 'Triangle ABC')
    .field('kind', 'diagram')
    .attach('files', PNG_1x1, 'figure.png');
  assert.equal(res.status, 201);
  const media = res.body.items[0];
  assert.equal(media.width, 1);
  assert.equal(media.height, 1);
  assert.equal(media.kind, 'diagram');
  assert.equal(media.alt.hi, 'त्रिभुज ABC');
  assert.match(media.url, /^\/uploads\/\d{4}\/\d{2}\/triangle-abc-figure-[a-f0-9]{8}\.png$/);

  const file = await request(app).get(media.url);
  assert.equal(file.status, 200);
  assert.equal(file.headers['content-type'], 'image/png');
  assert.equal(file.headers['x-content-type-options'], 'nosniff');

  const list = await owner.get('/api/media?kind=diagrams&q=triangle');
  assert.equal(list.body.total, 1);
});

test('rejects disguised and unsupported files', async () => {
  const fake = await owner.post('/api/media/upload').attach('files', Buffer.from('MZ not really a png'), 'evil.png');
  assert.equal(fake.status, 400);
  const gif = await owner.post('/api/media/upload').attach('files', Buffer.from('GIF89a'), 'anim.gif');
  assert.equal(gif.status, 400);
  const anonymous = await request(app).post('/api/media/upload').attach('files', PNG_1x1, 'x.png');
  assert.equal(anonymous.status, 401);
});

test('SVG uploads are sanitized before storage', async () => {
  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 10" onload="alert(1)"><script>alert(document.cookie)</script><line x1="0" y1="0" x2="20" y2="10" stroke="black"/></svg>');
  const res = await owner.post('/api/media/upload').attach('files', svg, 'graph.svg');
  assert.equal(res.status, 201);
  assert.equal(res.body.items[0].width, 20);
  const stored = await request(app).get(res.body.items[0].url).buffer(true).parse((r, cb) => {
    let data = '';
    r.on('data', (c) => { data += c; });
    r.on('end', () => cb(null, data));
  });
  assert.ok(!/script|onload/i.test(stored.body));
  assert.match(stored.headers['content-security-policy'], /sandbox/);
});

test('images in use cannot be deleted by accident; replace keeps the same id', async () => {
  const upload = await owner.post('/api/media/upload').attach('files', PNG_1x1, 'thumb.png');
  const media = upload.body.items[0];
  const cls = await owner.post('/api/classes').send({ number: 6, name: { en: 'Class 6' }, thumbnail: media._id });
  assert.equal(cls.status, 201);

  const usage = await owner.get(`/api/media/${media._id}/usage`);
  assert.equal(usage.body.items[0].type, 'Class');

  const blocked = await owner.del(`/api/media/${media._id}`);
  assert.equal(blocked.status, 409);

  const replaced = await owner.post(`/api/media/${media._id}/replace`).attach('file', PNG_1x1, 'new-thumb.png');
  assert.equal(replaced.status, 200);
  assert.equal(replaced.body._id, media._id);
  assert.notEqual(replaced.body.url, media.url);
  assert.equal((await request(app).get(media.url)).status, 404, 'old file removed');

  const forced = await owner.del(`/api/media/${media._id}?force=true`);
  assert.equal(forced.status, 200);
});
