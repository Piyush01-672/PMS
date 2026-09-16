import { clientIp } from '../lib/request.js';
import { ActivityLog } from '../models/ActivityLog.js';

export function labelOf(doc) {
  if (!doc) return '';
  const pick = (v) => (v && typeof v === 'object' ? v.en || v.hi || v.mixed : v);
  const parts = [];
  if (doc.number !== undefined && doc.number !== null) parts.push(`#${doc.number}`);
  const title = pick(doc.title) || pick(doc.name) || doc.email || doc.originalName || doc.filename || doc.key;
  if (title) parts.push(title);
  return parts.join(' ').slice(0, 200);
}

export async function logActivity(req, { action, entityType, entityId, entityLabel, severity = 'info', meta, admin }) {
  try {
    const actor = admin || req?.admin;
    await ActivityLog.create({
      admin: actor?._id,
      adminName: actor?.name,
      adminEmail: actor?.email,
      action,
      entityType,
      entityId,
      entityLabel: entityLabel ? String(entityLabel).slice(0, 200) : undefined,
      severity,
      meta,
      ip: req ? clientIp(req) : undefined,
      userAgent: req?.get?.('user-agent')?.slice(0, 300),
    });
  } catch (err) {
    console.error('[activity] failed to record', action, err.message);
  }
}
