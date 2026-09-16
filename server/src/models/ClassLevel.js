import mongoose from 'mongoose';
import { slugify } from '../utils/slug.js';
import { contentPlugin } from './plugins/content.js';
import { ObjectId, l10n, seo, textL10n } from './schemas/common.js';
import { joinSearch, l10nText, labels } from '../services/searchText.js';

const classSchema = new mongoose.Schema(
  {
    number: { type: Number, required: true, unique: true, min: 1, max: 20 },
    name: l10n(),
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 80 },
    description: textL10n(),
    badge: l10n(),
    highlights: [l10n()],
    thumbnail: { type: ObjectId, ref: 'Media' },
    featured: { type: Boolean, default: false },
    subjects: [{ type: ObjectId, ref: 'Subject' }],
    seo: seo(),
    searchText: { type: String, select: false },
  },
  { timestamps: true },
);

classSchema.plugin(contentPlugin);
classSchema.index({ searchText: 'text' }, { default_language: 'none' });

classSchema.pre('validate', function buildClass() {
  this.slug = slugify(this.slug || `class-${this.number}`, `class-${this.number}`);
  this.searchText = joinSearch(labels.class(this.number), l10nText(this.name), l10nText(this.description));
});

classSchema.pre('save', function flagChildren() {
  this.$locals.refreshChildren = !this.isNew && (this.isModified('number') || this.isModified('name'));
});

classSchema.post('save', function refreshChapters(doc) {
  if (!doc.$locals.refreshChildren) return;
  mongoose
    .model('Chapter')
    .find({ class: doc._id })
    .then((chapters) => Promise.all(chapters.map((c) => c.save())))
    .catch((err) => console.error('[class] failed to refresh chapters', err.message));
});

export const ClassLevel = mongoose.model('Class', classSchema);
