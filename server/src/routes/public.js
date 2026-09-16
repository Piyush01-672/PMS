import express from 'express';
import { cache } from '../lib/cache.js';
import { asString, isObjectId } from '../lib/request.js';
import { AdSlot, SiteSettings } from '../models/index.js';
import { optionalAuth, requireAuth, requirePermission } from '../middleware/auth.js';
import { ApiError } from '../middleware/error.js';
import { searchLimiter } from '../middleware/rateLimits.js';
import { stripProtected } from '../services/crud.js';
import { buildHome } from '../services/home.js';
import { savePreview } from '../services/previewStore.js';
import { resolvePath } from '../services/publicContent.js';
import { search } from '../services/search.js';
import { getSiteBootstrap } from '../services/site.js';

const router = express.Router();
// Browsers must revalidate (cheap 304 via ETag) so admin changes appear immediately; the server cache is cleared on every save.
const FRESH = 'public, no-cache';
const PREVIEW_TYPES = new Set(['Class', 'Chapter', 'Exercise', 'Question', 'Note', 'Page']);

const isPreview = (req) => req.query.preview === '1' && Boolean(req.admin);
const intParam = (value, fallback) => Math.max(1, Number.parseInt(value, 10) || fallback);

router.get('/site', async (req, res) => {
  res.set('Cache-Control', FRESH);
  res.json(await getSiteBootstrap());
});

router.get('/home', optionalAuth, async (req, res) => {
  const preview = isPreview(req);
  res.set('Cache-Control', preview ? 'no-store' : FRESH);
  res.json(await buildHome(preview));
});

router.get('/resolve', optionalAuth, async (req, res) => {
  const path = asString(req.query.path, 500) || '/';
  const page = intParam(req.query.page, 1);
  const preview = isPreview(req);
  const data = preview
    ? await resolvePath(path, { preview, page, previewToken: asString(req.query.previewToken, 60) })
    : await cache.wrap(`resolve:${path.replace(/\/+$/, '') || '/'}:${page}`, 60_000, () => resolvePath(path, { page }));
  res.set('Cache-Control', preview ? 'no-store' : FRESH);
  res.json(data);
});

export async function searchHandler(req, res) {
  const data = await search({
    q: asString(req.query.q, 200),
    type: asString(req.query.type, 30) || undefined,
    classNumber: asString(req.query.class, 3) || undefined,
    page: intParam(req.query.page, 1),
    limit: Number.parseInt(req.query.limit, 10) || 20,
  });
  res.set('Cache-Control', FRESH);
  res.json(data);
}

router.get('/search', searchLimiter, searchHandler);

router.get('/suggest', searchLimiter, async (req, res) => {
  const q = asString(req.query.q, 100);
  if (q.trim().length < 2) return res.json({ results: [] });
  const data = await cache.wrap(`suggest:${q.toLowerCase()}`, 30_000, () => search({ q, limit: 8 }));
  res.json({ results: data.results, total: data.total });
});

// Stores unsaved editor changes so the admin can preview exactly how the page will look.
router.post('/preview', requireAuth, requirePermission('content:read'), async (req, res) => {
  const { entityType, id, data, solution } = req.body || {};
  if (!PREVIEW_TYPES.has(entityType) || !isObjectId(id)) throw new ApiError(400, 'Invalid preview request');
  const token = savePreview({
    entityType,
    id,
    data: stripProtected(data || {}, ['slug', 'status', 'publishedAt', 'class', 'subject', 'chapter', 'exercise']),
    solution: entityType === 'Question' && solution ? { blocks: solution.blocks || [], languageMode: solution.languageMode } : null,
  });
  res.json({ token });
});

// Advertisement code runs on its own document inside a sandboxed iframe (no access to the study page).
router.get('/ad-frame/:id', async (req, res) => {
  if (!isObjectId(req.params.id)) throw new ApiError(404, 'Not found');
  const [settings, slot] = await Promise.all([SiteSettings.getSingleton(), AdSlot.findById(req.params.id).lean()]);
  if (!settings.ads?.enabled || !slot?.isEnabled) throw new ApiError(404, 'Not found');
  res.set(
    'Content-Security-Policy',
    "default-src 'none'; script-src https: 'unsafe-inline'; img-src https: data:; style-src https: 'unsafe-inline'; frame-src https:; connect-src https:; font-src https: data:",
  );
  res.set('Cache-Control', 'public, max-age=300');
  res.set('X-Robots-Tag', 'noindex');
  res
    .type('html')
    .send(
      `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;padding:0;background:transparent;overflow:hidden;display:flex;justify-content:center;align-items:center;min-height:100%}</style></head><body>${slot.code}</body></html>`,
    );
});

export default router;
