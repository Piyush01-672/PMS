import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { hasPermission } from '../lib/permissions.js';
import { Admin } from '../models/Admin.js';
import { Session } from '../models/Session.js';
import { ApiError } from './error.js';

export const SESSION_COOKIE = 'pms_session';
export const JWT_OPTIONS = { issuer: 'pms', audience: 'pms-admin' };

export function readSessionToken(req) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return null;
  try {
    return jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'], ...JWT_OPTIONS });
  } catch {
    return null;
  }
}

async function loadAdmin(req) {
  if (req.authChecked) return req.admin;
  req.authChecked = true;

  const payload = readSessionToken(req);
  if (!payload?.sid) return null;

  const session = await Session.findOne({ sid: payload.sid });
  if (!session || String(session.admin) !== String(payload.sub)) return null;

  const now = Date.now();
  const idleMs = env.SESSION_IDLE_MINUTES * 60_000;
  if (session.expiresAt.getTime() <= now || now - session.lastSeenAt.getTime() > idleMs) {
    await session.deleteOne();
    req.sessionExpired = true;
    return null;
  }

  const admin = await Admin.findById(session.admin);
  if (!admin || !admin.isActive) {
    await session.deleteOne();
    return null;
  }

  if (now - session.lastSeenAt.getTime() > 60_000) {
    session.lastSeenAt = new Date(now);
    await session.save();
  }

  req.admin = admin;
  req.adminSession = session;
  return admin;
}

export async function optionalAuth(req, res, next) {
  await loadAdmin(req);
  next();
}

// When REQUIRE_2FA is on, an admin without an authenticator can only reach /api/auth/* (to enrol).
const twoFactorPending = (req, admin) =>
  env.REQUIRE_2FA && !admin.totpEnabled && !req.originalUrl.startsWith('/api/auth');

export async function requireAuth(req, res, next) {
  const admin = await loadAdmin(req);
  if (!admin) {
    return next(new ApiError(401, req.sessionExpired ? 'Session expired. Please sign in again.' : 'Authentication required'));
  }
  if (twoFactorPending(req, admin)) return next(new ApiError(403, 'Set up two-factor authentication to continue'));
  next();
}

export const requirePermission = (permission) => async (req, res, next) => {
  const admin = await loadAdmin(req);
  if (!admin) return next(new ApiError(401, 'Authentication required'));
  if (twoFactorPending(req, admin)) return next(new ApiError(403, 'Set up two-factor authentication to continue'));
  if (!hasPermission(admin.role, permission)) {
    return next(new ApiError(403, 'You do not have permission to perform this action'));
  }
  next();
};

export const requireRole = (...roles) => async (req, res, next) => {
  const admin = await loadAdmin(req);
  if (!admin) return next(new ApiError(401, 'Authentication required'));
  if (!roles.includes(admin.role)) return next(new ApiError(403, 'Insufficient role'));
  next();
};
