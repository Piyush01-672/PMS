import crypto from 'node:crypto';
import { env } from '../config/env.js';

const encryptionKey = crypto.createHash('sha256').update(env.ENCRYPTION_KEY).digest();

// AES-256-GCM, used for secrets at rest (e.g. TOTP seeds). Format: iv.tag.ciphertext (base64url)
export function encrypt(plainText) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv);
  const data = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, data].map((b) => b.toString('base64url')).join('.');
}

export function decrypt(payload) {
  const [iv, tag, data] = String(payload).split('.').map((p) => Buffer.from(p, 'base64url'));
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('base64url');

export const hmac = (value, key = env.CSRF_SECRET) =>
  crypto.createHmac('sha256', key).update(String(value)).digest('base64url');

export function safeEqual(a, b) {
  const left = Buffer.from(String(a ?? ''));
  const right = Buffer.from(String(b ?? ''));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}
