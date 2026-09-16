import mongoose from 'mongoose';
import { slugify } from '../utils/slug.js';
import { contentPlugin } from './plugins/content.js';
import { AttachmentSchema, ObjectId, languageMode, l10n, richL10n, seo, textL10n } from './schemas/common.js';
import { joinSearch, l10nText, labels } from '../services/searchText.js';

const noteSchema = new mongoose.Schema(
  {
    class: { type: ObjectId, ref: 'Class', required: true, index: true },
    subject: { type: ObjectId, ref: 'Subject', required: true, index: true },
    chapter: { type: ObjectId, ref: 'Chapter', index: true },
    title: l10n(),
    slug: { type: String, required: true, lowercase: true, trim: true, maxlength: 140 },
    summary: textL10n(),
    content: richL10n(),
    attachments: [AttachmentSchema],
    video: { type: ObjectId, ref: 'Video' },
    tags: [{ type: String, trim: true, lowercase: true, maxlength: 60 }],
    languageMode,
    seo: seo(),
    searchText: { type: String, select: false },
  },
  { timestamps: true },
);

noteSchema.plugin(contentPlugin);
noteSchema.index({ class: 1, subject: 1, slug: 1 }, { unique: true });
noteSchema.index({ searchText: 'text' }, { default_language: 'none' });

noteSchema.pre('validate', async function buildNote() {
  this.slug = slugify(this.slug || this.title?.en || this.title?.hi, 'note');
  const [cls, chapter] = await Promise.all([
    this.class ? mongoose.model('Class').findById(this.class).select('number').lean() : null,
    this.chapter ? mongoose.model('Chapter').findById(this.chapter).select('number title').lean() : null,
  ]);
  this.searchText = joinSearch(
    'notes नोट्स',
    labels.class(cls?.number),
    labels.chapter(chapter?.number),
    l10nText(chapter?.title),
    l10nText(this.title),
    l10nText(this.summary),
    l10nText(this.content),
    this.tags,
  );
});

export const Note = mongoose.model('Note', noteSchema);
