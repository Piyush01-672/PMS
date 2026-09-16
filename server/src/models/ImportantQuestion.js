import mongoose from 'mongoose';
import { slugify } from '../utils/slug.js';
import { contentPlugin } from './plugins/content.js';
import { AttachmentSchema, DIFFICULTIES, ObjectId, languageMode, richL10n, seo } from './schemas/common.js';
import { SolutionBlockSchema } from './SolutionBlock.js';
import { blocksText, joinSearch, l10nText, labels } from '../services/searchText.js';

const importantQuestionSchema = new mongoose.Schema(
  {
    class: { type: ObjectId, ref: 'Class', required: true, index: true },
    subject: { type: ObjectId, ref: 'Subject', required: true, index: true },
    chapter: { type: ObjectId, ref: 'Chapter', index: true },
    linkedQuestion: { type: ObjectId, ref: 'Question' },
    slug: { type: String, required: true, lowercase: true, trim: true, maxlength: 140 },
    text: richL10n(),
    attachments: [AttachmentSchema],
    blocks: [SolutionBlockSchema],
    answer: richL10n(),
    marks: { type: Number, min: 0, max: 100 },
    source: { type: String, default: '', trim: true, maxlength: 120 },
    difficulty: { type: String, enum: DIFFICULTIES, default: 'medium' },
    tags: [{ type: String, trim: true, lowercase: true, maxlength: 60 }],
    languageMode,
    seo: seo(),
    searchText: { type: String, select: false },
  },
  { timestamps: true },
);

importantQuestionSchema.plugin(contentPlugin);
importantQuestionSchema.index({ class: 1, subject: 1, slug: 1 }, { unique: true });
importantQuestionSchema.index({ searchText: 'text' }, { default_language: 'none' });

importantQuestionSchema.pre('validate', async function buildImportantQuestion() {
  if (!this.slug) {
    const base = l10nText({ en: this.text?.en }).slice(0, 60) || 'important-question';
    this.slug = `${slugify(base, 'important-question')}-${this._id.toString().slice(-5)}`;
  }
  this.slug = slugify(this.slug, 'important-question');
  const [cls, chapter] = await Promise.all([
    this.class ? mongoose.model('Class').findById(this.class).select('number').lean() : null,
    this.chapter ? mongoose.model('Chapter').findById(this.chapter).select('number title').lean() : null,
  ]);
  this.searchText = joinSearch(
    'important questions महत्वपूर्ण प्रश्न',
    labels.class(cls?.number),
    labels.chapter(chapter?.number),
    l10nText(chapter?.title),
    l10nText(this.text),
    l10nText(this.answer),
    blocksText(this.blocks),
    this.source,
    this.tags,
  );
});

export const ImportantQuestion = mongoose.model('ImportantQuestion', importantQuestionSchema);
