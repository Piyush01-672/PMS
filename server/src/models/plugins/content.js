import { ObjectId } from '../schemas/common.js';

export const STATUSES = ['draft', 'published', 'archived'];

// Shared lifecycle fields for every publishable content type.
// "Scheduled" = status "published" with a future publishedAt.
export function contentPlugin(schema) {
  schema.add({
    status: { type: String, enum: STATUSES, default: 'draft', index: true },
    publishedAt: { type: Date, index: true },
    isVisible: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0, index: true },
    createdBy: { type: ObjectId, ref: 'Admin' },
    updatedBy: { type: ObjectId, ref: 'Admin' },
  });

  schema.pre('save', function setPublishedAt() {
    if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
      this.publishedAt = new Date();
    }
  });

  schema.statics.publicFilter = function publicFilter(extra = {}) {
    return { status: 'published', isVisible: true, publishedAt: { $lte: new Date() }, ...extra };
  };
}
