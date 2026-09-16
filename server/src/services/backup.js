import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline';
import zlib from 'node:zlib';
import mongoose from 'mongoose';
import cron from 'node-cron';
import { env } from '../config/env.js';
import { cache } from '../lib/cache.js';
import { cloudinary } from '../lib/storage.js';
import { Backup } from '../models/Backup.js';

const { EJSON } = mongoose.mongo.BSON;
const EXCLUDED_FROM_BACKUP = new Set(['sessions']);
// Restores bring back website content & settings; accounts and audit history stay as they are now.
const SKIPPED_ON_RESTORE = new Set(['admins', 'sessions', 'backups', 'activitylogs']);
const backupDir = () => path.resolve(env.BACKUP_DIR);

export function backupFilePath(record) {
  const file = path.resolve(backupDir(), record.filename);
  if (!file.startsWith(backupDir() + path.sep)) throw new Error('Invalid backup path');
  return file;
}

async function copyToExternal(file, filename) {
  if (env.BACKUP_EXTERNAL_DIR) {
    try {
      const dir = path.resolve(env.BACKUP_EXTERNAL_DIR);
      await fsp.mkdir(dir, { recursive: true });
      const target = path.join(dir, filename);
      await fsp.copyFile(file, target);
      return { provider: 'directory', location: target, status: 'completed' };
    } catch (err) {
      return { provider: 'directory', status: 'failed', error: err.message };
    }
  }
  if (env.BACKUP_CLOUDINARY && env.cloudinaryConfigured) {
    try {
      const result = await cloudinary.uploader.upload(file, {
        resource_type: 'raw',
        type: 'authenticated',
        folder: `${env.CLOUDINARY_FOLDER}/backups`,
        public_id: filename,
        overwrite: false,
      });
      return { provider: 'cloudinary', location: result.public_id, status: 'completed' };
    } catch (err) {
      return { provider: 'cloudinary', status: 'failed', error: err.message };
    }
  }
  return { provider: 'none', status: 'skipped' };
}

async function mirrorUploads() {
  const source = path.resolve(env.UPLOAD_DIR);
  const target = path.join(path.resolve(env.BACKUP_EXTERNAL_DIR), 'uploads');
  let files = 0;
  let copied = 0;
  const walk = async (dir) => {
    let entries = [];
    try {
      entries = await fsp.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const from = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(from);
      } else if (entry.isFile() && entry.name !== '.gitkeep') {
        files += 1;
        const to = path.join(target, path.relative(source, from));
        const [a, b] = await Promise.all([fsp.stat(from), fsp.stat(to).catch(() => null)]);
        if (!b || b.size !== a.size) {
          await fsp.mkdir(path.dirname(to), { recursive: true });
          await fsp.copyFile(from, to);
          copied += 1;
        }
      }
    }
  };
  await walk(source);
  return { files, copied };
}

export async function applyRetention() {
  const cutoff = new Date(Date.now() - env.BACKUP_RETENTION_DAYS * 86_400_000);
  const keep = await Backup.find({ status: 'completed' }).sort({ createdAt: -1 }).limit(3).select('_id').lean();
  const old = await Backup.find({ createdAt: { $lt: cutoff }, _id: { $nin: keep.map((k) => k._id) } });
  for (const record of old) await deleteBackup(record);
  return old.length;
}

