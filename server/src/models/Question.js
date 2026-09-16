import mongoose from 'mongoose';
import { slugify } from '../utils/slug.js';
import { contentPlugin } from './plugins/content.js';
import {
  AttachmentSchema,
  DIFFICULTIES,
  ObjectId,
  languageMode,
  richL10n,
  seo,
} from './schemas/common.js';
import { joinSearch, l10nText, labels } from '../services/searchText.js';

export const VIDEO_PLACEMENTS = ['afterQuestion', 'beforeSolution', 'afterSolution'];

const questionSchema = new mongoose.Schema(
  {
    exercise: { type: ObjectId, ref: 'Exercise', required: true, index: true },
    chapter: { type: ObjectId, ref: 'Chapter', index: true },
    class: { type: ObjectId, ref: 'Class', index: true },
    subject: { type: ObjectId, ref: 'Subject', index: true },
    number: { type: String, required: true, trim: true, maxlength: 20 },
    slug: { type: String, required: true, lowercase: true, trim: true, maxlength: 120 },
    text: richL10n(),
    languageMode,
    attachments: [AttachmentSchema],
    video: {
      video: { type: ObjectId, ref: 'Video' },
      placement: { type: String, enum: VIDEO_PLACEMENTS, default: 'afterSolution' },
    },
    hint: richL10n(),
    answer: richL10n(),
    importantPoint: richL10n(),
    difficulty: { type: String, enum: DIFFICULTIES, default: 'medium' },
    marks: { type: Number, min: 0, max: 100 },
    tags: [{ type: String, trim: true, lowercase: true, maxlength: 60 }],
    isImportant: { type: Boolean, default: false },
    seo: seo(),
    searchText: { type: String, select: false },
  },
  { timestamps: true },
);

questionSchema.plugin(contentPlugin);
questionSchema.index({ exercise: 1, slug: 1 }, { unique: true });
questionSchema.index({ exercise: 1, sortOrder: 1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ searchText: 'text' }, { default_language: 'none' });

questionSchema.pre('validate', async function buildQuestion() {
  this.slug = slugify(this.slug || `prashn-${this.number}`, `prashn-${this.number}`);
  const exercise = this.exercise
    ? await mongoose.model('Exercise').findById(this.exercise).select('chapter class subject number').lean()
    : null;
  if (!exercise) {
    this.invalidate('exercise', 'Parent exercise not found');
    return;
  }
  this.chapter = exercise.chapter;
  this.class = exercise.class;
  this.subject = exercise.subject;
  const [chapter, cls] = await Promise.all([
    mongoose.model('Chapter').findById(exercise.chapter).select('number title').lean(),
    mongoose.model('Class').findById(exercise.class).select('number').lean(),
  ]);
  this.searchText = joinSearch(
    labels.class(cls?.number),
    labels.chapter(chapter?.number),
    l10nText(chapter?.title),
    labels.exercise(exercise.number),
    labels.question(this.number),
    l10nText(this.text),
    l10nText(this.hint),
    l10nText(this.answer),
    this.tags,
  );
});

export const Question = mongoose.model('Question', questionSchema);
