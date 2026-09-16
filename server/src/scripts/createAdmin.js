// Usage: npm run create-admin -- --email owner@example.com --name "Owner" --role superadmin
// The password is read from --password or SEED_ADMIN_PASSWORD (never hardcoded).
import { env } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { ROLES, passwordError } from '../lib/permissions.js';
import { Admin } from '../models/index.js';

function arg(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index > -1 ? process.argv[index + 1] : undefined;
}

async function run() {
  const email = (arg('email') || env.SEED_ADMIN_EMAIL || '').toLowerCase().trim();
  const name = arg('name') || env.SEED_ADMIN_NAME;
  const role = arg('role') || 'superadmin';
  const password = arg('password') || env.SEED_ADMIN_PASSWORD;

  if (!email || !password) throw new Error('Provide --email and --password (or SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD)');
  if (!ROLES.includes(role)) throw new Error(`Role must be one of: ${ROLES.join(', ')}`);
  const problem = passwordError(password, email);
  if (problem) throw new Error(problem);

  await connectDB(env.MONGODB_URI);
  let admin = await Admin.findOne({ email });
  const created = !admin;
  if (!admin) admin = new Admin({ email, name, role });
  admin.name = name;
  admin.role = role;
  admin.isActive = true;
  admin.failedLoginAttempts = 0;
  admin.lockUntil = undefined;
  await admin.setPassword(password);
  await admin.save();
  console.log(`[admin] ${created ? 'created' : 'updated (password reset & unlocked)'}: ${email} (${role})`);
}

run()
  .catch((err) => {
    console.error('[admin] failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => disconnectDB());
