import mongoose from 'mongoose';
import { sanitizeRichText } from '../lib/sanitize.js';
import { contentPlugin } from './plugins/content.js';
import { ButtonSchema, ObjectId, l10n, textL10n } from './schemas/common.js';

const { Schema } = mongoose;

export const SECTION_TYPES = [
  'hero',
  'text',
  'cardGrid',
  'classGrid',
  'chapterGrid',
  'questionList',
  'videoSection',
  'imageGallery',
  'cta',
  'faq',
  'statistics',
  'steps',
  'relatedContent',
  'notes',
  'custom',
];

const SectionItemSchema = new Schema({
  title: l10n(),
  description: textL10n(),
  badge: l10n(),
  icon: { type: String, default: '', maxlength: 60 },
  image: { type: ObjectId, ref: 'Media' },
  url: { type: String, default: '', maxlength: 500 },
  value: { type: String, default: '', maxlength: 60 },
  latex: { type: String, default: '', maxlength: 2000 },
  isVisible: { type: Boolean, default: true },
});

const sectionSchema = new Schema(
  {
    page: { type: String, default: 'home', index: true, maxlength: 60 },
    type: { type: String, enum: SECTION_TYPES, required: true },
    name: { type: String, default: '', maxlength: 120 },
    badge: l10n(),
    title: l10n(),
    highlight: l10n(),
    description: textL10n(),
    image: { type: ObjectId, ref: 'Media' },
    video: { type: ObjectId, ref: 'Video' },
    buttons: [ButtonSchema],
    items: [SectionItemSchema],
    config: {
      classes: [{ type: ObjectId, ref: 'Class' }],
      chapters: [{ type: ObjectId, ref: 'Chapter' }],
      questions: [{ type: ObjectId, ref: 'Question' }],
      importantQuestions: [{ type: ObjectId, ref: 'ImportantQuestion' }],
      notes: [{ type: ObjectId, ref: 'Note' }],
      videos: [{ type: ObjectId, ref: 'Video' }],
      gallery: [{ type: ObjectId, ref: 'Media' }],
      limit: { type: Number, default: 8, min: 1, max: 48 },
      columns: { type: Number, default: 4, min: 1, max: 6 },
      layout: { type: String, default: 'default', maxlength: 40 },
      background: { type: String, enum: ['none', 'muted', 'brand', 'dark', 'grid'], default: 'none' },
      align: { type: String, enum: ['left', 'center'], default: 'left' },
      showSearch: { type: Boolean, default: true },
      searchPlaceholder: l10n(),
      searchButtonLabel: l10n(),
      popularLabel: l10n(),
      popularSearches: [{ label: l10n(), query: { type: String, maxlength: 200 } }],
      autoStats: { type: Boolean, default: false },
      content: { type: String, default: '', maxlength: 50_000, set: sanitizeRichText },
    },
  },
  { timestamps: true },
);

sectionSchema.plugin(contentPlugin);
sectionSchema.index({ page: 1, sortOrder: 1 });

export const Section = mongoose.model('Section', sectionSchema);
