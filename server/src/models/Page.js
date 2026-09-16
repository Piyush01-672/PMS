import mongoose from 'mongoose';
import { slugify } from '../utils/slug.js';
import { contentPlugin } from './plugins/content.js';
import { languageMode, l10n, richL10n, seo, textL10n } from './schemas/common.js';
import { joinSearch, l10nText } from '../services/searchText.js';

// Static CMS pages: About Us, Contact, Privacy Policy, Terms & Conditions, …
const pageSchema = new mongoose.Schema(
  {
    title: l10n(),
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 120 },
    excerpt: textL10n(),
    content: richL10n(),
    template: { type: String, enum: ['default', 'contact', 'legal'], default: 'default' },
    languageMode,
    seo: seo(),
    searchText: { type: String, select: false },
  },
  { timestamps: true },
);

pageSchema.plugin(contentPlugin);
pageSchema.index({ searchText: 'text' }, { default_language: 'none' });

pageSchema.pre('validate', function buildPage() {
  this.slug = slugify(this.slug || this.title?.en || this.title?.hi, 'page');
  if (/^class-\d+/.test(this.slug) || ['search', 'api', 'uploads'].includes(this.slug)) {
    this.invalidate('slug', 'This slug is reserved');
  }
  this.searchText = joinSearch(l10nText(this.title), l10nText(this.excerpt), l10nText(this.content));
});

export const Page = mongoose.model('Page', pageSchema);
