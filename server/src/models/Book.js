import mongoose from 'mongoose';
import { contentPlugin } from './plugins/content.js';
import { ObjectId, l10n, textL10n } from './schemas/common.js';
import { joinSearch, l10nText, labels } from '../services/searchText.js';

const { Schema } = mongoose;

export const BOOK_CATEGORIES = [
  'recommended',
  'ncert',
  'reference',
  'exam_prep',
  'practice',
  'olympiad',
  'competitive',
  'other',
];

const bookSchema = new Schema(
  {
    title: l10n(),
    author: { type: String, required: true, trim: true, maxlength: 200 },
    publisher: { type: String, default: '', trim: true, maxlength: 200 },
    edition: { type: String, default: '', trim: true, maxlength: 100 },
    class: { type: ObjectId, ref: 'Class', index: true },
    subject: { type: ObjectId, ref: 'Subject', index: true },
    chapter: { type: ObjectId, ref: 'Chapter', index: true },
    topic: { type: ObjectId, ref: 'Topic', index: true },
    category: {
      type: String,
      enum: BOOK_CATEGORIES,
      default: 'recommended',
      index: true,
    },
    description: textL10n(),
    slug: { type: String, trim: true, lowercase: true, maxlength: 120, index: true },
    hasSolutions: { type: Boolean, default: false },
    pdfFile: { type: ObjectId, ref: 'Media' },
    pdfUrl: { type: String, default: '', trim: true, maxlength: 2000 },
    coverImage: { type: ObjectId, ref: 'Media' },
    coverUrl: { type: String, default: '', trim: true, maxlength: 1000 },
    recommendedFor: l10n(),
    purchaseUrl: { type: String, default: '', trim: true, maxlength: 2000 },
    price: { type: String, default: '', trim: true, maxlength: 50 },
    availability: {
      type: String,
      enum: ['available', 'out_of_stock', 'pre_order'],
      default: 'available',
    },
    featured: { type: Boolean, default: false },
    rating: { type: Number, default: 4.8, min: 1, max: 5 },
    tags: [{ type: String, trim: true, lowercase: true, maxlength: 60 }],
    searchText: { type: String, select: false },
  },
  { timestamps: true },
);

bookSchema.plugin(contentPlugin);
bookSchema.index({ class: 1, subject: 1, category: 1 });
bookSchema.index({ featured: 1, status: 1 });
bookSchema.index({ searchText: 'text' }, { default_language: 'none' });

bookSchema.pre('validate', async function buildBook() {
  if (!this.slug) {
    const raw = this.title?.en || this.title?.hi || this.author || 'book';
    this.slug = String(raw).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `book-${Date.now()}`;
  }
  const [cls, chapter, topic] = await Promise.all([
    this.class ? mongoose.model('Class').findById(this.class).select('number').lean() : null,
    this.chapter ? mongoose.model('Chapter').findById(this.chapter).select('number title').lean() : null,
    this.topic ? mongoose.model('Topic').findById(this.topic).select('number title').lean() : null,
  ]);

  this.searchText = joinSearch(
    labels.class(cls?.number),
    labels.chapter(chapter?.number),
    l10nText(chapter?.title),
    l10nText(topic?.title),
    l10nText(this.title),
    this.author,
    this.publisher,
    this.edition,
    this.category,
    l10nText(this.description),
    l10nText(this.recommendedFor),
    this.tags,
  );
});

export const Book = mongoose.model('Book', bookSchema);
