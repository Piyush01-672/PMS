import mongoose from 'mongoose';
import { ObjectId, l10n } from './schemas/common.js';

export const RELATABLE_TYPES = ['Chapter', 'Exercise', 'Question', 'Note', 'ImportantQuestion', 'Page'];

// Manual related links for a content item; automatic suggestions fill the remaining slots.
const relatedContentSchema = new mongoose.Schema(
  {
    sourceType: { type: String, enum: RELATABLE_TYPES, required: true },
    source: { type: ObjectId, refPath: 'sourceType', required: true },
    items: [
      {
        targetType: { type: String, enum: [...RELATABLE_TYPES, 'Url'], required: true },
        target: { type: ObjectId, refPath: 'items.targetType' },
        url: { type: String, default: '', maxlength: 500 },
        label: l10n(),
      },
    ],
    autoFill: { type: Boolean, default: true },
    limit: { type: Number, default: 6, min: 1, max: 24 },
    isVisible: { type: Boolean, default: true },
    updatedBy: { type: ObjectId, ref: 'Admin' },
  },
  { timestamps: true },
);

relatedContentSchema.index({ sourceType: 1, source: 1 }, { unique: true });

export const RelatedContent = mongoose.model('RelatedContent', relatedContentSchema);
