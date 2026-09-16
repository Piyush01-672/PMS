import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { createApp } from './app.js';
import { SiteSettings } from './models/index.js';
import { scheduleBackups } from './services/backup.js';

async function main() {
  await connectDB(env.MONGODB_URI);
  await SiteSettings.getSingleton();
  console.log(`[db] connected (${env.MONGODB_URI.replace(/\/\/[^@]*@/, '//***@')})`);

  const app = createApp();
  const server = app.listen(env.PORT, env.HOST, () => {
    console.log(`[api] Passion Maths Study API listening on http://${env.HOST}:${env.PORT} (${env.NODE_ENV})`);
    console.log(`[media] storage provider: ${env.storageProvider}`);
  });
  const backupTask = scheduleBackups();

  const shutdown = async (signal) => {
    console.log(`[api] ${signal} received, shutting down…`);
    backupTask?.stop();
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('[api] failed to start', err);
  process.exit(1);
});
