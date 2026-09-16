import { createAdmin, login, startServer, stopServer } from './helpers.js';
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import request from 'supertest';
import { Solution } from '../src/models/index.js';

let app;
let owner;
const ids = {};
const QUESTION_PATH = '/class-10/maths/adhyay-5/prashnavali-5-2/prashn-3';
// Pass either the Express app (anonymous visitor) or a logged-in helper from login().
const resolve = (client, path, extra = '') =>
  (client.agent ? client.agent : request(client)).get(`/api/public/resolve?path=${encodeURIComponent(path)}${extra}`);

before(async () => {
  ({ app } = await startServer());
  await createAdmin({ email: 'owner@test.local' });
  owner = await login(app, 'owner@test.local');
});

after(stopServer);

test('admin builds Class → Subject → अध्याय → प्रश्नावली from the API', async () => {
  const subject = await owner.post('/api/subjects').send({ name: { hi: 'गणित', en: 'Mathematics' }, slug: 'maths', isPublic: true, status: 'published' });
  assert.equal(subject.status, 201);
  ids.subject = subject.body._id;

  const cls = await owner.post('/api/classes').send({ number: 10, name: { hi: 'कक्षा 10 गणित', en: 'Class 10 Mathematics' }, subjects: [ids.subject], status: 'published' });
  assert.equal(cls.status, 201);
  ids.class = cls.body._id;

  const chapter = await owner.post('/api/chapters').send({
    class: ids.class,
    subject: ids.subject,
    number: 5,
    title: { hi: 'समांतर श्रेढ़ियाँ', en: 'Arithmetic Progressions' },
    formulas: [{ title: { en: 'nth term' }, latex: 'a_n = a + (n-1)d' }],
    status: 'published',
  });
  assert.equal(chapter.status, 201);
  assert.equal(chapter.body.slug, 'adhyay-5');
  ids.chapter = chapter.body._id;

  const exercise = await owner.post('/api/exercises').send({ chapter: ids.chapter, number: '5.2', status: 'published' });
  assert.equal(exercise.status, 201);
  assert.equal(exercise.body.slug, 'prashnavali-5-2');
  assert.equal(String(exercise.body.chapter.class._id), ids.class, 'class is derived from the parent chapter');
  ids.exercise = exercise.body._id;

  const second = await owner.post('/api/exercises').send({ chapter: ids.chapter, number: '5.1', status: 'published' });
  ids.exercise51 = second.body._id;

  const chapters = await request(app).get(`/api/classes/${ids.class}/chapters`);
  assert.equal(chapters.body.items.length, 1);
});

test('YouTube URLs are validated and stored once', async () => {
  const bad = await owner.post('/api/videos/resolve').send({ url: 'https://example.com/watch?v=abcdefghijk' });
  assert.equal(bad.status, 400);
  assert.match(bad.body.error.message, /Invalid YouTube URL/);

  const video = await owner.post('/api/videos/resolve').send({ url: 'https://youtu.be/abcdefghijk?si=x', title: { en: 'AP explained' } });
  assert.equal(video.status, 201);
  assert.equal(video.body.youtubeId, 'abcdefghijk');
  assert.equal(video.body.thumbnailUrl, 'https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg');
  ids.video = video.body._id;

  const again = await owner.post('/api/videos/resolve').send({ url: 'https://www.youtube.com/watch?v=abcdefghijk' });
  assert.equal(again.status, 200);
  assert.equal(again.body._id, ids.video);
});

