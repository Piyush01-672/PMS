import { PASSWORD, createAdmin, login, startServer, stopServer } from './helpers.js';
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { generate } from 'otplib';
import request from 'supertest';

let app;

before(async () => {
  ({ app } = await startServer());
  await createAdmin({ email: 'owner@test.local', role: 'superadmin' });
  await createAdmin({ email: 'editor@test.local', role: 'editor' });
  await createAdmin({ email: 'locked@test.local', role: 'admin' });
  await createAdmin({ email: 'twofa@test.local', role: 'admin' });
});

after(stopServer);

test('login sets an httpOnly, SameSite=Strict session cookie and returns a CSRF token', async () => {
  const { res } = await login(app, 'owner@test.local');
  assert.equal(res.status, 200);
  assert.ok(res.body.csrfToken);
  assert.equal(res.body.admin.email, 'owner@test.local');
  assert.equal(res.body.admin.passwordHash, undefined);
  const cookie = res.headers['set-cookie'].find((c) => c.startsWith('pms_session='));
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Strict/);
});

test('protected admin APIs reject anonymous requests', async () => {
  assert.equal((await request(app).get('/api/auth/me')).status, 401);
  assert.equal((await request(app).get('/api/classes?scope=admin')).status, 401);
  assert.equal((await request(app).post('/api/classes').send({ number: 7 })).status, 401);
  assert.equal((await request(app).get('/api/activity-logs')).status, 401);
  assert.equal((await request(app).get('/api/backups')).status, 401);
});

test('wrong passwords get a generic error and lock the account after 5 attempts', async () => {
  for (let i = 0; i < 5; i += 1) {
    const res = await request(app).post('/api/auth/login').send({ email: 'locked@test.local', password: 'Wrong#Pass999' });
    assert.equal(res.status, 401);
    assert.equal(res.body.error.message, 'Invalid email or password');
  }
  const blocked = await request(app).post('/api/auth/login').send({ email: 'locked@test.local', password: PASSWORD });
  assert.equal(blocked.status, 423);
  const unknown = await request(app).post('/api/auth/login').send({ email: 'nobody@test.local', password: PASSWORD });
  assert.equal(unknown.status, 401);
  assert.equal(unknown.body.error.message, 'Invalid email or password');

  const owner = await login(app, 'owner@test.local');
  const logs = await owner.get('/api/activity-logs?action=login_locked');
  assert.equal(logs.status, 200);
  assert.ok(logs.body.items.some((l) => l.adminEmail === 'locked@test.local' && l.severity === 'critical'));
});

test('state-changing requests require the CSRF token bound to the session', async () => {
  const owner = await login(app, 'owner@test.local');
  const without = await owner.agent.post('/api/subjects').send({ name: { en: 'Mathematics' }, slug: 'maths' });
  assert.equal(without.status, 403);
  const forged = await owner.agent.post('/api/subjects').set('x-csrf-token', 'forged').send({ name: { en: 'Mathematics' }, slug: 'maths' });
  assert.equal(forged.status, 403);
  const crossOrigin = await owner.post('/api/subjects').set('origin', 'https://evil.example').send({ name: { en: 'Mathematics' }, slug: 'maths' });
  assert.equal(crossOrigin.status, 403);
  const ok = await owner.post('/api/subjects').send({ name: { en: 'Mathematics' }, slug: 'maths' });
  assert.equal(ok.status, 201);
});

test('logout revokes the server-side session', async () => {
  const owner = await login(app, 'owner@test.local');
  const cookie = owner.res.headers['set-cookie'].find((c) => c.startsWith('pms_session=')).split(';')[0];
  assert.equal((await owner.get('/api/auth/me')).status, 200);
  assert.equal((await owner.post('/api/auth/logout')).status, 200);
  const reused = await request(app).get('/api/auth/me').set('Cookie', cookie);
  assert.equal(reused.status, 401);
});

test('editors can save drafts but cannot publish, delete or manage admins', async () => {
  const owner = await login(app, 'owner@test.local');
  const subject = (await owner.get('/api/subjects?scope=admin')).body.items[0];
  const editor = await login(app, 'editor@test.local');

  const draft = await editor.post('/api/classes').send({ number: 8, name: { en: 'Class 8' }, subjects: [subject._id] });
  assert.equal(draft.status, 201);
  assert.equal(draft.body.status, 'draft');
  assert.equal(draft.body.slug, 'class-8');

  const publish = await editor.patch(`/api/classes/${draft.body._id}/status`).send({ status: 'published' });
  assert.equal(publish.status, 403);
  const createPublished = await editor.post('/api/classes').send({ number: 9, name: { en: 'Class 9' }, status: 'published' });
  assert.equal(createPublished.status, 403);
  assert.equal((await editor.del(`/api/classes/${draft.body._id}`)).status, 403);
  assert.equal((await editor.get('/api/admins')).status, 403);
  assert.equal((await owner.patch(`/api/classes/${draft.body._id}/status`).send({ status: 'published' })).status, 200);
});

test('owner creates admins only with strong passwords', async () => {
  const owner = await login(app, 'owner@test.local');
  const weak = await owner.post('/api/admins').send({ name: 'Teacher', email: 'teacher@test.local', role: 'editor', password: 'password' });
  assert.equal(weak.status, 400);
  const strong = await owner.post('/api/admins').send({ name: 'Teacher', email: 'teacher@test.local', role: 'editor', password: 'Teach#Maths2025' });
  assert.equal(strong.status, 201);
  const self = await owner.put(`/api/admins/${owner.res.body.admin._id}`).send({ isActive: false });
  assert.equal(self.status, 409);
});

test('two-factor authentication: enrol with an authenticator app, then sign in with a code', async () => {
  const user = await login(app, 'twofa@test.local');
  const setup = await user.post('/api/auth/2fa/setup');
  assert.equal(setup.status, 200);
  assert.match(setup.body.qrDataUrl, /^data:image\/png;base64,/);
  assert.match(setup.body.otpauthUrl, /^otpauth:\/\/totp\//);

  assert.equal((await user.post('/api/auth/2fa/enable').send({ code: '000000' })).status, 400);
  const code = await generate({ secret: setup.body.secret });
  const enable = await user.post('/api/auth/2fa/enable').send({ code });
  assert.equal(enable.status, 200);
  await user.post('/api/auth/logout');

  const first = await request(app).post('/api/auth/login').send({ email: 'twofa@test.local', password: PASSWORD });
  assert.equal(first.status, 200);
  assert.equal(first.body.twoFactorRequired, true);
  assert.equal(first.headers['set-cookie'], undefined, 'no session before the second factor');

  const wrong = await request(app).post('/api/auth/2fa/verify').send({ challenge: first.body.challenge, code: '123456' });
  assert.equal(wrong.status, 401);

  const agent = request.agent(app);
  const verified = await agent.post('/api/auth/2fa/verify').send({ challenge: first.body.challenge, code: await generate({ secret: setup.body.secret }) });
  assert.equal(verified.status, 200);
  assert.ok(verified.body.csrfToken);
  assert.equal((await agent.get('/api/auth/me')).body.admin.totpEnabled, true);
});
