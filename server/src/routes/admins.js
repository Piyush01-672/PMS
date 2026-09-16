import express from 'express';
import { z } from 'zod';
import { ROLES, passwordError } from '../lib/permissions.js';
import { isObjectId } from '../lib/request.js';
import { Admin, Session } from '../models/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ApiError } from '../middleware/error.js';
import { logActivity } from '../services/activity.js';

const router = express.Router();
router.use(requireAuth, requireRole('superadmin'));

const assertPassword = (password, email) => {
  const problem = passwordError(password, email);
  if (problem) throw new ApiError(400, problem);
};

async function loadTarget(id) {
  if (!isObjectId(id)) throw new ApiError(400, 'Invalid id');
  const admin = await Admin.findById(id);
  if (!admin) throw new ApiError(404, 'Admin not found');
  return admin;
}

async function assertNotLastSuperadmin(admin) {
  if (admin.role !== 'superadmin') return;
  const others = await Admin.countDocuments({ _id: { $ne: admin._id }, role: 'superadmin', isActive: true });
  if (others === 0) throw new ApiError(409, 'At least one active owner (superadmin) account must remain');
}

router.get('/', async (req, res) => {
  const admins = await Admin.find().sort({ createdAt: 1 });
  const sessions = await Session.aggregate([{ $group: { _id: '$admin', count: { $sum: 1 } } }]);
  const counts = Object.fromEntries(sessions.map((s) => [String(s._id), s.count]));
  res.json({ items: admins.map((a) => ({ ...a.toSafeJSON(), activeSessions: counts[String(a._id)] || 0 })) });
});

router.post('/', async (req, res) => {
  const body = z
    .object({
      name: z.string().trim().min(2).max(120),
      email: z.string().trim().toLowerCase().email().max(200),
      role: z.enum(ROLES),
      password: z.string().min(1).max(200),
    })
    .parse(req.body);
  assertPassword(body.password, body.email);
  const admin = new Admin({ name: body.name, email: body.email, role: body.role, createdBy: req.admin._id });
  await admin.setPassword(body.password);
  await admin.save();
  await logActivity(req, { action: 'admin_create', entityType: 'Admin', entityId: admin._id, entityLabel: admin.email, severity: 'warning', meta: { role: admin.role } });
  res.status(201).json(admin.toSafeJSON());
});

router.put('/:id', async (req, res) => {
  const admin = await loadTarget(req.params.id);
  const body = z
    .object({
      name: z.string().trim().min(2).max(120).optional(),
      role: z.enum(ROLES).optional(),
      isActive: z.boolean().optional(),
      password: z.string().max(200).optional(),
    })
    .parse(req.body);

  const isSelf = String(admin._id) === String(req.admin._id);
  if ((body.role && body.role !== 'superadmin') || body.isActive === false) {
    if (isSelf) throw new ApiError(409, 'You cannot remove your own owner access or deactivate yourself');
    await assertNotLastSuperadmin(admin);
  }
  if (body.name) admin.name = body.name;
  if (body.role) admin.role = body.role;
  if (body.isActive !== undefined) admin.isActive = body.isActive;
  if (body.password) {
    assertPassword(body.password, admin.email);
    await admin.setPassword(body.password);
  }
  await admin.save();
  if (body.password || body.isActive === false || body.role) await Session.deleteMany({ admin: admin._id, ...(isSelf ? { sid: { $ne: req.adminSession.sid } } : {}) });
  await logActivity(req, {
    action: 'admin_update',
    entityType: 'Admin',
    entityId: admin._id,
    entityLabel: admin.email,
    severity: 'warning',
    meta: { role: body.role, isActive: body.isActive, passwordReset: Boolean(body.password) },
  });
  res.json(admin.toSafeJSON());
});

router.post('/:id/unlock', async (req, res) => {
  const admin = await loadTarget(req.params.id);
  admin.failedLoginAttempts = 0;
  admin.lockUntil = undefined;
  await admin.save();
  await logActivity(req, { action: 'admin_update', entityType: 'Admin', entityId: admin._id, entityLabel: admin.email, meta: { unlocked: true } });
  res.json(admin.toSafeJSON());
});

router.post('/:id/reset-2fa', async (req, res) => {
  const admin = await loadTarget(req.params.id);
  admin.totpEnabled = false;
  admin.totpSecretEnc = undefined;
  admin.totpPendingSecretEnc = undefined;
  await admin.save();
  await Session.deleteMany({ admin: admin._id });
  await logActivity(req, { action: '2fa_disabled', entityType: 'Admin', entityId: admin._id, entityLabel: admin.email, severity: 'critical', meta: { resetBy: req.admin.email } });
  res.json(admin.toSafeJSON());
});

router.delete('/:id', async (req, res) => {
  const admin = await loadTarget(req.params.id);
  if (String(admin._id) === String(req.admin._id)) throw new ApiError(409, 'You cannot delete your own account');
  await assertNotLastSuperadmin(admin);
  await Session.deleteMany({ admin: admin._id });
  await admin.deleteOne();
  await logActivity(req, { action: 'admin_delete', entityType: 'Admin', entityId: admin._id, entityLabel: admin.email, severity: 'critical' });
  res.json({ ok: true });
});

export default router;
