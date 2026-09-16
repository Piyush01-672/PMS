import bcrypt from 'bcryptjs';
import express from 'express';
import jwt from 'jsonwebtoken';
import { generateSecret, generateURI, verify } from 'otplib';
import QRCode from 'qrcode';
import { z } from 'zod';
import { env } from '../config/env.js';
import { decrypt, encrypt, randomToken } from '../lib/crypto.js';
import { passwordError, permissionsFor } from '../lib/permissions.js';
import { clientIp } from '../lib/request.js';
import { Admin, Session } from '../models/index.js';
import { JWT_OPTIONS, SESSION_COOKIE, requireAuth } from '../middleware/auth.js';
import { csrfTokenFor } from '../middleware/csrf.js';
import { ApiError } from '../middleware/error.js';
import { loginLimiter, twoFactorLimiter } from '../middleware/rateLimits.js';
import { logActivity } from '../services/activity.js';

const router = express.Router();
const DUMMY_HASH = bcrypt.hashSync('pms-timing-equalizer-password', 12);
const ISSUER = 'Passion Maths Study';

const cookieOptions = () => ({
  httpOnly: true,
  secure: env.isProd,
  sameSite: 'strict',
  path: '/',
  maxAge: env.SESSION_ABSOLUTE_HOURS * 3_600_000,
});

function sessionPayload(admin, sid) {
  return {
    admin: admin.toSafeJSON(),
    permissions: permissionsFor(admin.role),
    csrfToken: csrfTokenFor(sid),
    sessionIdleMinutes: env.SESSION_IDLE_MINUTES,
    mustEnroll2fa: env.REQUIRE_2FA && !admin.totpEnabled,
  };
}

async function startSession(req, res, admin) {
  const sid = randomToken(24);
  await Session.create({
    admin: admin._id,
    sid,
    ip: clientIp(req),
    userAgent: req.get('user-agent')?.slice(0, 300),
    lastSeenAt: new Date(),
    expiresAt: new Date(Date.now() + env.SESSION_ABSOLUTE_HOURS * 3_600_000),
  });
  const token = jwt.sign({ sub: String(admin._id), sid }, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: `${env.SESSION_ABSOLUTE_HOURS}h`,
    ...JWT_OPTIONS,
  });
  res.cookie(SESSION_COOKIE, token, cookieOptions());

  admin.failedLoginAttempts = 0;
  admin.lockUntil = undefined;
  admin.lastLoginAt = new Date();
  admin.lastLoginIp = clientIp(req);
  await admin.save();
  await logActivity(req, { action: 'login', admin, entityType: 'Admin', entityId: admin._id, entityLabel: admin.email });
  return sessionPayload(admin, sid);
}

async function registerFailure(req, admin, reason) {
  admin.failedLoginAttempts = (admin.failedLoginAttempts || 0) + 1;
  if (admin.failedLoginAttempts >= env.LOGIN_MAX_ATTEMPTS) {
    admin.lockUntil = new Date(Date.now() + env.LOGIN_LOCK_MINUTES * 60_000);
    admin.failedLoginAttempts = 0;
    await admin.save();
    await logActivity(req, {
      action: 'login_locked',
      admin,
      entityType: 'Admin',
      entityId: admin._id,
      entityLabel: admin.email,
      severity: 'critical',
      meta: { reason },
    });
    return;
  }
  await admin.save();
  await logActivity(req, {
    action: 'login_failed',
    admin,
    entityType: 'Admin',
    entityId: admin._id,
    entityLabel: admin.email,
    severity: 'warning',
    meta: { reason, attempts: admin.failedLoginAttempts },
  });
}

const lockedError = (admin) => {
  const minutes = Math.max(1, Math.ceil((admin.lockUntil.getTime() - Date.now()) / 60_000));
  return new ApiError(423, `Too many failed attempts. This account is locked for ${minutes} more minute(s).`);
};

async function verifyTotp(admin, code, secretField = 'totpSecretEnc') {
  const token = String(code || '').replace(/\s+/g, '');
  if (!/^\d{6}$/.test(token) || !admin[secretField]) return false;
  const { valid } = await verify({ secret: decrypt(admin[secretField]), token, epochTolerance: 30 });
  return valid;
}

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(1).max(200),
});

router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const admin = await Admin.findOne({ email }).select('+passwordHash');
  const invalid = new ApiError(401, 'Invalid email or password');

  if (!admin) {
    await bcrypt.compare(password, DUMMY_HASH);
    await logActivity(req, { action: 'login_failed', severity: 'warning', entityType: 'Admin', entityLabel: email, meta: { reason: 'unknown_email' } });
    throw invalid;
  }
  if (admin.isLocked()) {
    await logActivity(req, { action: 'login_failed', admin, severity: 'warning', entityType: 'Admin', entityId: admin._id, entityLabel: email, meta: { reason: 'locked' } });
    throw lockedError(admin);
  }
  if (!(await admin.verifyPassword(password))) {
    await registerFailure(req, admin, 'bad_password');
    throw invalid;
  }
  if (!admin.isActive) {
    await logActivity(req, { action: 'login_failed', admin, severity: 'warning', entityType: 'Admin', entityId: admin._id, entityLabel: email, meta: { reason: 'inactive' } });
    throw invalid;
  }

  if (admin.totpEnabled) {
    const challenge = jwt.sign({ sub: String(admin._id), typ: '2fa' }, env.JWT_SECRET, {
      algorithm: 'HS256',
      expiresIn: '5m',
      issuer: 'pms',
      audience: 'pms-2fa',
    });
    return res.json({ twoFactorRequired: true, challenge });
  }
  res.json(await startSession(req, res, admin));
});

