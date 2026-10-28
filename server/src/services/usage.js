import {
  Chapter,
  ClassLevel,
  Exercise,
  ImportantQuestion,
  Note,
  Page,
  Question,
  Section,
  SeoSetting,
  SiteSettings,
  Solution,
  Template,
  Media,
  Topic,
} from '../models/index.js';
import { labelOf } from './activity.js';

const MEDIA_REFS = [
  [SiteSettings, 'Website Settings', ['brand.logo', 'brand.footerLogo', 'brand.favicon', 'seo.defaultOgImage']],
  [ClassLevel, 'Class', ['thumbnail', 'seo.ogImage']],
  [Chapter, 'Chapter', ['image', 'featuredImage', 'seo.ogImage']],
  [Exercise, 'Exercise', ['seo.ogImage']],
  [Question, 'Question', ['attachments.media', 'seo.ogImage']],
  [Solution, 'Solution', ['blocks.media.media']],
  [Note, 'Note', ['attachments.media', 'seo.ogImage']],
  [ImportantQuestion, 'Important Question', ['attachments.media', 'blocks.media.media', 'seo.ogImage']],
  [Section, 'Homepage Section', ['image', 'items.image', 'config.gallery']],
  [Page, 'Page', ['seo.ogImage']],
  [SeoSetting, 'SEO', ['ogImage']],
  [Template, 'Template', ['blocks.media.media']],
];

const VIDEO_REFS = [
  [Chapter, 'Chapter', ['introVideo']],
  [Exercise, 'Exercise', ['introVideo']],
  [Question, 'Question', ['video.video']],
  [Solution, 'Solution', ['blocks.video']],
  [Note, 'Note', ['video']],
  [ImportantQuestion, 'Important Question', ['blocks.video']],
  [Section, 'Homepage Section', ['video', 'config.videos']],
  [Template, 'Template', ['blocks.video']],
];

async function findUsage(refs, id) {
  const usage = [];
  for (const [Model, type, paths] of refs) {
    const docs = await Model.find({ $or: paths.map((p) => ({ [p]: id })) })
      .select('title name number key question slug')
      .limit(20)
      .lean();
    for (const doc of docs) usage.push({ type, id: doc._id, label: labelOf(doc) || type });
  }
  return usage;
}

export async function findMediaUsage(id) {
  const usage = await findUsage(MEDIA_REFS, id);
  const media = await Media.findById(id).select('url').lean();
  if (!media?.url) return usage;
  // Embedded rich-text images store durable URLs rather than Media ObjectIds.
  const escaped = media.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`src=["']${escaped}["']`);
  const fields = [
    [Chapter, 'Chapter', ['introduction', 'notes']],
    [Exercise, 'Exercise', ['description', 'instructions', 'notes']],
    [Question, 'Question', ['text', 'hint', 'answer', 'importantPoint']],
    [Solution, 'Solution', ['blocks.content']],
    [Note, 'Note', ['content']],
    [ImportantQuestion, 'Important Question', ['text', 'answer', 'blocks.content']],
    [Page, 'Page', ['content']],
    [Topic, 'Topic', ['notes', 'practiceQuestions.solution']],
    [Template, 'Template', ['blocks.content']],
  ];
  for (const [Model, type, paths] of fields) {
    const conditions = paths.flatMap((p) => ['hi', 'en', 'mixed'].map((lang) => ({ [`${p}.${lang}`]: re })));
    const docs = await Model.find({ $or: conditions }).select('title name number slug').limit(20).lean();
    for (const doc of docs) usage.push({ type, id: doc._id, label: labelOf(doc) || type, embedded: true });
  }
  const sections = await Section.find({ 'config.content': re }).select('title key').limit(20).lean();
  for (const doc of sections) usage.push({ type: 'Homepage Section', id: doc._id, label: labelOf(doc), embedded: true });
  return usage;
}
export const findVideoUsage = (id) => findUsage(VIDEO_REFS, id);
