import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { env } from '../config/env.js';

const skipInTests = () => env.isTest && !process.env.TEST_RATE_LIMIT;
const message = (text) => ({ error: { message: text } });

export const apiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 600,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: skipInTests,
  message: message('Too many requests. Please slow down.'),
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: skipInTests,
  keyGenerator: (req) => `${ipKeyGenerator(req.ip || '')}:${String(req.body?.email || '').toLowerCase()}`,
  message: message('Too many sign-in attempts. Try again in 15 minutes.'),
});

export const twoFactorLimiter = rateLimit({
  windowMs: 10 * 60_000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: skipInTests,
  message: message('Too many verification attempts. Try again later.'),
});

export const searchLimiter = rateLimit({
  windowMs: 60_000,
  limit: 120,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: skipInTests,
  message: message('Too many searches. Please wait a moment.'),
});
