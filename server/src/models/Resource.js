import mongoose from 'mongoose';
import { contentPlugin } from './plugins/content.js';
import { ObjectId, l10n, textL10n } from './schemas/common.js';
import { joinSearch, l10nText, labels } from '../services/searchText.js';

const { Schema } = mongoose;

export const RESOURCE_TYPES = [
  'notes',
  'formula_sheet',
  'worksheet',
  'assignment',
  'practice_paper',
  'sample_paper',
  'previous_year_paper',
  'solution',
  'form',
  'revision',
  'question_bank',
  'ncert_books',
  'ncert_notes',
  'cbse_sample_papers',
  'extra_questions',
  'important_questions',
  'english_summaries',
  'syllabus',
  'other',
];

const resourceSchema = new Schema(
  {
    title: l10n(),
    description: textL10n(),
    class: { type: ObjectId, ref: 'Class', index: true },
    subject: { type: ObjectId, ref: 'Subject', index: true },
    chapter: { type: ObjectId, ref: 'Chapter', index: true },
    topic: { type: ObjectId, ref: 'Topic', index: true },
    exercise: { type: ObjectId, ref: 'Exercise', index: true },
    book: { type: ObjectId, ref: 'Book', index: true },
    resourceType: {
      type: String,
      enum: RESOURCE_TYPES,
      default: 'notes',
      index: true,
    },
    file: { type: ObjectId, ref: 'Media' },
    fileUrl: { type: String, default: '', trim: true, maxlength: 2000 },
    externalUrl: { type: String, default: '', trim: true, maxlength: 2000 },
    videoUrl: { type: String, default: '', trim: true, maxlength: 2000 },
    fileSize: { type: String, default: '', trim: true, maxlength: 50 },
    fileType: { type: String, default: 'pdf', trim: true, lowercase: true, maxlength: 20 },
    thumbnail: { type: ObjectId, ref: 'Media' },
    downloadAllowed: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    tags: [{ type: String, trim: true, lowercase: true, maxlength: 60 }],
    searchText: { type: String, select: false },
  },
  { timestamps: true },
);

resourceSchema.plugin(contentPlugin);
resourceSchema.index({ class: 1, subject: 1, chapter: 1, topic: 1 });
resourceSchema.index({ resourceType: 1, status: 1 });
resourceSchema.index({ searchText: 'text' }, { default_language: 'none' });

resourceSchema.pre('validate', async function buildResource() {
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
    l10nText(this.description),
    this.resourceType,
    this.tags,
  );
});

export const Resource = mongoose.model('Resource', resourceSchema);