test('question with ordered solution blocks is sanitized, hidden as draft and visible once published', async () => {
  const created = await owner.post('/api/questions').send({
    exercise: ids.exercise,
    number: '3',
    tags: ['ap', 'nth term'],
    text: {
      hi: '<p>प्रश्न <script>alert(1)</script><img src=x onerror=alert(1)> $a_n$ ज्ञात करें</p>',
      en: '<p>Which term of the AP is 78?</p>',
    },
    video: { video: ids.video, placement: 'afterQuestion' },
    solution: {
      blocks: [
        { type: 'text', content: { hi: '<p>दिया है a = 3</p>' } },
        { type: 'formula', latex: 'a_n = a + (n-1)d' },
        { type: 'youtube', video: ids.video },
        { type: 'finalAnswer', content: { en: '<p>16th term</p>' } },
      ],
    },
  });
  assert.equal(created.status, 201);
  ids.question = created.body._id;
  assert.equal(created.body.slug, 'prashn-3');
  assert.equal(created.body.status, 'draft');
  assert.ok(!/script|onerror/i.test(created.body.text.hi));
  assert.deepEqual(created.body.solution.blocks.map((b) => b.type), ['text', 'formula', 'youtube', 'finalAnswer']);

  assert.equal((await resolve(app, QUESTION_PATH)).status, 404);
  assert.equal((await request(app).get(`/api/questions/${ids.question}`)).status, 404);

  assert.equal((await owner.patch(`/api/questions/${ids.question}/status`).send({ status: 'published' })).status, 200);

  const page = await resolve(app, QUESTION_PATH);
  assert.equal(page.status, 200);
  assert.equal(page.body.type, 'question');
  const q = page.body.data.question;
  assert.deepEqual(q.solution.blocks.map((b) => b.type), ['text', 'formula', 'youtube', 'finalAnswer']);
  assert.equal(q.solution.blocks[2].video.youtubeId, 'abcdefghijk');
  assert.equal(q.video.placement, 'afterQuestion');

  const crumbs = page.body.breadcrumbs.map((c) => c.label.hi);
  assert.deepEqual(crumbs, ['होम', 'कक्षा 10', 'गणित', 'अध्याय 5', 'प्रश्नावली 5.2', 'प्रश्न 3']);
  assert.equal(page.body.breadcrumbs.at(-2).url, '/class-10/maths/adhyay-5/prashnavali-5-2');
  assert.match(page.body.seo.title, /प्रश्नावली 5.2/);
  assert.ok(page.body.related.some((r) => r.url === '/class-10/maths/adhyay-5/prashnavali-5-1'));
});

test('class URL redirects to its only subject; exercise page lists questions with pagination', async () => {
  const cls = await resolve(app, '/class-10');
  assert.equal(cls.body.type, 'redirect');
  assert.equal(cls.body.redirect, '/class-10/maths');

  const subject = await resolve(app, '/class-10/maths');
  assert.equal(subject.body.type, 'subject');
  assert.equal(subject.body.data.chapters[0].exercises.length, 2);

  const exercise = await resolve(app, '/class-10/maths/adhyay-5/prashnavali-5-2');
  assert.equal(exercise.body.type, 'exercise');
  assert.equal(exercise.body.data.pagination.total, 1);
  assert.equal(exercise.body.data.questions[0].url, QUESTION_PATH);
  assert.equal((await resolve(app, '/class-10/maths/adhyay-99')).status, 404);
});

test('scheduled content stays hidden until its publish time', async () => {
  const future = new Date(Date.now() + 86_400_000).toISOString();
  const scheduled = await owner.post('/api/questions').send({ exercise: ids.exercise, number: '4', text: { en: '<p>Later</p>' }, status: 'published', publishedAt: future });
  assert.equal(scheduled.status, 201);
  assert.equal((await resolve(app, '/class-10/maths/adhyay-5/prashnavali-5-2/prashn-4')).status, 404);
  const exercise = await resolve(app, '/class-10/maths/adhyay-5/prashnavali-5-2');
  assert.equal(exercise.body.data.pagination.total, 1);
});

test('preview shows unsaved changes and drafts to admins only', async () => {
  const token = await owner.post('/api/public/preview').send({
    entityType: 'Question',
    id: ids.question,
    data: { text: { en: '<p>Unsaved preview text</p>' } },
    solution: { blocks: [{ type: 'text', content: { en: '<p>Unsaved block</p>' } }] },
  });
  assert.equal(token.status, 200);

  const previewed = await resolve(owner, QUESTION_PATH, `&preview=1&previewToken=${token.body.token}`);
  assert.equal(previewed.body.data.question.text.en, '<p>Unsaved preview text</p>');
  assert.equal(previewed.body.data.question.solution.blocks.length, 1);

  const anonymous = await resolve(app, QUESTION_PATH, `&preview=1&previewToken=${token.body.token}`);
  assert.equal(anonymous.body.data.question.text.en, '<p>Which term of the AP is 78?</p>');
  assert.equal(anonymous.body.data.question.solution.blocks.length, 4);

  await owner.post('/api/questions').send({ exercise: ids.exercise, number: '5', text: { en: '<p>Draft</p>' } });
  assert.equal((await resolve(app, '/class-10/maths/adhyay-5/prashnavali-5-2/prashn-5')).status, 404);
  assert.equal((await resolve(owner, '/class-10/maths/adhyay-5/prashnavali-5-2/prashn-5', '&preview=1')).status, 200);
});

