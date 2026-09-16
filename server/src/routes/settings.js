import express from 'express';
import { cache } from '../lib/cache.js';
import { asString } from '../lib/request.js';
import {
  Announcement,
  Chapter,
  ClassLevel,
  Exercise,
  Navigation,
  NAV_KEYS,
  Note,
  Page,
  Question,
  SeoSetting,
  SiteSettings,
} from '../models/index.js';
import { requireAuth, requirePermission } from '../middleware/auth.js';
import { ApiError } from '../middleware/error.js';
import { labelOf, logActivity } from '../services/activity.js';
import { crudRouter } from '../services/crud.js';
import { MEDIA_SELECT } from '../services/populate.js';
import { getSiteBootstrap } from '../services/site.js';

const router = express.Router();

const SETTINGS_SECTIONS = ['brand', 'header', 'footer', 'contact', 'social', 'language', 'terminology', 'theme', 'seo', 'ads'];
const SETTINGS_POPULATE = [
  { path: 'brand.logo', select: MEDIA_SELECT },
  { path: 'brand.footerLogo', select: MEDIA_SELECT },
  { path: 'brand.favicon', select: MEDIA_SELECT },
  { path: 'seo.defaultOgImage', select: MEDIA_SELECT },
];

router.get('/site-settings', async (req, res) => {
  if (req.query.scope === 'admin') {
    await new Promise((resolve, reject) => requireAuth(req, res, (err) => (err ? reject(err) : resolve())));
    const settings = await SiteSettings.getSingleton();
    await settings.populate(SETTINGS_POPULATE);
    return res.json(settings);
  }
  const { settings, terms } = await getSiteBootstrap();
  res.json({ ...settings, terms });
});

router.put('/site-settings', requireAuth, requirePermission('settings:write'), async (req, res) => {
  const settings = await SiteSettings.getSingleton();
  const changed = [];
  for (const key of SETTINGS_SECTIONS) {
    if (req.body?.[key] !== undefined) {
      settings.set(key, req.body[key]);
      changed.push(key);
    }
  }
  if (!changed.length) throw new ApiError(400, 'Nothing to update');
  settings.updatedBy = req.admin._id;
  await settings.save();
  cache.invalidate();
  await logActivity(req, { action: 'settings_update', entityType: 'SiteSettings', entityId: settings._id, entityLabel: changed.join(', ') });
  await settings.populate(SETTINGS_POPULATE);
  res.json(settings);
});

router.get('/navigation', async (req, res) => {
  const docs = await Navigation.find({ key: { $in: NAV_KEYS } }).lean();
  res.json(Object.fromEntries(NAV_KEYS.map((key) => [key, docs.find((d) => d.key === key)?.items || []])));
});

router.get('/navigation/:key', async (req, res) => {
  if (!NAV_KEYS.includes(req.params.key)) throw new ApiError(404, 'Unknown menu');
  const doc = await Navigation.findOne({ key: req.params.key }).lean();
  res.json({ key: req.params.key, items: doc?.items || [] });
});

router.put('/navigation/:key', requireAuth, requirePermission('settings:write'), async (req, res) => {
  if (!NAV_KEYS.includes(req.params.key)) throw new ApiError(404, 'Unknown menu');
  if (!Array.isArray(req.body?.items)) throw new ApiError(400, 'items array is required');
  let doc = await Navigation.findOne({ key: req.params.key });
  if (!doc) doc = new Navigation({ key: req.params.key });
  doc.items = req.body.items;
  doc.updatedBy = req.admin._id;
  await doc.save();
  cache.invalidate();
  await logActivity(req, { action: 'settings_update', entityType: 'Navigation', entityId: doc._id, entityLabel: `${req.params.key} menu` });
  res.json({ key: doc.key, items: doc.items });
});

router.use(
  '/announcements',
  crudRouter(Announcement, {
    entityType: 'Announcement',
    hasStatus: false,
    publicFilters: () => Announcement.activeFilter(),
    writePermission: 'settings:write',
    deletePermission: 'settings:write',
    defaultSort: { sortOrder: 1, createdAt: -1 },
  }),
);

export const SEO_ROUTE_KEYS = [
  { routeKey: 'home', label: 'Homepage' },
  { routeKey: 'search', label: 'Search page' },
];

router.get('/seo-settings', requireAuth, requirePermission('content:read'), async (req, res) => {
  const docs = await SeoSetting.find().populate({ path: 'ogImage', select: MEDIA_SELECT }).lean();
  const items = SEO_ROUTE_KEYS.map((r) => docs.find((d) => d.routeKey === r.routeKey) || { ...r, title: {}, description: {}, robots: 'index,follow' });
  res.json({ items });
});

router.put('/seo-settings/:routeKey', requireAuth, requirePermission('settings:write'), async (req, res) => {
  const known = SEO_ROUTE_KEYS.find((r) => r.routeKey === req.params.routeKey);
  if (!known) throw new ApiError(404, 'Unknown route');
  let doc = await SeoSetting.findOne({ routeKey: known.routeKey });
  if (!doc) doc = new SeoSetting({ routeKey: known.routeKey, label: known.label });
  const { title, description, ogImage, robots, canonical } = req.body || {};
  doc.set({ title, description, ogImage: ogImage?._id || ogImage || undefined, robots, canonical });
  doc.updatedBy = req.admin._id;
  await doc.save();
  cache.invalidate();
  await logActivity(req, { action: 'settings_update', entityType: 'SeoSetting', entityId: doc._id, entityLabel: known.label });
  res.json(doc);
});

// Lists content with missing SEO title / meta description so the admin can fix them quickly.
router.get('/seo/audit', requireAuth, requirePermission('content:read'), async (req, res) => {
  const models = [
    ['Class', ClassLevel, 'classes'],
    ['Chapter', Chapter, 'chapters'],
    ['Exercise', Exercise, 'exercises'],
    ['Question', Question, 'questions'],
    ['Note', Note, 'notes'],
    ['Page', Page, 'pages'],
  ];
  const type = asString(req.query.type, 20);
  const items = [];
  for (const [name, Model, resource] of models) {
    if (type && type !== name) continue;
    const docs = await Model.find({ status: 'published', $or: [{ 'seo.title': { $in: ['', null] } }, { 'seo.description': { $in: ['', null] } }] })
      .select('title name number seo updatedAt')
      .limit(100)
      .lean();
    for (const d of docs) {
      items.push({
        type: name,
        resource,
        id: d._id,
        label: labelOf(d),
        missing: [!d.seo?.title && 'title', !d.seo?.description && 'description'].filter(Boolean),
        updatedAt: d.updatedAt,
      });
    }
  }
  res.json({ items });
});

export default router;
