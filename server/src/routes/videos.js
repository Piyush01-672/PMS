import multer from 'multer';
import { cache } from '../lib/cache.js';
import { detectVideo, isVideo } from '../lib/imageInfo.js';
import { asString } from '../lib/request.js';
import { removeFile, storeFile } from '../lib/storage.js';
import { Video } from '../models/index.js';
import { requireAuth, requirePermission } from '../middleware/auth.js';
import { ApiError } from '../middleware/error.js';
import { logActivity } from '../services/activity.js';
import { crudRouter } from '../services/crud.js';
import { findVideoUsage } from '../services/usage.js';
import { escapeRegex } from '../utils/slug.js';
import { extractYouTubeId, youTubeWatchUrl } from '../utils/youtube.js';
import { env } from '../config/env.js';

const INVALID = 'Invalid YouTube URL. Paste a link like https://www.youtube.com/watch?v=XXXXXXXXXXX or https://youtu.be/XXXXXXXXXXX';
const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogv)$/i;
// Use a larger size limit specifically for video uploads, but never exceed env.MAX_UPLOAD_MB if already bigger
const MAX_VIDEO_MB = Math.max(Number(env.MAX_UPLOAD_MB) || 16, 256);

const videoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_VIDEO_MB * 1024 * 1024, files: 1, fields: 30 },
  fileFilter: (req, file, cb) => {
    if (!VIDEO_EXT.test(file.originalname)) return cb(new ApiError(400, `${file.originalname}: only MP4, WEBM, MOV, M4V and OGV video files are allowed`));
    cb(null, true);
  },
});

async function fetchTitle(id) {
  try {
    const res = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(youTubeWatchUrl(id))}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return '';
    const data = await res.json();
    return String(data.title || '').slice(0, 300);
  } catch {
    return '';
  }
}

export default crudRouter(Video, {
  entityType: 'Video',
  publicRead: false,
  hasStatus: false,
  defaultSort: { createdAt: -1 },
  adminFilters: (query) => {
    const q = asString(query.q, 100).trim();
    if (!q) return {};
    const re = { $regex: escapeRegex(q), $options: 'i' };
    return { $or: [{ 'title.en': re }, { 'title.hi': re }, { youtubeId: re }, { url: re }, { tags: re }] };
  },
  beforeWrite: async (doc) => {
    const provider = String(doc.provider || 'youtube').toLowerCase();
    if (provider === 'youtube') {
      if (!extractYouTubeId(doc.url || doc.youtubeId)) throw new ApiError(400, INVALID);
      if (doc.isModified('url')) {
        doc.youtubeId = extractYouTubeId(doc.url);
        doc.thumbnailUrl = '';
      }
    } else if (!doc.url) {
      throw new ApiError(400, 'Video file upload is missing a URL');
    }
  },
  beforeDelete: async (doc, req) => {
    const usage = await findVideoUsage(doc._id);
    if (usage.length && req.query.force !== 'true') {
      throw new ApiError(409, `This video is used in ${usage.length} place(s). Remove it there first, or confirm force delete.`, { usage });
    }
    if (doc.provider === 'local' || doc.provider === 'cloudinary') {
      if (doc.publicId) {
        await removeFile({ provider: doc.provider, publicId: doc.publicId, format: doc.mimeType ? doc.mimeType.split('/').pop() : null }).catch(
          (err) => console.error('[videos] failed to remove uploaded video', err.message),
        );
      }
    }
  },
  extend: (router) => {
    router.get('/:id/usage', requireAuth, requirePermission('content:read'), async (req, res) => {
      res.json({ items: await findVideoUsage(req.params.id) });
    });

    // Paste a YouTube URL → validated Video document (created once, reused everywhere).
    router.post('/resolve', requireAuth, requirePermission('content:write'), async (req, res) => {
      const id = extractYouTubeId(asString(req.body?.url, 500));
      if (!id) throw new ApiError(400, INVALID);
      let video = await Video.findOne({ youtubeId: id });
      let created = false;
      if (!video) {
        const title = req.body?.title?.en || req.body?.title?.hi ? req.body.title : { en: await fetchTitle(id) };
        video = await Video.create({
          provider: 'youtube',
          youtubeId: id,
          url: youTubeWatchUrl(id),
          title,
          createdBy: req.admin._id,
          updatedBy: req.admin._id,
        });
        created = true;
        cache.invalidate();
        await logActivity(req, { action: 'create', entityType: 'Video', entityId: video._id, entityLabel: video.title?.en || id });
      }
      res.status(created ? 201 : 200).json(video);
    });

    // Upload a local video file (mp4/webm/mov/m4v/ogv) → Video document
    router.post('/upload', requireAuth, requirePermission('content:write'), videoUpload.single('file'), async (req, res) => {
      if (!req.file) throw new ApiError(400, 'No video file uploaded. Use the "file" field.');
      const info = detectVideo(req.file.buffer);
      if (!isVideo(info)) throw new ApiError(400, `${req.file.originalname}: file content is not a valid MP4, WEBM, MOV, M4V or OGV video`);

      const stored = await storeFile({ buffer: req.file.buffer, info, name: req.file.originalname, kind: 'video' });
      const titleHi = asString(req.body?.titleHi, 300);
      const titleEn = asString(req.body?.titleEn, 300) || req.file.originalname.replace(/\.[a-z0-9]+$/i, '').slice(0, 300);
      const descriptionHi = asString(req.body?.descriptionHi, 10000);
      const descriptionEn = asString(req.body?.descriptionEn, 10000);
      const tagsRaw = req.body?.tags;
      const tags = Array.isArray(tagsRaw)
        ? tagsRaw.map((t) => String(t).trim().toLowerCase()).filter(Boolean).slice(0, 20)
        : String(tagsRaw || '')
            .split(',')
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean)
            .slice(0, 20);
      const durationSecs = Number(req.body?.durationSecs) || 0;
      const width = req.body?.width == null ? null : Number(req.body.width);
      const height = req.body?.height == null ? null : Number(req.body.height);

      const video = await Video.create({
        provider: stored.provider === 'cloudinary' ? 'cloudinary' : 'local',
        youtubeId: undefined,
        url: stored.url,
        title: { hi: titleHi || '', en: titleEn },
        description: { hi: descriptionHi || '', en: descriptionEn || '' },
        thumbnailUrl: asString(req.body?.thumbnailUrl, 500),
        mimeType: info.mimeType,
        bytes: stored.bytes || req.file.buffer.length,
        durationSecs: durationSecs > 0 ? durationSecs : 0,
        width: Number.isFinite(width) ? width : null,
        height: Number.isFinite(height) ? height : null,
        publicId: stored.publicId,
        isVisible: req.body?.isVisible === 'false' || req.body?.isVisible === false ? false : true,
        tags,
        createdBy: req.admin._id,
        updatedBy: req.admin._id,
      });
      cache.invalidate();
      await logActivity(req, {
        action: 'video_upload',
        entityType: 'Video',
        entityId: video._id,
        entityLabel: video.title?.en || video.filename,
        meta: { bytes: video.bytes, mimeType: video.mimeType, provider: video.provider },
      });
      res.status(201).json(video);
    });
  },
});
