import express from 'express';
import { hasPermission } from '../lib/permissions.js';
import {
  ActivityLog,
  Chapter,
  ClassLevel,
  Exercise,
  ImportantQuestion,
  Media,
  Note,
  Page,
  Question,
  Section,
  Solution,
  Video,
} from '../models/index.js';
import { requireAuth, requirePermission } from '../middleware/auth.js';
import { labelOf } from '../services/activity.js';

const router = express.Router();

const CONTENT = [
  ['classes', 'Class', ClassLevel],
  ['chapters', 'Chapter', Chapter],
  ['exercises', 'Exercise', Exercise],
  ['questions', 'Question', Question],
  ['notes', 'Note', Note],
  ['important-questions', 'Important Question', ImportantQuestion],
  ['pages', 'Page', Page],
  ['sections', 'Homepage Section', Section],
];

router.get('/', requireAuth, requirePermission('content:read'), async (req, res) => {
  const now = new Date();
  const statusRows = await Promise.all(
    CONTENT.map(async ([resource, , Model]) => {
      const rows = await Model.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
      const scheduled = await Model.countDocuments({ status: 'published', publishedAt: { $gt: now } });
      const byStatus = Object.fromEntries(rows.map((r) => [r._id, r.count]));
      return [resource, { total: rows.reduce((a, r) => a + r.count, 0), published: byStatus.published || 0, draft: byStatus.draft || 0, archived: byStatus.archived || 0, scheduled }];
    }),
  );
  const content = Object.fromEntries(statusRows);

  const [solutions, media, images, diagrams, videos] = await Promise.all([
    Solution.countDocuments(),
    Media.countDocuments(),
    Media.countDocuments({ kind: { $in: ['image', 'logo', 'thumbnail', 'other'] } }),
    Media.countDocuments({ kind: { $in: ['diagram', 'graph', 'construction', 'figure'] } }),
    Video.countDocuments(),
  ]);

  const recentLists = await Promise.all(
    CONTENT.map(async ([resource, typeLabel, Model]) => {
      const docs = await Model.find()
        .sort({ updatedAt: -1 })
        .limit(8)
        .select('title name number text status updatedAt updatedBy type page')
        .populate({ path: 'updatedBy', select: 'name' })
        .lean();
      return docs.map((d) => ({
        resource,
        type: typeLabel,
        id: d._id,
        label: labelOf(d) || d.type || typeLabel,
        status: d.status,
        updatedAt: d.updatedAt,
        updatedBy: d.updatedBy?.name,
      }));
    }),
  );
  const recent = recentLists.flat().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 12);

  let security = null;
  let activity = [];
  if (hasPermission(req.admin.role, 'activity:read')) {
    const since = new Date(Date.now() - 24 * 3_600_000);
    const [failed, locked] = await Promise.all([
      ActivityLog.countDocuments({ action: 'login_failed', createdAt: { $gte: since } }),
      ActivityLog.countDocuments({ action: 'login_locked', createdAt: { $gte: since } }),
    ]);
    security = { failedLogins24h: failed, lockouts24h: locked };
    activity = await ActivityLog.find().sort({ createdAt: -1 }).limit(8).lean();
  }

  const totals = {
    classes: content.classes.total,
    chapters: content.chapters.total,
    exercises: content.exercises.total,
    questions: content.questions.total,
    solutions,
    notes: content.notes.total,
    importantQuestions: content['important-questions'].total,
    media,
    images,
    diagrams,
    videos,
    published: statusRows.reduce((a, [, s]) => a + s.published, 0),
    draft: statusRows.reduce((a, [, s]) => a + s.draft, 0),
    scheduled: statusRows.reduce((a, [, s]) => a + s.scheduled, 0),
  };

  res.set('Cache-Control', 'no-store');
  res.json({ totals, content, recent, security, activity });
});

export default router;
