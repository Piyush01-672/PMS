import mongoose from 'mongoose';
import { RESERVED_SUBJECT_SEGMENTS, slugify } from '../utils/slug.js';
import { contentPlugin } from './plugins/content.js';
import { AttachmentSchema, DIFFICULTIES, ObjectId, languageMode, l10n, richL10n, seo, textL10n } from './schemas/common.js';
import { joinSearch, l10nText, labels } from '../services/searchText.js';

const { Schema } = mongoose;

const TopicFormulaSchema = new Schema({
  title: l10n(),
  latex: { type: String, default: '', maxlength: 5000 },
  description: textL10n(),
});

const TopicPracticeQuestionSchema = new Schema({
  questionNumber: { type: Number, default: 1 },
  question: l10n(),
  hint: textL10n(),
  answer: l10n(),
  solution: richL10n(),
  difficulty: { type: String, enum: ['beginner', 'easy', 'medium', 'hard'], default: 'easy' },
  marks: { type: Number, default: 1, min: 1, max: 20 },
});

const ExternalLinkSchema = new Schema({
  title: l10n(),
  url: { type: String, required: true, trim: true, maxlength: 1000 },
  description: textL10n(),
  category: { type: String, default: 'reference', maxlength: 100 },
});

const topicSchema = new Schema(
  {
    class: { type: ObjectId, ref: 'Class', required: true, index: true },
    subject: { type: ObjectId, ref: 'Subject', required: true, index: true },
    chapter: { type: ObjectId, ref: 'Chapter', required: true, index: true },
    number: { type: Number, required: true, min: 0 },
    title: l10n(),
    slug: { type: String, required: true, lowercase: true, trim: true, maxlength: 140 },
    shortDescription: textL10n(),
    difficulty: { type: String, enum: ['beginner', 'easy', 'medium', 'hard'], default: 'beginner' },
    estimatedTime: l10n(),
    image: { type: ObjectId, ref: 'Media' },
    featuredImage: { type: ObjectId, ref: 'Media' },
    video: { type: ObjectId, ref: 'Video' },
    videos: [{ type: ObjectId, ref: 'Video' }],
    notes: richL10n(),
    formulas: [TopicFormulaSchema],
    practiceQuestions: [TopicPracticeQuestionSchema],
    attachments: [AttachmentSchema],
    externalLinks: [ExternalLinkSchema],
    resources: [{ type: ObjectId, ref: 'Resource' }],
    books: [{ type: ObjectId, ref: 'Book' }],
    featured: { type: Boolean, default: false },
    languageMode,
    seo: seo(),
    searchText: { type: String, select: false },
  },
  { timestamps: true },
);

topicSchema.plugin(contentPlugin);
topicSchema.index({ chapter: 1, slug: 1 }, { unique: true });
topicSchema.index({ chapter: 1, sortOrder: 1, number: 1 });
topicSchema.index({ class: 1, subject: 1, chapter: 1 });
topicSchema.index({ searchText: 'text' }, { default_language: 'none' });

topicSchema.pre('validate', async function buildTopic() {
  this.slug = slugify(this.slug || this.title?.en || this.title?.hi || `topic-${this.number}`, `topic-${this.number}`);
  if (RESERVED_SUBJECT_SEGMENTS.has(this.slug)) this.invalidate('slug', 'This slug is reserved');

  const [cls, chapter] = await Promise.all([
    this.class ? mongoose.model('Class').findById(this.class).select('number').lean() : null,
    this.chapter ? mongoose.model('Chapter').findById(this.chapter).select('number title').lean() : null,
  ]);

  this.searchText = joinSearch(
    labels.class(cls?.number),
    labels.chapter(chapter?.number),
    l10nText(chapter?.title),
    l10nText(this.title),
    l10nText(this.shortDescription),
    l10nText(this.notes),
    this.formulas?.map((f) => [l10nText(f.title), f.latex, l10nText(f.description)]),
    this.practiceQuestions?.map((q) => [l10nText(q.question), l10nText(q.answer)]),
    this.externalLinks?.map((l) => [l10nText(l.title), l.url, l10nText(l.description)]),
  );
});

export const Topic = mongoose.model('Topic', topicSchema);
