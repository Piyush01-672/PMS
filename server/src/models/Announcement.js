import mongoose from 'mongoose';
import { ObjectId, l10n } from './schemas/common.js';

const announcementSchema = new mongoose.Schema(
  {
    text: l10n(),
    badge: l10n(),
    linkLabel: l10n(),
    linkUrl: { type: String, default: '', maxlength: 500 },
    variant: { type: String, enum: ['brand', 'info', 'success', 'warning'], default: 'brand' },
    startsAt: Date,
    endsAt: Date,
    isVisible: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    createdBy: { type: ObjectId, ref: 'Admin' },
    updatedBy: { type: ObjectId, ref: 'Admin' },
  },
  { timestamps: true },
);

announcementSchema.statics.activeFilter = function activeFilter() {
  const now = new Date();
  return {
    isVisible: true,
    $and: [
      { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
      { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
    ],
  };
};

export const Announcement = mongoose.model('Announcement', announcementSchema);
