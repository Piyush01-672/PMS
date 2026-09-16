import { PASSWORD, createAdmin, login, startServer, stopServer } from './helpers.js';
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { Backup, ClassLevel } from '../src/models/index.js';

let app;
let owner;

before(async () => {
  ({ app } = await startServer());
  await createAdmin({ email: 'owner@test.local' });
  await createAdmin({ email: 'admin@test.local', role: 'admin' });
  owner = await login(app, 'owner@test.local');
});

after(stopServer);

test('create, verify and restore a backup (accounts are never overwritten)', async () => {
  const created = await owner.post('/api/classes').send({ number: 9, name: { hi: 'कक्षा 9', en: 'Class 9' }, status: 'published' });
  assert.equal(created.status, 201);

  const backup = await owner.post('/api/backups');
  assert.equal(backup.status, 201);
  assert.equal(backup.body.status, 'completed');
  assert.ok(backup.body.bytes > 0);
  assert.equal(backup.body.collections.find((c) => c.name === 'classes').count, 1);
  assert.ok(!backup.body.collections.some((c) => c.name === 'sessions'), 'sessions are never backed up');

  const verify = await owner.post(`/api/backups/${backup.body._id}/verify`);
  assert.equal(verify.body.ok, true);

  assert.equal((await owner.del(`/api/classes/${created.body._id}`)).status, 200);
  assert.equal(await ClassLevel.countDocuments(), 0);

  const admin = await login(app, 'admin@test.local');
  assert.equal((await admin.post(`/api/backups/${backup.body._id}/restore`).send({ password: PASSWORD, confirm: 'RESTORE' })).status, 403);
  assert.equal((await owner.post(`/api/backups/${backup.body._id}/restore`).send({ password: PASSWORD })).status, 400);
  assert.equal((await owner.post(`/api/backups/${backup.body._id}/restore`).send({ password: 'Wrong#Pass999', confirm: 'RESTORE' })).status, 400);

  const restored = await owner.post(`/api/backups/${backup.body._id}/restore`).send({ password: PASSWORD, confirm: 'RESTORE' });
  assert.equal(restored.status, 200);
  assert.ok(restored.body.safetyBackup.includes('pre-restore'));
  assert.equal(await ClassLevel.countDocuments(), 1);
  assert.equal((await owner.get('/api/auth/me')).status, 200, 'current session survives a restore');
  assert.equal(await Backup.countDocuments({ type: 'pre-restore' }), 1);

  const list = await owner.get('/api/backups');
  assert.equal(list.body.items.length, 2);
  assert.equal((await owner.del(`/api/backups/${backup.body._id}`)).status, 200);
});
