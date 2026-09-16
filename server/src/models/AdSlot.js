import mongoose from 'mongoose';
import { ObjectId } from './schemas/common.js';

export const AD_PLACEMENTS = ['belowHeader', 'inContent', 'sidebar', 'afterContent', 'aboveFooter'];
export const AD_PAGE_TYPES = ['home', 'class', 'subject', 'chapter', 'exercise', 'question', 'notes', 'page', 'search'];

// Reserved advertising areas. Disabled by default; space is reserved (min-height) only when enabled,
// and ad code runs inside a sandboxed iframe so it can never cover questions/solutions or read the page.
const adSlotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    placement: { type: String, enum: AD_PLACEMENTS, required: true },
    device: { type: String, enum: ['all', 'desktop', 'mobile'], default: 'all' },
    pageTypes: [{ type: String, enum: AD_PAGE_TYPES }],
    code: { type: String, default: '', maxlength: 20_000 },
    minHeightMobile: { type: Number, default: 100, min: 0, max: 600 },
    minHeightDesktop: { type: Number, default: 90, min: 0, max: 600 },
    isEnabled: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    createdBy: { type: ObjectId, ref: 'Admin' },
    updatedBy: { type: ObjectId, ref: 'Admin' },
  },
  { timestamps: true },
);

export const AdSlot = mongoose.model('AdSlot', adSlotSchema);