router.post('/2fa/verify', twoFactorLimiter, async (req, res) => {
  const { challenge, code } = z.object({ challenge: z.string().min(10).max(2000), code: z.string().min(6).max(10) }).parse(req.body);
  let payload;
  try {
    payload = jwt.verify(challenge, env.JWT_SECRET, { algorithms: ['HS256'], issuer: 'pms', audience: 'pms-2fa' });
  } catch {
    throw new ApiError(401, 'Verification expired. Please sign in again.');
  }
  const admin = await Admin.findById(payload.sub).select('+totpSecretEnc');
  if (!admin || !admin.isActive || !admin.totpEnabled) throw new ApiError(401, 'Verification failed. Please sign in again.');
  if (admin.isLocked()) throw lockedError(admin);
  if (!(await verifyTotp(admin, code))) {
    await registerFailure(req, admin, 'bad_2fa_code');
    throw new ApiError(401, 'Invalid verification code');
  }
  res.json(await startSession(req, res, admin));
});

router.post('/logout', async (req, res) => {
  const { readSessionToken } = await import('../middleware/auth.js');
  const payload = readSessionToken(req);
  if (payload?.sid) {
    const session = await Session.findOneAndDelete({ sid: payload.sid });
    if (session) {
      const admin = await Admin.findById(session.admin);
      if (admin) await logActivity(req, { action: 'logout', admin, entityType: 'Admin', entityId: admin._id, entityLabel: admin.email });
    }
  }
  res.clearCookie(SESSION_COOKIE, { ...cookieOptions(), maxAge: undefined });
  res.json({ ok: true });
});

router.get('/me', requireAuth, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(sessionPayload(req.admin, req.adminSession.sid));
});

router.post('/password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = z
    .object({ currentPassword: z.string().min(1).max(200), newPassword: z.string().min(1).max(200) })
    .parse(req.body);
  const admin = await Admin.findById(req.admin._id).select('+passwordHash');
  if (!(await admin.verifyPassword(currentPassword))) throw new ApiError(400, 'Current password is incorrect');
  const problem = passwordError(newPassword, admin.email);
  if (problem) throw new ApiError(400, problem);
  await admin.setPassword(newPassword);
  await admin.save();
  await Session.deleteMany({ admin: admin._id, sid: { $ne: req.adminSession.sid } });
  await logActivity(req, { action: 'password_change', entityType: 'Admin', entityId: admin._id, entityLabel: admin.email, severity: 'warning' });
  res.json({ ok: true });
});

router.post('/logout-others', requireAuth, async (req, res) => {
  const { deletedCount } = await Session.deleteMany({ admin: req.admin._id, sid: { $ne: req.adminSession.sid } });
  res.json({ ok: true, revoked: deletedCount });
});

router.post('/2fa/setup', requireAuth, async (req, res) => {
  const admin = await Admin.findById(req.admin._id);
  if (admin.totpEnabled) throw new ApiError(400, 'Two-factor authentication is already enabled');
  const secret = generateSecret();
  admin.totpPendingSecretEnc = encrypt(secret);
  await admin.save();
  const otpauthUrl = generateURI({ issuer: ISSUER, label: admin.email, secret });
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl, { margin: 1, width: 240 });
  res.set('Cache-Control', 'no-store');
  res.json({ otpauthUrl, qrDataUrl, secret });
});

router.post('/2fa/enable', requireAuth, async (req, res) => {
  const { code } = z.object({ code: z.string().min(6).max(10) }).parse(req.body);
  const admin = await Admin.findById(req.admin._id).select('+totpPendingSecretEnc');
  if (!admin.totpPendingSecretEnc) throw new ApiError(400, 'Start two-factor setup first');
  if (!(await verifyTotp(admin, code, 'totpPendingSecretEnc'))) throw new ApiError(400, 'Invalid code. Check the time on your phone and try again.');
  admin.totpSecretEnc = admin.totpPendingSecretEnc;
  admin.totpPendingSecretEnc = undefined;
  admin.totpEnabled = true;
  await admin.save();
  await logActivity(req, { action: '2fa_enabled', entityType: 'Admin', entityId: admin._id, entityLabel: admin.email });
  res.json({ ok: true, totpEnabled: true });
});

router.post('/2fa/disable', requireAuth, async (req, res) => {
  if (env.REQUIRE_2FA) throw new ApiError(403, 'Two-factor authentication is required for all admins on this site');
  const { password, code } = z.object({ password: z.string().min(1).max(200), code: z.string().min(6).max(10) }).parse(req.body);
  const admin = await Admin.findById(req.admin._id).select('+passwordHash +totpSecretEnc');
  if (!(await admin.verifyPassword(password))) throw new ApiError(400, 'Password is incorrect');
  if (!(await verifyTotp(admin, code))) throw new ApiError(400, 'Invalid verification code');
  admin.totpEnabled = false;
  admin.totpSecretEnc = undefined;
  await admin.save();
  await logActivity(req, { action: '2fa_disabled', entityType: 'Admin', entityId: admin._id, entityLabel: admin.email, severity: 'critical' });
  res.json({ ok: true, totpEnabled: false });
});

export default router;
