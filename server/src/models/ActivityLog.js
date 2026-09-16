import mongoose from 'mongoose';
import { ObjectId } from './schemas/common.js';

export const ACTIVITY_ACTIONS = [
  'login',
  'logout',
  'login_failed',
  'login_locked',
  '2fa_enabled',
  '2fa_disabled',
  'password_change',
  'session_expired',
  'create',
  'update',
  'delete',
  'publish',
  'unpublish',
  'archive',
  'duplicate',
  'reorder',
  'media_upload',
  'media_replace',
  'media_delete',
  'settings_update',
  'admin_create',
  'admin_update',
  'admin_delete',
  'backup_create',
  'backup_verify',
  'backup_restore',
  'backup_download',
  'backup_delete',
];

const activityLogSchema = new mongoose.Schema(
  {
    admin: { type: ObjectId, ref: 'Admin', index: true },
    adminName: String,
    adminEmail: String,
    action: { type: String, enum: ACTIVITY_ACTIONS, required: true, index: true },
    entityType: { type: String, index: true },
    entityId: ObjectId,
    entityLabel: String,
    severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'info', index: true },
    meta: mongoose.Schema.Types.Mixed,
    ip: String,
    userAgent: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 400 });

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
