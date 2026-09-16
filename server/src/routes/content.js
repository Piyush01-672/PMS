import crypto from 'node:crypto';
import express from 'express';
import { hasPermission } from '../lib/permissions.js';
import { isObjectId } from '../lib/request.js';
import {
  AdSlot,
  Chapter,
  ClassLevel,
  Exercise,
  ImportantQuestion,
  Note,
  Page,
  Question,
  RelatedContent,
  Section,
  Solution,
  Subject,
  Template,
} from '../models/index.js';
import { optionalAuth } from '../middleware/auth.js';
import { ApiError } from '../middleware/error.js';
import { assertNoChildren, crudRouter } from '../services/crud.js';
import { MEDIA_SELECT, VIDEO_SELECT, blockPopulate, questionPopulate } from '../services/populate.js';

const router = express.Router();
const idFilter = (query, keys) =>
  Object.fromEntries(keys.filter((k) => isObjectId(query[k])).map((k) => [k, query[k]]));
const copySuffix = () => `copy-${crypto.randomBytes(2).toString('hex')}`;
const copyTitle = (value) => ({
  hi: value?.hi ? `${value.hi} (कॉपी)` : '',
  en: value?.en ? `${value.en} (copy)` : '',
  mixed: value?.mixed || '',
});

const classPopulate = { path: 'class', select: 'number name slug' };
const subjectPopulate = { path: 'subject', select: 'name slug' };
const seoImage = { path: 'seo.ogImage', select: MEDIA_SELECT };

router.use(
  '/classes',
  crudRouter(ClassLevel, {
    entityType: 'Class',
    defaultSort: { sortOrder: 1, number: 1 },
    populate: {
      list: [{ path: 'subjects', select: 'name slug' }],
      detail: [{ path: 'thumbnail', select: MEDIA_SELECT }, seoImage, { path: 'subjects', select: 'name slug isPublic' }],
    },
    beforeDelete: async (doc) => {
      await assertNoChildren(Chapter, { class: doc._id }, 'This class still has {count} अध्याय. Delete or move them first.');
      await assertNoChildren(Note, { class: doc._id }, 'This class still has {count} notes. Delete them first.');
      await assertNoChildren(ImportantQuestion, { class: doc._id }, 'This class still has {count} important questions. Delete them first.');
    },
    prepareDuplicate: async (plain) => {
      const max = await ClassLevel.findOne().sort({ number: -1 }).select('number').lean();
      const number = (max?.number || 0) + 1;
      return { ...plain, number, slug: `class-${number}`, name: copyTitle(plain.name) };
    },
    extend: (r) => {
      r.get('/:classId/chapters', optionalAuth, async (req, res) => {
        if (!isObjectId(req.params.classId)) throw new ApiError(400, 'Invalid class id');
        const admin = req.query.scope === 'admin' && req.admin && hasPermission(req.admin.role, 'content:read');
        const base = { class: req.params.classId, ...idFilter(req.query, ['subject']) };
        const items = await Chapter.find(admin ? base : Chapter.publicFilter(base))
          .sort({ sortOrder: 1, number: 1 })
          .populate(subjectPopulate)
          .lean();
        res.json({ items, total: items.length });
      });
    },
  }),
);

router.use(
  '/subjects',
  crudRouter(Subject, {
    entityType: 'Subject',
    defaultSort: { sortOrder: 1 },
    beforeDelete: async (doc) => {
      await assertNoChildren(Chapter, { subject: doc._id }, 'This subject still has {count} अध्याय.');
      await ClassLevel.updateMany({ subjects: doc._id }, { $pull: { subjects: doc._id } });
    },
    prepareDuplicate: (plain) => ({ ...plain, slug: `${plain.slug}-${copySuffix()}`, name: copyTitle(plain.name), isPublic: false }),
  }),
);

router.use(
  '/chapters',
  crudRouter(Chapter, {
    entityType: 'Chapter',
    defaultSort: { sortOrder: 1, number: 1 },
    adminFilters: (q) => idFilter(q, ['class', 'subject']),
    publicFilters: (q) => idFilter(q, ['class', 'subject']),
    populate: {
      list: [classPopulate, subjectPopulate],
      detail: [
        classPopulate,
        subjectPopulate,
        { path: 'image', select: MEDIA_SELECT },
        { path: 'featuredImage', select: MEDIA_SELECT },
        { path: 'introVideo', select: VIDEO_SELECT },
        { path: 'relatedChapters', select: 'number title slug class' },
        seoImage,
      ],
    },
    beforeDelete: async (doc) => {
      await assertNoChildren(Exercise, { chapter: doc._id }, 'This अध्याय still has {count} प्रश्नावली. Delete them first (nothing else is removed automatically).');
    },
    afterDelete: async (doc) => {
      await Promise.all([
        Note.updateMany({ chapter: doc._id }, { $unset: { chapter: 1 } }),
        ImportantQuestion.updateMany({ chapter: doc._id }, { $unset: { chapter: 1 } }),
        Chapter.updateMany({ relatedChapters: doc._id }, { $pull: { relatedChapters: doc._id } }),
        RelatedContent.deleteMany({ source: doc._id }),
      ]);
    },
    prepareDuplicate: (plain) => ({ ...plain, slug: `${plain.slug}-${copySuffix()}`, title: copyTitle(plain.title) }),
  }),
);

