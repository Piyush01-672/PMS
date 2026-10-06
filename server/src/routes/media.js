import express from 'express';
import multer from 'multer';
import { env } from '../config/env.js';
import { cache } from '../lib/cache.js';
import { detectFile, isImage, isPdf } from '../lib/imageInfo.js';
import { asString, isObjectId, parsePagination } from '../lib/request.js';
import { sanitizeSvg } from '../lib/sanitize.js';
import { removeFile, storeFile } from '../lib/storage.js';
import { Media } from '../models/index.js';
import { requireAuth, requirePermission } from '../middleware/auth.js';
import { ApiError } from '../middleware/error.js';
import { logActivity } from '../services/activity.js';
import { findMediaUsage } from '../services/usage.js';
import { escapeRegex } from '../utils/slug.js';

const router = express.Router();
const KINDS = Media.schema.path('kind').enumValues;
const ALLOWED_EXT = /\.(png|jpe?g|webp|svg|pdf)$/i;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024, files: 10, fields: 30 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_EXT.test(file.originalname)) return cb(new ApiError(400, `${file.originalname}: only PNG, JPG, JPEG, WEBP, SVG images and PDF files are allowed`));
    cb(null, true);
  },
});

function metadataFrom(body = {}) {
  const meta = {};
  if (body.title !== undefined) meta.title = asString(body.title, 200);
  if (body.altHi !== undefined || body.altEn !== undefined) meta.alt = { hi: asString(body.altHi, 600), en: asString(body.altEn, 600) };
  if (body.captionHi !== undefined || body.captionEn !== undefined) {
    meta.caption = { hi: asString(body.captionHi, 6000), en: asString(body.captionEn, 6000) };
  }
  if (body.description !== undefined) meta.description = asString(body.description, 2000);
  if (body.kind !== undefined && KINDS.includes(body.kind)) meta.kind = body.kind;
  if (body.tags !== undefined) {
    const tags = Array.isArray(body.tags) ? body.tags : String(body.tags).split(',');
    meta.tags = tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean).slice(0, 20);
  }
  return meta;
}

async function prepareFile(file) {
  const info = detectFile(file.buffer);
  if (!info) throw new ApiError(400, `${file.originalname}: file content is not a valid PNG, JPG, WEBP, SVG image or PDF`);
  let buffer = file.buffer;
  if (isImage(info) && info.format === 'svg') {
    buffer = sanitizeSvg(file.buffer);
    if (!buffer) throw new ApiError(400, `${file.originalname}: SVG could not be sanitized safely`);
  }
  return { buffer, info };
}

function defaultKindFor(info, userKind) {
  if (userKind && KINDS.includes(userKind)) return userKind;
  if (isPdf(info)) return 'pdf';
  return 'image';
}

async function loadMedia(id) {
  if (!isObjectId(id)) throw new ApiError(400, 'Invalid id');
  const media = await Media.findById(id);
  if (!media) throw new ApiError(404, 'Media not found');
  return media;
}

router.get('/', requireAuth, requirePermission('content:read'), async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 40, maxLimit: 100 });
  const filter = {};
  const kind = asString(req.query.kind, 30);
  if (kind === 'diagrams') filter.kind = { $in: ['diagram', 'graph', 'construction', 'figure'] };
  else if (KINDS.includes(kind)) filter.kind = kind;
  const q = asString(req.query.q, 100).trim();
  if (q) {
    const re = { $regex: escapeRegex(q), $options: 'i' };
    filter.$or = [{ title: re }, { originalName: re }, { 'alt.en': re }, { 'alt.hi': re }, { tags: re }, { description: re }];
  }
  const [items, total] = await Promise.all([
    Media.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate({ path: 'uploadedBy', select: 'name' }).lean(),
    Media.countDocuments(filter),
  ]);
  res.json({ items, total, page, limit, pages: Math.ceil(total / limit) || 1 });
});

router.get('/:id', requireAuth, requirePermission('content:read'), async (req, res) => {
  res.json(await loadMedia(req.params.id));
});

router.get('/:id/usage', requireAuth, requirePermission('content:read'), async (req, res) => {
  const media = await loadMedia(req.params.id);
  res.json({ items: await findMediaUsage(media._id) });
});

