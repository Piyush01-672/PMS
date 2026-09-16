import { env } from '../config/env.js';
import { hmac, safeEqual } from '../lib/crypto.js';
import { ApiError } from './error.js';
import { readSessionToken } from './auth.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const EXEMPT_PATHS = new Set(['/api/auth/login', '/api/auth/2fa/verify']);

export const csrfTokenFor = (sid) => hmac(`csrf:${sid}`);

function allowedOrigin(origin) {
  if (!origin) return true;
  const allowed = new Set([...env.clientOrigins, new URL(env.PUBLIC_SITE_URL).origin]);
  return allowed.has(origin);
}

// Signed double-submit token bound to the admin session + strict Origin check on state-changing requests.
export function csrfProtection(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();

  if (!allowedOrigin(req.get('origin'))) return next(new ApiError(403, 'Cross-origin request blocked'));
  if (EXEMPT_PATHS.has(req.path)) return next();

  const payload = readSessionToken(req);
  if (!payload?.sid) return next();

  const provided = req.get('x-csrf-token');
  if (!provided || !safeEqual(provided, csrfTokenFor(payload.sid))) {
    return next(new ApiError(403, 'Invalid or missing CSRF token. Refresh the page and try again.'));
  }
  next();
}