router.use(
  '/exercises',
  crudRouter(Exercise, {
    entityType: 'Exercise',
    defaultSort: { sortOrder: 1, number: 1 },
    adminFilters: (q) => idFilter(q, ['chapter', 'class', 'subject']),
    publicFilters: (q) => idFilter(q, ['chapter', 'class']),
    populate: {
      list: [{ path: 'chapter', select: 'number title slug' }, classPopulate],
      detail: [
        { path: 'chapter', select: 'number title slug class subject', populate: [classPopulate, subjectPopulate] },
        { path: 'introVideo', select: VIDEO_SELECT },
        seoImage,
      ],
    },
    beforeDelete: async (doc) => {
      await assertNoChildren(Question, { exercise: doc._id }, 'This प्रश्नावली still has {count} questions. Delete them first.');
    },
    afterDelete: async (doc) => RelatedContent.deleteMany({ source: doc._id }),
    prepareDuplicate: (plain) => ({ ...plain, slug: `${plain.slug}-${copySuffix()}` }),
  }),
);

async function saveSolution(question, req) {
  const payload = req.body?.solution;
  if (payload === undefined) return;
  let solution = await Solution.findOne({ question: question._id });
  if (!solution) solution = new Solution({ question: question._id, createdBy: req.admin._id });
  solution.set({
    blocks: Array.isArray(payload?.blocks) ? payload.blocks : [],
    languageMode: payload?.languageMode || 'auto',
    template: isObjectId(payload?.template) ? payload.template : undefined,
  });
  solution.updatedBy = req.admin._id;
  await solution.save();
}

router.use(
  '/questions',
  crudRouter(Question, {
    entityType: 'Question',
    defaultSort: { sortOrder: 1, createdAt: 1 },
    adminFilters: (q) => ({
      ...idFilter(q, ['exercise', 'chapter', 'class']),
      ...(['easy', 'medium', 'hard'].includes(q.difficulty) ? { difficulty: q.difficulty } : {}),
      ...(q.isImportant === 'true' ? { isImportant: true } : {}),
    }),
    publicFilters: (q) => idFilter(q, ['exercise', 'chapter']),
    populate: {
      list: [{ path: 'exercise', select: 'number slug' }, { path: 'chapter', select: 'number title slug' }, classPopulate],
      detail: [
        ...questionPopulate,
        seoImage,
        { path: 'exercise', select: 'number slug title chapter' },
        { path: 'chapter', select: 'number title slug' },
        classPopulate,
        subjectPopulate,
      ],
    },
    afterWrite: async (doc, req) => saveSolution(doc, req),
    serialize: async (doc) => {
      const solution = await Solution.findOne({ question: doc._id }).populate(blockPopulate()).lean();
      return { ...doc.toObject(), solution };
    },
    afterDelete: async (doc) => {
      await Promise.all([Solution.deleteOne({ question: doc._id }), RelatedContent.deleteMany({ source: doc._id })]);
    },
    prepareDuplicate: (plain) => ({ ...plain, slug: `${plain.slug}-${copySuffix()}` }),
    afterDuplicate: async (copy, source, req) => {
      const solution = await Solution.findOne({ question: source._id }).lean();
      if (solution) {
        await Solution.create({
          question: copy._id,
          blocks: solution.blocks.map(({ _id, ...b }) => b),
          languageMode: solution.languageMode,
          createdBy: req.admin._id,
          updatedBy: req.admin._id,
        });
      }
    },
  }),
);

router.use(
  '/solutions',
  crudRouter(Solution, {
    entityType: 'Solution',
    publicRead: false,
    hasStatus: false,
    defaultSort: { updatedAt: -1 },
    adminFilters: (q) => idFilter(q, ['question']),
    populate: {
      list: [{ path: 'question', select: 'number slug exercise chapter class status', populate: [{ path: 'exercise', select: 'number' }, classPopulate] }],
      detail: [...blockPopulate(), { path: 'question', select: 'number slug' }],
    },
  }),
);

