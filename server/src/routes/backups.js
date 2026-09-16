import express from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { isObjectId } from '../lib/request.js';
import { Admin, Backup } from '../models/index.js';
import { requireAuth, requirePermission, requireRole } from '../middleware/auth.js';
import { ApiError } from '../middleware/error.js';
import { logActivity } from '../services/activity.js';
import { backupFilePath, createBackup, deleteBackup, restoreBackup, verifyBackup } from '../services/backup.js';

const router = express.Router();

async function loadBackup(id) {
  if (!isObjectId(id)) throw new ApiError(400, 'Invalid id');
  const record = await Backup.findById(id);
  if (!record) throw new ApiError(404, 'Backup not found');
  return record;
}

router.get('/', requireAuth, requirePermission('backup:read'), async (req, res) => {
  const items = await Backup.find().sort({ createdAt: -1 }).limit(200).populate({ path: 'createdBy', select: 'name' }).lean();
  res.set('Cache-Control', 'no-store');
  res.json({
    items,
    config: {
      enabled: env.BACKUP_ENABLED,
      cron: env.BACKUP_CRON,
      timezone: env.BACKUP_TIMEZONE,
      retentionDays: env.BACKUP_RETENTION_DAYS,
      externalDirectory: Boolean(env.BACKUP_EXTERNAL_DIR),
      cloudinaryCopy: env.BACKUP_CLOUDINARY && env.cloudinaryConfigured,
      storageProvider: env.storageProvider,
      includeUploads: env.BACKUP_INCLUDE_UPLOADS,
    },
  });
});

router.post('/', requireAuth, requirePermission('backup:create'), async (req, res) => {
  const record = await createBackup({ type: 'manual', admin: req.admin });
  await logActivity(req, { action: 'backup_create', entityType: 'Backup', entityId: record._id, entityLabel: record.filename, meta: { bytes: record.bytes, external: record.external?.status } });
  res.status(201).json(record);
});

router.post('/:id/verify', requireAuth, requirePermission('backup:read'), async (req, res) => {
  const record = await loadBackup(req.params.id);
  const result = await verifyBackup(record);
  record.verifiedAt = new Date();
  record.verifyResult = result.message;
  await record.save();
  await logActivity(req, { action: 'backup_verify', entityType: 'Backup', entityId: record._id, entityLabel: record.filename, severity: result.ok ? 'info' : 'warning', meta: { ok: result.ok } });
  res.json(result);
});

router.get('/:id/download', requireAuth, requireRole('superadmin'), async (req, res) => {
  const record = await loadBackup(req.params.id);
  await logActivity(req, { action: 'backup_download', entityType: 'Backup', entityId: record._id, entityLabel: record.filename, severity: 'warning' });
  res.download(backupFilePath(record), record.filename);
});

router.post('/:id/restore', requireAuth, requireRole('superadmin'), async (req, res) => {
  const { password, confirm } = z.object({ password: z.string().min(1).max(200), confirm: z.literal('RESTORE') }).parse(req.body);
  const admin = await Admin.findById(req.admin._id).select('+passwordHash');
  if (!(await admin.verifyPassword(password))) throw new ApiError(400, 'Password is incorrect');
  const record = await loadBackup(req.params.id);
  if (record.status !== 'completed') throw new ApiError(400, 'Only completed backups can be restored');
  void confirm;
  const result = await restoreBackup(record, { admin: req.admin });
  await logActivity(req, { action: 'backup_restore', entityType: 'Backup', entityId: record._id, entityLabel: record.filename, severity: 'critical', meta: result });
  res.json(result);
});

router.delete('/:id', requireAuth, requireRole('superadmin'), async (req, res) => {
  const record = await loadBackup(req.params.id);
  await deleteBackup(record);
  await logActivity(req, { action: 'backup_delete', entityType: 'Backup', entityId: record._id, entityLabel: record.filename, severity: 'warning' });
  res.json({ ok: true });
});

export default router;
