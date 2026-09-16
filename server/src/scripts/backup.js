// Manual backup: npm run backup   (use with the OS scheduler if the API process is not always running)
import { env } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { createBackup, verifyBackup } from '../services/backup.js';

async function run() {
  await connectDB(env.MONGODB_URI);
  const record = await createBackup({ type: 'manual' });
  const check = await verifyBackup(record);
  console.log(`[backup] ${record.filename} — ${record.bytes} bytes — external copy: ${record.external?.status}`);
  console.log(`[backup] verification: ${check.ok ? 'OK' : 'FAILED'} — ${check.message}`);
  if (!check.ok) process.exitCode = 1;
}

run()
  .catch((err) => {
    console.error('[backup] failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => disconnectDB());
