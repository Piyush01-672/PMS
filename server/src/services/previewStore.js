import { randomToken } from '../lib/crypto.js';

// Unsaved editor state for "Preview" — lives in memory for 15 minutes, never touches the database.
const TTL = 15 * 60_000;
const MAX = 300;
const store = new Map();

export function savePreview(entry) {
  const now = Date.now();
  for (const [key, value] of store) if (value.expires < now) store.delete(key);
  if (store.size >= MAX) store.delete(store.keys().next().value);
  const token = randomToken(18);
  store.set(token, { ...entry, expires: now + TTL });
  return token;
}

export function getPreview(token) {
  if (!token) return null;
  const entry = store.get(String(token));
  if (!entry) return null;
  if (entry.expires < Date.now()) {
    store.delete(String(token));
    return null;
  }
  return entry;
}
