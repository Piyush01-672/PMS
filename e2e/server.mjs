// Starts the real API + built website on an isolated database for end-to-end tests:
//   pms_e2e database (reset + starter content), temp upload/backup folders, throwaway owner & editor accounts.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { E2E_DB, E2E_PORT, EDITOR, OWNER } from './fixtures.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const serverDir = path.join(root, 'server');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pms-e2e-'));

const env = {
  ...process.env,
  NODE_ENV: 'test',
  PORT: String(E2E_PORT),
  HOST: '127.0.0.1',
  MONGODB_URI: E2E_DB,
  PUBLIC_SITE_URL: `http://localhost:${E2E_PORT}`,
  CLIENT_ORIGINS: `http://localhost:${E2E_PORT},http://127.0.0.1:${E2E_PORT}`,
  CLIENT_DIST_DIR: path.join(root, 'client', 'dist'),
  STORAGE_PROVIDER: 'local',
  UPLOAD_DIR: path.join(tmp, 'uploads'),
  BACKUP_DIR: path.join(tmp, 'backups'),
  BACKUP_EXTERNAL_DIR: '',
  BACKUP_ENABLED: 'false',
  REQUIRE_2FA: 'false',
  SEED_ADMIN_NAME: OWNER.name,
  SEED_ADMIN_EMAIL: OWNER.email,
  SEED_ADMIN_PASSWORD: OWNER.password,
};

function run(args) {
  const result = spawnSync(process.execPath, args, { cwd: serverDir, env, stdio: 'inherit' });
  if (result.status !== 0) {
    console.error(`[e2e] failed: node ${args.join(' ')}`);
    process.exit(result.status || 1);
  }
}

if (!fs.existsSync(path.join(env.CLIENT_DIST_DIR, 'index.html'))) {
  console.error('[e2e] client/dist is missing — run `npm run build` first');
  process.exit(1);
}

run(['src/scripts/seed.js', '--reset']);
for (const account of [
  { ...OWNER, role: 'superadmin' },
  { ...EDITOR, role: 'editor' },
]) {
  run(['src/scripts/createAdmin.js', '--email', account.email, '--name', account.name, '--role', account.role, '--password', account.password]);
}

const api = spawn(process.execPath, ['src/index.js'], { cwd: serverDir, env, stdio: 'inherit' });
const stop = () => {
  api.kill();
  fs.rmSync(tmp, { recursive: true, force: true });
};
api.on('exit', (code) => {
  fs.rmSync(tmp, { recursive: true, force: true });
  process.exit(code ?? 0);
});
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
