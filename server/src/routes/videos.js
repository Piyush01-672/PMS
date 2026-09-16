import { cache } from '../lib/cache.js';
import { asString } from '../lib/request.js';
import { Video } from '../models/index.js';
import { requireAuth, requirePermission } from '../middleware/auth.js';
import { ApiError } from '../middleware/error.js';
import { logActivity } from '../services/activity.js';
import { crudRouter } from '../services/crud.js';
import { findVideoUsage } from '../services/usage.js';
import { escapeRegex } from '../utils/slug.js';
import { extractYouTubeId, youTubeWatchUrl } from '../utils/youtube.js';

const INVALID = 'Invalid YouTube URL. Paste a link like https://www.youtube.com/watch?v=XXXXXXXXXXX or https://youtu.be/XXXXXXXXXXX';

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
    return { $or: [{ 'title.en': re }, { 'title.hi': re }, { youtubeId: re }, { tags: re }] };
  },
  beforeWrite: async (doc) => {
    if (!extractYouTubeId(doc.url || doc.youtubeId)) throw new ApiError(400, INVALID);
    if (doc.isModified('url')) {
      doc.youtubeId = extractYouTubeId(doc.url);
      doc.thumbnailUrl = '';
    }
  },
  beforeDelete: async (doc, req) => {
    const usage = await findVideoUsage(doc._id);
    if (usage.length && req.query.force !== 'true') {
      throw new ApiError(409, `This video is used in ${usage.length} place(s). Remove it there first, or confirm force delete.`, { usage });
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
        video = await Video.create({ youtubeId: id, url: youTubeWatchUrl(id), title, createdBy: req.admin._id, updatedBy: req.admin._id });
        created = true;
        cache.invalidate();
        await logActivity(req, { action: 'create', entityType: 'Video', entityId: video._id, entityLabel: video.title?.en || id });
      }
      res.status(created ? 201 : 200).json(video);
    });
  },
});
