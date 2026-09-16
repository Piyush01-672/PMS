// Must be imported before any ../src module: it points the app at an isolated test database and temp folders.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pms-test-'));
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.TEST_MONGODB_URI || `mongodb://127.0.0.1:27017/pms_test_${process.pid}`;
process.env.UPLOAD_DIR = path.join(tmp, 'uploads');
process.env.BACKUP_DIR = path.join(tmp, 'backups');
process.env.BACKUP_EXTERNAL_DIR = '';
process.env.BACKUP_ENABLED = 'false';
process.env.STORAGE_PROVIDER = 'local';
process.env.CLIENT_DIST_DIR = path.join(tmp, 'no-client-build');

export const PASSWORD = 'Strong#Pass123';
export const PNG_1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

let mongooseRef;

export async function startServer() {
  const mongoose = (await import('mongoose')).default;
  const { connectDB } = await import('../src/config/db.js');
  const { createApp } = await import('../src/app.js');
  await import('../src/models/index.js');
  await connectDB(process.env.MONGODB_URI);
  await mongoose.connection.dropDatabase();
  for (const model of Object.values(mongoose.models)) await model.syncIndexes();
  mongooseRef = mongoose;
  return { app: createApp(), mongoose };
}

export async function stopServer() {
  if (mongooseRef) {
    await mongooseRef.connection.dropDatabase();
    await mongooseRef.disconnect();
  }
  fs.rmSync(tmp, { recursive: true, force: true });
}

export async function createAdmin({ email, role = 'superadmin', password = PASSWORD, name = 'Test Admin' }) {
  const { Admin } = await import('../src/models/index.js');
  const admin = new Admin({ email, role, name });
  await admin.setPassword(password);
  await admin.save();
  return admin;
}

// Logged-in supertest agent that automatically sends the CSRF header on state-changing requests.
export async function login(app, email, password = PASSWORD) {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/login').send({ email, password });
  const csrf = res.body.csrfToken;
  const withCsrf = (method) => (url) => agent[method](url).set('x-csrf-token', csrf || '');
  return {
    res,
    agent,
    csrf,
    get: (url) => agent.get(url),
    post: withCsrf('post'),
    put: withCsrf('put'),
    patch: withCsrf('patch'),
    del: withCsrf('delete'),
  };
}
