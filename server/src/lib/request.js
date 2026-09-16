export function clientIp(req) {
  return req.ip || req.socket?.remoteAddress || '';
}

export function parsePagination(query, { defaultLimit = 20, maxLimit = 100 } = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, Number.parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}

export function isObjectId(value) {
  return typeof value === 'string' && /^[a-f0-9]{24}$/i.test(value);
}

export function asString(value, max = 200) {
  if (value === undefined || value === null) return '';
  return String(Array.isArray(value) ? value[0] : value).slice(0, max);
}