router.use(
  '/notes',
  crudRouter(Note, {
    entityType: 'Note',
    defaultSort: { sortOrder: 1, createdAt: -1 },
    adminFilters: (q) => idFilter(q, ['class', 'subject', 'chapter']),
    publicFilters: (q) => idFilter(q, ['class', 'chapter']),
    populate: {
      list: [classPopulate, { path: 'chapter', select: 'number title' }],
      detail: [
        classPopulate,
        subjectPopulate,
        { path: 'chapter', select: 'number title slug' },
        { path: 'attachments.media', select: MEDIA_SELECT },
        { path: 'video', select: VIDEO_SELECT },
        seoImage,
      ],
    },
    afterDelete: async (doc) => RelatedContent.deleteMany({ source: doc._id }),
    prepareDuplicate: (plain) => ({ ...plain, slug: `${plain.slug}-${copySuffix()}`, title: copyTitle(plain.title) }),
  }),
);

router.use(
  '/important-questions',
  crudRouter(ImportantQuestion, {
    entityType: 'ImportantQuestion',
    defaultSort: { sortOrder: 1, createdAt: -1 },
    adminFilters: (q) => idFilter(q, ['class', 'subject', 'chapter']),
    publicFilters: (q) => idFilter(q, ['class', 'chapter']),
    populate: {
      list: [classPopulate, { path: 'chapter', select: 'number title' }],
      detail: [
        classPopulate,
        subjectPopulate,
        { path: 'chapter', select: 'number title slug' },
        { path: 'linkedQuestion', select: 'number slug' },
        { path: 'attachments.media', select: MEDIA_SELECT },
        ...blockPopulate(),
        seoImage,
      ],
    },
    prepareDuplicate: (plain) => ({ ...plain, slug: `${plain.slug}-${copySuffix()}` }),
  }),
);

router.use(
  '/pages',
  crudRouter(Page, {
    entityType: 'Page',
    defaultSort: { sortOrder: 1, createdAt: 1 },
    populate: { detail: [seoImage] },
    afterDelete: async (doc) => RelatedContent.deleteMany({ source: doc._id }),
    prepareDuplicate: (plain) => ({ ...plain, slug: `${plain.slug}-${copySuffix()}`, title: copyTitle(plain.title) }),
  }),
);

router.use(
  '/sections',
  crudRouter(Section, {
    entityType: 'Section',
    defaultSort: { sortOrder: 1, createdAt: 1 },
    writePermission: 'settings:write',
    deletePermission: 'settings:write',
    adminFilters: (q) => (q.pageKey ? { page: String(q.pageKey).slice(0, 60) } : {}),
    publicFilters: (q) => (q.pageKey ? { page: String(q.pageKey).slice(0, 60) } : {}),
    populate: {
      detail: [
        { path: 'image', select: MEDIA_SELECT },
        { path: 'video', select: VIDEO_SELECT },
        { path: 'items.image', select: MEDIA_SELECT },
        { path: 'config.classes', select: 'number name slug' },
        { path: 'config.chapters', select: 'number title slug class', populate: { path: 'class', select: 'number' } },
        { path: 'config.questions', select: 'number slug exercise', populate: { path: 'exercise', select: 'number' } },
        { path: 'config.importantQuestions', select: 'text slug marks' },
        { path: 'config.notes', select: 'title slug' },
        { path: 'config.videos', select: VIDEO_SELECT },
        { path: 'config.gallery', select: MEDIA_SELECT },
      ],
    },
    prepareDuplicate: (plain) => ({ ...plain, name: `${plain.name || plain.type} (copy)` }),
  }),
);

router.use(
  '/related-content',
  crudRouter(RelatedContent, {
    entityType: 'RelatedContent',
    publicRead: false,
    hasStatus: false,
    defaultSort: { updatedAt: -1 },
    adminFilters: (q) => ({ ...idFilter(q, ['source']), ...(q.sourceType ? { sourceType: String(q.sourceType) } : {}) }),
    populate: {
      list: [{ path: 'source', select: 'title number slug text' }],
      // items.target is not populated: "Url" items have no target model to populate.
      detail: [{ path: 'source', select: 'title number slug text' }],
    },
  }),
);

router.use(
  '/templates',
  crudRouter(Template, {
    entityType: 'Template',
    publicRead: false,
    hasStatus: false,
    defaultSort: { sortOrder: 1, name: 1 },
    adminFilters: (q) => (q.kind ? { kind: String(q.kind) } : {}),
    populate: { detail: blockPopulate() },
    prepareDuplicate: (plain) => ({ ...plain, name: `${plain.name} (copy)`, isDefault: false }),
  }),
);

router.use(
  '/ad-slots',
  crudRouter(AdSlot, {
    entityType: 'AdSlot',
    publicRead: false,
    hasStatus: false,
    defaultSort: { sortOrder: 1 },
    writePermission: 'settings:write',
    deletePermission: 'settings:write',
    readPermission: 'settings:write',
    beforeWrite: async (doc, req) => {
      if (doc.isModified('code') && !hasPermission(req.admin.role, 'ads:code')) {
        throw new ApiError(403, 'Only the owner account can change advertisement code');
      }
    },
  }),
);

export default router;
