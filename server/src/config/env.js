import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const isTest = process.env.NODE_ENV === 'test';

const bool = (fallback) =>
  z
    .enum(['true', 'false', '1', '0'])
    .default(fallback ? 'true' : 'false')
    .transform((v) => v === 'true' || v === '1');

const secret = (name) =>
  isTest
    ? z.string().default(`test-${name}-secret-value-that-is-long-enough-000000`)
    : z.string().min(32, `${name} must be at least 32 characters`);

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  HOST: z.string().default('0.0.0.0'),
  TRUST_PROXY: z.coerce.number().int().min(0).default(1),

  MONGODB_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/pms'),

  JWT_SECRET: secret('JWT_SECRET'),
  CSRF_SECRET: secret('CSRF_SECRET'),
  ENCRYPTION_KEY: secret('ENCRYPTION_KEY'),

  PUBLIC_SITE_URL: z.string().url().default('http://localhost:5173'),
  CLIENT_ORIGINS: z.string().default('http://localhost:5173,http://127.0.0.1:5173'),
  CLIENT_DIST_DIR: z.string().default(path.resolve(serverRoot, '..', 'client', 'dist')),
  ADMIN_PATH: z
    .string()
    .regex(/^\/[a-z0-9-]{8,64}$/, 'ADMIN_PATH must look like /some-private-path (8+ chars)')
    .default('/pms-control-room'),

  SESSION_IDLE_MINUTES: z.coerce.number().int().positive().default(60),
  SESSION_ABSOLUTE_HOURS: z.coerce.number().int().positive().default(12),
  LOGIN_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  LOGIN_LOCK_MINUTES: z.coerce.number().int().positive().default(15),
  REQUIRE_2FA: bool(false),

  STORAGE_PROVIDER: z.enum(['auto', 'local', 'cloudinary']).default('auto'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_FOLDER: z.string().default('pms'),
  UPLOAD_DIR: z.string().default(path.join(serverRoot, 'uploads')),
  MAX_UPLOAD_MB: z.coerce.number().positive().default(8),

  BACKUP_ENABLED: bool(true),
  BACKUP_CRON: z.string().default('30 2 * * *'),
  BACKUP_TIMEZONE: z.string().default('Asia/Kolkata'),
  BACKUP_DIR: z.string().default(path.join(serverRoot, 'backups')),
  BACKUP_RETENTION_DAYS: z.coerce.number().int().positive().default(30),
  BACKUP_EXTERNAL_DIR: z.string().optional(),
  BACKUP_CLOUDINARY: bool(false),
  BACKUP_INCLUDE_UPLOADS: bool(true),

  SEED_ADMIN_NAME: z.string().default('PMS Owner'),
  SEED_ADMIN_EMAIL: z.string().email().optional(),
  SEED_ADMIN_PASSWORD: z.string().optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  console.error(`\n[config] Invalid environment configuration:\n${issues}\n\nCopy server/.env.example to server/.env and fill it in.\n`);
  process.exit(1);
}

const data = parsed.data;
const cloudinaryConfigured = Boolean(
  data.CLOUDINARY_CLOUD_NAME && data.CLOUDINARY_API_KEY && data.CLOUDINARY_API_SECRET,
);

export const env = {
  ...data,
  isProd: data.NODE_ENV === 'production',
  isTest: data.NODE_ENV === 'test',
  serverRoot,
  clientOrigins: data.CLIENT_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean),
  cloudinaryConfigured,
  storageProvider:
    data.STORAGE_PROVIDER === 'auto' ? (cloudinaryConfigured ? 'cloudinary' : 'local') : data.STORAGE_PROVIDER,
};

if (env.storageProvider === 'cloudinary' && !cloudinaryConfigured) {
  console.error('[config] STORAGE_PROVIDER=cloudinary but Cloudinary credentials are missing.');
  process.exit(1);
}
