import express from 'express';
import mongoose from 'mongoose';
import { cache } from '../lib/cache.js';
import { hasPermission } from '../lib/permissions.js';
import { asString, isObjectId, parsePagination } from '../lib/request.js';
import { optionalAuth, requireAuth, requirePermission } from '../middleware/auth.js';
import { ApiError } from '../middleware/error.js';
import { escapeRegex } from '../utils/slug.js';
import { labelOf, logActivity } from './activity.js';

const PROTECTED_FIELDS = ['_id', '__v', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy', 'searchText'];

export function stripProtected(body = {}, extra = []) {
  const copy = { ...body };
  for (const key of [...PROTECTED_FIELDS, ...extra]) delete copy[key];
  return copy;
}

function statusAction(from, to) {
  if (from === to) return null;
  if (to === 'published') return 'publish';
  if (to === 'archived') return 'archive';
  if (from === 'published') return 'unpublish';
  return null;
}

/**
 * Generic REST resource:
 *   GET    /            public (published only) or ?scope=admin (authenticated, all statuses)
 *   GET    /:id
 *   POST   /            create
 *   PUT    /reorder     { ids: [...] } → sortOrder by position
 *   PUT    /:id         update
 *   PATCH  /:id/status  { status, publishedAt }
 *   POST   /:id/duplicate
 *   DELETE /:id
 */
export function crudRouter(Model, options = {}) {
  const {
    entityType = Model.modelName,
    publicRead = true,
    hasStatus = Boolean(Model.schema.path('status')),
    adminFilters = () => ({}),
    publicFilters = () => ({}),
    populate = {},
    defaultSort = { sortOrder: 1, createdAt: -1 },
    maxLimit = 200,
    readPermission = 'content:read',
    writePermission = 'content:write',
    publishPermission = 'content:publish',
    deletePermission = 'content:delete',
    extraProtected = [],
    beforeWrite,
    afterWrite,
    beforeDelete,
    afterDelete,
    prepareDuplicate,
    serialize = async (doc) => doc,
    extend,
  } = options;

  const router = express.Router();

  const assertPublishRights = (req, fromStatus, toStatus) => {
    if (!hasStatus || !toStatus || fromStatus === toStatus) return;
    const touchesPublished = toStatus === 'published' || fromStatus === 'published';
    if (touchesPublished && !hasPermission(req.admin.role, publishPermission)) {
      throw new ApiError(403, 'Only admins can publish or unpublish content. Save it as a draft instead.');
    }
  };

  const findById = async (rawId, pop) => {
    const id = String(rawId);
    if (!isObjectId(id)) throw new ApiError(400, 'Invalid id');
    let query = Model.findById(id);
    if (pop) query = query.populate(pop);
    const doc = await query;
    if (!doc) throw new ApiError(404, `${entityType} not found`);
    return doc;
  };

  if (extend) extend(router);

  router.get('/', optionalAuth, async (req, res) => {
    const adminScope = req.query.scope === 'admin';
    if (adminScope || !publicRead) {
      if (!req.admin) throw new ApiError(401, 'Authentication required');
      if (!hasPermission(req.admin.role, readPermission)) throw new ApiError(403, 'Forbidden');
    }

    const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 50, maxLimit });
    let filter;
    if (adminScope || !publicRead) {
      filter = { ...(await adminFilters(req.query, req)) };
      if (hasStatus && req.query.status) filter.status = asString(req.query.status, 20);
    } else {
      filter = hasStatus ? Model.publicFilter(await publicFilters(req.query, req)) : await publicFilters(req.query, req);
    }
    const q = asString(req.query.q, 100).trim();
    if (q && Model.schema.path('searchText')) filter.searchText = { $regex: escapeRegex(q), $options: 'i' };

    const sortKey = asString(req.query.sort, 40);
    const sort = sortKey
      ? { [sortKey.replace(/^-/, '')]: sortKey.startsWith('-') ? -1 : 1, _id: 1 }
      : defaultSort;

    const [items, total] = await Promise.all([
      Model.find(filter).sort(sort).skip(skip).limit(limit).populate(populate.list || []).lean(),
      Model.countDocuments(filter),
    ]);
    res.json({ items, total, page, limit, pages: Math.ceil(total / limit) || 1 });
  });

  router.put('/reorder', requirePermission(writePermission), async (req, res) => {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter(isObjectId) : [];
    if (!ids.length) throw new ApiError(400, 'ids array is required');
    await Model.bulkWrite(
      ids.map((id, index) => ({ updateOne: { filter: { _id: id }, update: { $set: { sortOrder: index } } } })),
    );
    cache.invalidate();
    await logActivity(req, { action: 'reorder', entityType, meta: { count: ids.length } });
    res.json({ ok: true });
  });

  router.get('/:id', optionalAuth, async (req, res) => {
    const doc = await findById(req.params.id, populate.detail);
    const isAdmin = req.admin && hasPermission(req.admin.role, readPermission);
    if (!isAdmin) {
      if (!publicRead) throw new ApiError(401, 'Authentication required');
      const visible = !hasStatus || (doc.status === 'published' && doc.isVisible && (!doc.publishedAt || doc.publishedAt <= new Date()));
      if (!visible) throw new ApiError(404, `${entityType} not found`);
    }
    res.json(await serialize(doc, req));
  });

  router.post('/', requireAuth, requirePermission(writePermission), async (req, res) => {
    const body = stripProtected(req.body, extraProtected);
    assertPublishRights(req, 'draft', body.status || 'draft');
    const doc = new Model(body);
    if (Model.schema.path('createdBy')) doc.createdBy = req.admin._id;
    if (Model.schema.path('updatedBy')) doc.updatedBy = req.admin._id;
    if (beforeWrite) await beforeWrite(doc, req, { isNew: true, body: req.body });
    await doc.save();
    if (afterWrite) await afterWrite(doc, req, { isNew: true, body: req.body });
    cache.invalidate();
    await logActivity(req, { action: 'create', entityType, entityId: doc._id, entityLabel: labelOf(doc) });
    if (hasStatus && doc.status === 'published') {
      await logActivity(req, { action: 'publish', entityType, entityId: doc._id, entityLabel: labelOf(doc) });
    }
    const fresh = await findById(doc._id, populate.detail);
    res.status(201).json(await serialize(fresh, req));
  });

  router.put('/:id', requireAuth, requirePermission(writePermission), async (req, res) => {
    const doc = await findById(req.params.id);
    const body = stripProtected(req.body, extraProtected);
    const fromStatus = doc.status;
    assertPublishRights(req, fromStatus, body.status);
    doc.set(body);
    if (Model.schema.path('updatedBy')) doc.updatedBy = req.admin._id;
    if (beforeWrite) await beforeWrite(doc, req, { isNew: false, body: req.body });
    await doc.save();
    if (afterWrite) await afterWrite(doc, req, { isNew: false, body: req.body });
    cache.invalidate();
    await logActivity(req, { action: 'update', entityType, entityId: doc._id, entityLabel: labelOf(doc) });
    const transition = hasStatus ? statusAction(fromStatus, doc.status) : null;
    if (transition) await logActivity(req, { action: transition, entityType, entityId: doc._id, entityLabel: labelOf(doc) });
    const fresh = await findById(doc._id, populate.detail);
    res.json(await serialize(fresh, req));
  });

  if (hasStatus) {
    router.patch('/:id/status', requireAuth, requirePermission(writePermission), async (req, res) => {
      const doc = await findById(req.params.id);
      const status = asString(req.body?.status, 20);
      if (!['draft', 'published', 'archived'].includes(status)) throw new ApiError(400, 'Invalid status');
      const fromStatus = doc.status;
      assertPublishRights(req, fromStatus, status);
      doc.status = status;
      if (req.body?.publishedAt !== undefined) doc.publishedAt = req.body.publishedAt ? new Date(req.body.publishedAt) : undefined;
      doc.updatedBy = req.admin._id;
      await doc.save();
      cache.invalidate();
      const transition = statusAction(fromStatus, status) || 'update';
      await logActivity(req, { action: transition, entityType, entityId: doc._id, entityLabel: labelOf(doc) });
      res.json({ _id: doc._id, status: doc.status, publishedAt: doc.publishedAt });
    });
  }

  router.post('/:id/duplicate', requireAuth, requirePermission(writePermission), async (req, res) => {
    const source = await findById(req.params.id);
    const plain = source.toObject({ depopulate: true });
    for (const key of ['_id', '__v', 'createdAt', 'updatedAt', 'publishedAt', 'searchText']) delete plain[key];
    if (hasStatus) plain.status = 'draft';
    const copy = new Model(prepareDuplicate ? await prepareDuplicate(plain, source, req) : plain);
    copy.isNew = true;
    copy._id = new mongoose.Types.ObjectId();
    if (Model.schema.path('createdBy')) copy.createdBy = req.admin._id;
    if (Model.schema.path('updatedBy')) copy.updatedBy = req.admin._id;
    await copy.save();
    if (options.afterDuplicate) await options.afterDuplicate(copy, source, req);
    cache.invalidate();
    await logActivity(req, {
      action: 'duplicate',
      entityType,
      entityId: copy._id,
      entityLabel: labelOf(copy),
      meta: { from: source._id },
    });
    const fresh = await findById(copy._id, populate.detail);
    res.status(201).json(await serialize(fresh, req));
  });

  router.delete('/:id', requireAuth, requirePermission(deletePermission), async (req, res) => {
    const doc = await findById(req.params.id);
    if (beforeDelete) await beforeDelete(doc, req);
    await doc.deleteOne();
    if (afterDelete) await afterDelete(doc, req);
    cache.invalidate();
    await logActivity(req, {
      action: 'delete',
      entityType,
      entityId: doc._id,
      entityLabel: labelOf(doc),
      severity: 'warning',
    });
    res.json({ ok: true, _id: doc._id });
  });

  return router;
}

export async function assertNoChildren(Model, filter, message) {
  const count = await Model.countDocuments(filter);
  if (count > 0) throw new ApiError(409, message.replace('{count}', String(count)), { count });
}
