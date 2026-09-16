import mongoose from 'mongoose';
import { slugify } from '../utils/slug.js';
import { contentPlugin } from './plugins/content.js';
import { l10n, seo, textL10n } from './schemas/common.js';

// Subjects are global (Mathematics today; Science, English, … later) and attached to classes.
// isPublic keeps future subjects hidden from the student website until the owner launches them.
const subjectSchema = new mongoose.Schema(
  {
    name: l10n(),
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 60 },
    description: textL10n(),
    icon: { type: String, default: 'sigma', maxlength: 60 },
    isPublic: { type: Boolean, default: false },
    seo: seo(),
  },
  { timestamps: true },
);

subjectSchema.plugin(contentPlugin);

subjectSchema.pre('validate', function buildSubject() {
  this.slug = slugify(this.slug || this.name?.en, 'subject');
});

export const Subject = mongoose.model('Subject', subjectSchema);