router.post('/upload', requireAuth, requirePermission('media:write'), upload.array('files', 10), async (req, res) => {
  const files = req.files || [];
  if (!files.length) throw new ApiError(400, 'No files uploaded. Use the "files" field.');
  const meta = metadataFrom(req.body);
  const items = [];
  const errors = [];

  for (const file of files) {
    try {
      const { buffer, info } = await prepareFile(file);
      const kind = defaultKindFor(info, meta.kind);
      const stored = await storeFile({ buffer, info, name: meta.title || file.originalname, kind });
      const media = await Media.create({
        ...stored,
        mimeType: info.mimeType,
        originalName: file.originalname.slice(0, 300),
        title: meta.title || file.originalname.replace(/\.[a-z0-9]+$/i, '').slice(0, 200),
        alt: meta.alt || {},
        caption: meta.caption || {},
        description: meta.description || '',
        kind,
        tags: meta.tags || [],
        uploadedBy: req.admin._id,
      });
      items.push(media);
      await logActivity(req, { action: 'media_upload', entityType: 'Media', entityId: media._id, entityLabel: media.title, meta: { bytes: media.bytes, format: media.format } });
    } catch (err) {
      errors.push({ file: file.originalname, message: err.message });
    }
  }
  if (!items.length) throw new ApiError(400, errors[0]?.message || 'Upload failed', { errors });
  res.status(201).json({ items, errors });
});

router.put('/:id', requireAuth, requirePermission('media:write'), async (req, res) => {
  const media = await loadMedia(req.params.id);
  const body = req.body || {};
  const update = {};
  if (body.title !== undefined) update.title = asString(body.title, 200);
  if (body.alt) update.alt = { hi: asString(body.alt.hi, 600), en: asString(body.alt.en, 600) };
  if (body.caption) update.caption = { hi: asString(body.caption.hi, 6000), en: asString(body.caption.en, 6000) };
  if (body.description !== undefined) update.description = asString(body.description, 2000);
  if (KINDS.includes(body.kind)) update.kind = body.kind;
  if (Array.isArray(body.tags)) update.tags = body.tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean).slice(0, 20);
  media.set(update);
  media.updatedBy = req.admin._id;
  await media.save();
  cache.invalidate();
  await logActivity(req, { action: 'update', entityType: 'Media', entityId: media._id, entityLabel: media.title });
  res.json(media);
});

// Replace the file but keep the same Media id, so every page using it updates automatically.
router.post('/:id/replace', requireAuth, requirePermission('media:write'), upload.single('file'), async (req, res) => {
  const media = await loadMedia(req.params.id);
  if (!req.file) throw new ApiError(400, 'No file uploaded. Use the "file" field.');
  const { buffer, info } = await prepareFile(req.file);
  const previous = { provider: media.provider, publicId: media.publicId };
  const kind = defaultKindFor(info, media.kind);
  const stored = await storeFile({ buffer, info, name: media.title || req.file.originalname, kind });
  media.set({ ...stored, mimeType: info.mimeType, originalName: req.file.originalname.slice(0, 300), kind, updatedBy: req.admin._id });
  await media.save();
  await removeFile(previous).catch((err) => console.error('[media] failed to remove replaced file', err.message));
  cache.invalidate();
  await logActivity(req, { action: 'media_replace', entityType: 'Media', entityId: media._id, entityLabel: media.title });
  res.json(media);
});

router.delete('/:id', requireAuth, requirePermission('media:delete'), async (req, res) => {
  const media = await loadMedia(req.params.id);
  const usage = await findMediaUsage(media._id);
  if (usage.length && req.query.force !== 'true') {
    throw new ApiError(409, `This file is used in ${usage.length} place(s). Remove it there first, or confirm force delete.`, { usage });
  }
  await removeFile(media).catch((err) => console.error('[media] failed to remove file', err.message));
  await media.deleteOne();
  cache.invalidate();
  await logActivity(req, { action: 'media_delete', entityType: 'Media', entityId: media._id, entityLabel: media.title, severity: 'warning', meta: { forced: usage.length > 0 } });
  res.json({ ok: true });
});

export default router;
