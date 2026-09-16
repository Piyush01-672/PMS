import mongoose from 'mongoose';
import { ObjectId, l10n, textL10n } from './schemas/common.js';

// Files live in Cloudinary (or local disk in development); MongoDB only stores metadata.
const mediaSchema = new mongoose.Schema(
  {
    provider: { type: String, enum: ['cloudinary', 'local'], required: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true, index: true },
    filename: { type: String, default: '' },
    originalName: { type: String, default: '', maxlength: 300 },
    mimeType: { type: String, required: true },
    format: { type: String, default: '' },
    width: Number,
    height: Number,
    bytes: Number,
    title: { type: String, default: '', trim: true, maxlength: 200 },
    alt: l10n(),
    caption: textL10n(),
    description: { type: String, default: '', trim: true, maxlength: 2000 },
    kind: {
      type: String,
      enum: ['image', 'figure', 'diagram', 'graph', 'construction', 'logo', 'thumbnail', 'other'],
      default: 'image',
      index: true,
    },
    tags: [{ type: String, trim: true, lowercase: true, maxlength: 60 }],
    uploadedBy: { type: ObjectId, ref: 'Admin' },
    updatedBy: { type: ObjectId, ref: 'Admin' },
  },
  { timestamps: true },
);

mediaSchema.index(
  { title: 'text', originalName: 'text', 'alt.hi': 'text', 'alt.en': 'text', tags: 'text', description: 'text' },
  { default_language: 'none', name: 'media_text' },
);

export const Media = mongoose.model('Media', mediaSchema);
