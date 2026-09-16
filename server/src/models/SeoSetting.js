import mongoose from 'mongoose';
import { ROBOTS, ObjectId, l10n, textL10n } from './schemas/common.js';

// Route-level SEO for pages that are not a single content document (home, search, …).
const seoSettingSchema = new mongoose.Schema(
  {
    routeKey: { type: String, required: true, unique: true, maxlength: 60 },
    label: { type: String, default: '', maxlength: 120 },
    title: l10n(),
    description: textL10n(),
    ogImage: { type: ObjectId, ref: 'Media' },
    robots: { type: String, enum: ROBOTS, default: 'index,follow' },
    canonical: { type: String, default: '', maxlength: 500 },
    updatedBy: { type: ObjectId, ref: 'Admin' },
  },
  { timestamps: true },
);

export const SeoSetting = mongoose.model('SeoSetting', seoSettingSchema);
