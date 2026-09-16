import express from 'express';
import { asString, isObjectId, parsePagination } from '../lib/request.js';
import { ACTIVITY_ACTIONS, ActivityLog } from '../models/index.js';
import { requireAuth, requirePermission } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, requirePermission('activity:read'), async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 50, maxLimit: 200 });
  const filter = {};
  const action = asString(req.query.action, 40);
  if (ACTIVITY_ACTIONS.includes(action)) filter.action = action;
  if (action === 'security') filter.action = { $in: ['login', 'logout', 'login_failed', 'login_locked', '2fa_enabled', '2fa_disabled', 'password_change'] };
  if (['info', 'warning', 'critical'].includes(req.query.severity)) filter.severity = req.query.severity;
  if (isObjectId(req.query.admin)) filter.admin = req.query.admin;
  const entityType = asString(req.query.entityType, 40);
  if (entityType) filter.entityType = entityType;
  const from = req.query.from ? new Date(asString(req.query.from, 40)) : null;
  const to = req.query.to ? new Date(asString(req.query.to, 40)) : null;
  if ((from && !Number.isNaN(from.getTime())) || (to && !Number.isNaN(to.getTime()))) {
    filter.createdAt = {};
    if (from && !Number.isNaN(from.getTime())) filter.createdAt.$gte = from;
    if (to && !Number.isNaN(to.getTime())) filter.createdAt.$lte = to;
  }
  const [items, total] = await Promise.all([
    ActivityLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ActivityLog.countDocuments(filter),
  ]);
  res.set('Cache-Control', 'no-store');
  res.json({ items, total, page, limit, pages: Math.ceil(total / limit) || 1, actions: ACTIVITY_ACTIONS });
});

export default router;