test('search finds classes, प्रश्नावली, Hindi words and formulas', async () => {
  const ex = await request(app).get(`/api/search?q=${encodeURIComponent('Class 10 Ex 5.2')}`);
  assert.equal(ex.status, 200);
  assert.equal(ex.body.results[0].type, 'exercise');
  assert.equal(ex.body.results[0].url, '/class-10/maths/adhyay-5/prashnavali-5-2');

  const hindi = await request(app).get(`/api/search?q=${encodeURIComponent('समांतर')}`);
  assert.ok(hindi.body.results.some((r) => r.type === 'chapter' && r.url === '/class-10/maths/adhyay-5'));

  const formula = await request(app).get(`/api/search?q=${encodeURIComponent('a_n')}`);
  assert.ok(formula.body.results.some((r) => r.type === 'formula'));

  const question = await request(app).get(`/api/search?q=${encodeURIComponent('class 10 ex 5.2 q3')}`);
  assert.equal(question.body.results[0].url, QUESTION_PATH);

  const solution = await request(app).get(`/api/public/suggest?q=${encodeURIComponent('16th term')}`);
  assert.ok(solution.body.results.some((r) => r.url === QUESTION_PATH));
});

test('deleting is safe: parents with children are protected, questions delete only their own solution', async () => {
  const blocked = await owner.del(`/api/chapters/${ids.chapter}`);
  assert.equal(blocked.status, 409);

  const copy = await owner.post(`/api/questions/${ids.question}/duplicate`);
  assert.equal(copy.status, 201);
  assert.match(copy.body.slug, /^prashn-3-copy-/);
  assert.equal(copy.body.status, 'draft');
  assert.equal(copy.body.solution.blocks.length, 4);

  assert.equal((await owner.del(`/api/questions/${copy.body._id}`)).status, 200);
  assert.equal(await Solution.countDocuments({ question: copy.body._id }), 0);
  assert.equal(await Solution.countDocuments({ question: ids.question }), 1);
});

test('drag-and-drop reorder, settings, navigation and homepage sections are database driven', async () => {
  assert.equal((await owner.put('/api/exercises/reorder').send({ ids: [ids.exercise, ids.exercise51] })).status, 200);
  const subject = await resolve(app, '/class-10/maths');
  assert.equal(subject.body.data.chapters[0].exercises[0].number, '5.2');

  const settings = await owner.put('/api/site-settings').send({ header: { searchPlaceholder: { hi: 'खोजें…', en: 'Search now' }, showSearch: true } });
  assert.equal(settings.status, 200);
  assert.equal((await owner.put('/api/navigation/header').send({ items: [{ label: { en: 'Home' }, url: '/' }, { label: { en: 'Maths' }, type: 'classes' }] })).status, 200);

  await owner.post('/api/sections').send({ type: 'text', title: { en: 'Visible section' }, status: 'published' });
  await owner.post('/api/sections').send({ type: 'text', title: { en: 'Hidden section' }, status: 'published', isVisible: false });
  await owner.post('/api/sections').send({ type: 'classGrid', title: { en: 'Classes' }, status: 'published' });

  const site = await request(app).get('/api/public/site');
  assert.equal(site.body.settings.header.searchPlaceholder.en, 'Search now');
  assert.equal(site.headers['cache-control'], 'public, no-cache', 'browsers must revalidate so admin changes show immediately');
  assert.ok(site.headers.etag, 'ETag enables cheap 304 revalidation');
  const revalidated = await request(app).get('/api/public/site').set('If-None-Match', site.headers.etag);
  assert.equal(revalidated.status, 304);
  assert.equal(site.body.navigation.header.length, 2);
  assert.equal(site.body.classes[0].url, '/class-10/maths');

  const home = await request(app).get('/api/public/home');
  const titles = home.body.sections.map((s) => s.title.en);
  assert.ok(titles.includes('Visible section'));
  assert.ok(!titles.includes('Hidden section'));
  const grid = home.body.sections.find((s) => s.type === 'classGrid');
  assert.equal(grid.data.classes[0].stats.questions, 1);
});

test('activity log, dashboard stats and sitemap reflect admin work', async () => {
  const logs = await owner.get('/api/activity-logs');
  const actions = new Set(logs.body.items.map((l) => l.action));
  for (const action of ['login', 'create', 'publish', 'duplicate', 'delete', 'reorder', 'settings_update']) assert.ok(actions.has(action), action);

  const dashboard = await owner.get('/api/dashboard');
  assert.equal(dashboard.status, 200);
  assert.equal(dashboard.body.totals.questions, 3);
  assert.equal(dashboard.body.totals.scheduled, 1);
  assert.ok(dashboard.body.recent.length > 0);

  const sitemap = await request(app).get('/sitemap.xml');
  assert.equal(sitemap.status, 200);
  assert.ok(sitemap.text.includes(`${QUESTION_PATH}</loc>`));
  assert.ok(!sitemap.text.includes('prashn-4'));
  const robots = await request(app).get('/robots.txt');
  assert.match(robots.text, /Sitemap: .*\/sitemap.xml/);
  assert.ok(!robots.text.includes('pms-control'), 'robots.txt must not reveal the admin path');
});
