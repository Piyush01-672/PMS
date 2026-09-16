// Removes MongoDB operator keys ($gt, $where, …) and prototype-pollution keys from all user input.
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function clean(value, depth = 0) {
  if (depth > 25) return undefined;
  if (Array.isArray(value)) return value.map((v) => clean(v, depth + 1));
  if (value && typeof value === 'object' && !(value instanceof Date) && !Buffer.isBuffer(value)) {
    const out = {};
    for (const [key, v] of Object.entries(value)) {
      if (key.startsWith('$') || key.includes('.') || FORBIDDEN_KEYS.has(key)) continue;
      out[key] = clean(v, depth + 1);
    }
    return out;
  }
  return value;
}

export function sanitizeInput(req, res, next) {
  if (req.body && typeof req.body === 'object') req.body = clean(req.body);
  if (req.params) req.params = clean(req.params);
  // Express 5 exposes req.query as a getter; replace it with a sanitized plain object.
  Object.defineProperty(req, 'query', {
    value: clean({ ...req.query }),
    writable: true,
    configurable: true,
    enumerable: true,
  });
  next();
}
