import mongoose from 'mongoose';
import { RESERVED_SUBJECT_SEGMENTS, slugify } from '../utils/slug.js';
import { contentPlugin } from './plugins/content.js';
import { ObjectId, languageMode, l10n, richL10n, seo, textL10n } from './schemas/common.js';
import { joinSearch, l10nText, labels } from '../services/searchText.js';

const { Schema } = mongoose;

const FormulaSchema = new Schema({
  title: l10n(),
  latex: { type: String, default: '', maxlength: 5000 },
  description: textL10n(),
});

const chapterSchema = new Schema(
  {
    class: { type: ObjectId, ref: 'Class', required: true, index: true },
    subject: { type: ObjectId, ref: 'Subject', required: true, index: true },
    number: { type: Number, required: true, min: 0 },
    title: l10n(),
    slug: { type: String, required: true, lowercase: true, trim: true, maxlength: 120 },
    shortDescription: textL10n(),
    image: { type: ObjectId, ref: 'Media' },
    featuredImage: { type: ObjectId, ref: 'Media' },
    introVideo: { type: ObjectId, ref: 'Video' },
    introduction: richL10n(),
    formulas: [FormulaSchema],
    notes: richL10n(),
    relatedChapters: [{ type: ObjectId, ref: 'Chapter' }],
    featured: { type: Boolean, default: false },
    languageMode,
    seo: seo(),
    searchText: { type: String, select: false },
  },
  { timestamps: true },
);

chapterSchema.plugin(contentPlugin);
chapterSchema.index({ class: 1, subject: 1, slug: 1 }, { unique: true });
chapterSchema.index({ class: 1, subject: 1, sortOrder: 1, number: 1 });
chapterSchema.index({ searchText: 'text' }, { default_language: 'none' });

chapterSchema.pre('validate', async function buildChapter() {
  this.slug = slugify(this.slug || `adhyay-${this.number}`, `adhyay-${this.number}`);
  if (RESERVED_SUBJECT_SEGMENTS.has(this.slug)) this.invalidate('slug', 'This slug is reserved');
  const cls = this.class ? await mongoose.model('Class').findById(this.class).select('number').lean() : null;
  this.searchText = joinSearch(
    labels.class(cls?.number),
    labels.chapter(this.number),
    l10nText(this.title),
    l10nText(this.shortDescription),
    l10nText(this.introduction),
    this.formulas.map((f) => [l10nText(f.title), f.latex, l10nText(f.description)]),
  );
});

chapterSchema.pre('save', function flagChildren() {
  this.$locals.refreshChildren =
    !this.isNew && (this.isModified('number') || this.isModified('title') || this.isModified('class') || this.isModified('subject'));
});

chapterSchema.post('save', function refreshExercises(doc) {
  if (!doc.$locals.refreshChildren) return;
  mongoose
    .model('Exercise')
    .find({ chapter: doc._id })
    .then((items) => Promise.all(items.map((e) => e.save())))
    .catch((err) => console.error('[chapter] failed to refresh exercises', err.message));
});

export const Chapter = mongoose.model('Chapter', chapterSchema);