export async function createBackup({ type = 'manual', admin } = {}) {
  await fsp.mkdir(backupDir(), { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `pms-backup-${stamp}-${type}.jsonl.gz`;
  const record = await Backup.create({ filename, type, status: 'running', createdBy: admin?._id });
  const file = backupFilePath(record);

  try {
    const gzip = zlib.createGzip({ level: 6 });
    const out = fs.createWriteStream(file);
    const finished = new Promise((resolve, reject) => {
      out.on('finish', resolve);
      out.on('error', reject);
      gzip.on('error', reject);
    });
    gzip.pipe(out);
    const write = (obj) =>
      new Promise((resolve) => {
        if (gzip.write(`${EJSON.stringify(obj, { relaxed: false })}\n`)) resolve();
        else gzip.once('drain', resolve);
      });

    const db = mongoose.connection.db;
    const names = (await db.listCollections({}, { nameOnly: true }).toArray())
      .map((c) => c.name)
      .filter((n) => !n.startsWith('system.') && !EXCLUDED_FROM_BACKUP.has(n))
      .sort();

    await write({ meta: { app: 'passion-maths-study', format: 1, createdAt: new Date(), database: db.databaseName } });
    const collections = [];
    for (const name of names) {
      let count = 0;
      for await (const doc of db.collection(name).find({})) {
        await write({ c: name, d: doc });
        count += 1;
      }
      collections.push({ name, count });
    }
    await write({ end: true, collections });
    gzip.end();
    await finished;

    const { size } = await fsp.stat(file);
    record.bytes = size;
    record.collections = collections;
    record.status = 'completed';
    record.external = await copyToExternal(file, filename);
    if (env.storageProvider === 'local' && env.BACKUP_INCLUDE_UPLOADS && env.BACKUP_EXTERNAL_DIR) {
      record.uploads = await mirrorUploads();
    }
    await record.save();
    await applyRetention();
    return record;
  } catch (err) {
    record.status = 'failed';
    record.error = err.message;
    await record.save();
    await fsp.rm(file, { force: true });
    throw err;
  }
}

async function* readBackup(file) {
  const input = fs.createReadStream(file).pipe(zlib.createGunzip());
  const lines = readline.createInterface({ input, crlfDelay: Infinity });
  for await (const line of lines) {
    if (line.trim()) yield EJSON.parse(line, { relaxed: false });
  }
}

export async function verifyBackup(record) {
  const counts = {};
  let meta = null;
  let end = null;
  try {
    for await (const entry of readBackup(backupFilePath(record))) {
      if (entry.meta) meta = entry.meta;
      else if (entry.end) end = entry;
      else if (entry.c) counts[entry.c] = (counts[entry.c] || 0) + 1;
    }
  } catch (err) {
    return { ok: false, message: `Backup file is unreadable: ${err.message}`, counts };
  }
  if (!meta || !end) return { ok: false, message: 'Backup file is incomplete (missing header or end marker)', counts };
  // Canonical EJSON keeps exact BSON number types (Int32/Double), so compare numerically.
  const mismatched = end.collections.filter((c) => (counts[c.name] || 0) !== Number(c.count));
  if (mismatched.length) {
    return { ok: false, message: `Document counts do not match for: ${mismatched.map((m) => m.name).join(', ')}`, counts };
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return { ok: true, message: `Verified ${total} documents across ${end.collections.length} collections`, counts };
}

export async function restoreBackup(record, { admin } = {}) {
  const check = await verifyBackup(record);
  if (!check.ok) throw Object.assign(new Error(`Restore aborted: ${check.message}`), { status: 400 });

  const safety = await createBackup({ type: 'pre-restore', admin });
  const db = mongoose.connection.db;
  const restored = [];
  let current = null;
  let batch = [];
  let count = 0;

  const flush = async () => {
    if (current && batch.length) await db.collection(current).insertMany(batch, { ordered: false });
    batch = [];
  };

  for await (const entry of readBackup(backupFilePath(record))) {
    if (!entry.c || SKIPPED_ON_RESTORE.has(entry.c)) continue;
    if (entry.c !== current) {
      await flush();
      if (current) restored.push({ name: current, count });
      current = entry.c;
      count = 0;
      await db.collection(current).deleteMany({});
    }
    batch.push(entry.d);
    count += 1;
    if (batch.length >= 500) await flush();
  }
  await flush();
  if (current) restored.push({ name: current, count });

  record.restoredAt = new Date();
  await record.save();
  cache.invalidate();
  return { restored, safetyBackup: safety.filename };
}

export async function deleteBackup(record) {
  await fsp.rm(backupFilePath(record), { force: true });
  if (record.external?.provider === 'directory' && record.external.location) {
    await fsp.rm(record.external.location, { force: true }).catch(() => {});
  }
  await record.deleteOne();
}

export function scheduleBackups() {
  if (!env.BACKUP_ENABLED || env.isTest) return null;
  if (!cron.validate(env.BACKUP_CRON)) {
    console.error(`[backup] invalid BACKUP_CRON "${env.BACKUP_CRON}" — automatic backups disabled`);
    return null;
  }
  const task = cron.schedule(
    env.BACKUP_CRON,
    async () => {
      try {
        const record = await createBackup({ type: 'auto' });
        console.log(`[backup] daily backup completed: ${record.filename} (${record.bytes} bytes)`);
      } catch (err) {
        console.error('[backup] daily backup failed:', err.message);
      }
    },
    { timezone: env.BACKUP_TIMEZONE, name: 'pms-daily-backup', noOverlap: true },
  );
  console.log(`[backup] automatic backups scheduled (${env.BACKUP_CRON}, ${env.BACKUP_TIMEZONE})`);
  return task;
}
