import mongoose from 'mongoose';
import { slugify } from '../utils/slug.js';
import { contentPlugin } from './plugins/content.js';
import { ObjectId, languageMode, l10n, richL10n, seo } from './schemas/common.js';
import { joinSearch, l10nText, labels } from '../services/searchText.js';

const exerciseSchema = new mongoose.Schema(
  {
    chapter: { type: ObjectId, ref: 'Chapter', required: true, index: true },
    class: { type: ObjectId, ref: 'Class', index: true },
    subject: { type: ObjectId, ref: 'Subject', index: true },
    number: { type: String, required: true, trim: true, maxlength: 20 },
    title: l10n(),
    slug: { type: String, required: true, lowercase: true, trim: true, maxlength: 120 },
    description: richL10n(),
    instructions: richL10n(),
    introVideo: { type: ObjectId, ref: 'Video' },
    notes: richL10n(),
    languageMode,
    seo: seo(),
    searchText: { type: String, select: false },
  },
  { timestamps: true },
);

exerciseSchema.plugin(contentPlugin);
exerciseSchema.index({ chapter: 1, slug: 1 }, { unique: true });
exerciseSchema.index({ chapter: 1, sortOrder: 1 });
exerciseSchema.index({ searchText: 'text' }, { default_language: 'none' });

exerciseSchema.pre('validate', async function buildExercise() {
  this.slug = slugify(this.slug || `prashnavali-${this.number}`, `prashnavali-${this.number}`);
  const chapter = this.chapter
    ? await mongoose.model('Chapter').findById(this.chapter).select('class subject number title').lean()
    : null;
  if (!chapter) {
    this.invalidate('chapter', 'Parent chapter not found');
    return;
  }
  this.class = chapter.class;
  this.subject = chapter.subject;
  const cls = await mongoose.model('Class').findById(chapter.class).select('number').lean();
  this.searchText = joinSearch(
    labels.class(cls?.number),
    labels.chapter(chapter.number),
    l10nText(chapter.title),
    labels.exercise(this.number),
    l10nText(this.title),
    l10nText(this.description),
  );
});

exerciseSchema.pre('save', function flagChildren() {
  this.$locals.refreshChildren =
    !this.isNew && (this.isModified('number') || this.isModified('chapter') || this.isModified('class'));
});

exerciseSchema.post('save', function refreshQuestions(doc) {
  if (!doc.$locals.refreshChildren) return;
  mongoose
    .model('Question')
    .find({ exercise: doc._id })
    .then((items) => Promise.all(items.map((q) => q.save())))
    .catch((err) => console.error('[exercise] failed to refresh questions', err.message));
});

export const Exercise = mongoose.model('Exercise', exerciseSchema);
