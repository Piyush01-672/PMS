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

export const findMediaUsage = (id) => findUsage(MEDIA_REFS, id);
export const findVideoUsage = (id) => findUsage(VIDEO_REFS, id);
