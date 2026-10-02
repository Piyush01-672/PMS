import mongoose from 'mongoose';
import { ObjectId, l10n, textL10n } from './schemas/common.js';

const { Schema } = mongoose;

export const DEFAULT_TERMINOLOGY = [
  { key: 'home', hi: 'होम', en: 'Home' },
  { key: 'mathematics', hi: 'गणित', en: 'Mathematics' },
  { key: 'class', hi: 'कक्षा', en: 'Class' },
  { key: 'chapter', hi: 'अध्याय', en: 'अध्याय' },
  { key: 'exercise', hi: 'प्रश्नावली', en: 'प्रश्नावली' },
  { key: 'question', hi: 'प्रश्न', en: 'Question' },
  { key: 'solution', hi: 'हल', en: 'Solution' },
  { key: 'hint', hi: 'संकेत', en: 'Hint' },
  { key: 'answer', hi: 'उत्तर', en: 'Answer' },
  { key: 'finalAnswer', hi: 'अंतिम उत्तर', en: 'Final Answer' },
  { key: 'step', hi: 'चरण', en: 'Step' },
  { key: 'construction', hi: 'रचना के चरण', en: 'Steps of Construction' },
  { key: 'diagram', hi: 'आरेख', en: 'Diagram' },
  { key: 'graph', hi: 'ग्राफ', en: 'Graph' },
  { key: 'figure', hi: 'आकृति', en: 'Figure' },
  { key: 'formula', hi: 'सूत्र', en: 'Formula' },
  { key: 'formulas', hi: 'महत्वपूर्ण सूत्र', en: 'Important Formulas' },
  { key: 'note', hi: 'ध्यान दें', en: 'Note' },
  { key: 'warning', hi: 'सावधानी', en: 'Caution' },
  { key: 'tip', hi: 'टिप', en: 'Tip' },
  { key: 'importantPoint', hi: 'महत्वपूर्ण बिंदु', en: 'Important Point' },
  { key: 'notes', hi: 'गणित नोट्स', en: 'Maths Notes' },
  { key: 'importantQuestions', hi: 'महत्वपूर्ण प्रश्न', en: 'Important Questions' },
  { key: 'ncertSolutions', hi: 'NCERT हल', en: 'NCERT Solutions' },
  { key: 'chapterWise', hi: 'अध्याय-wise हल', en: 'अध्याय-wise Solutions' },
  { key: 'exerciseWise', hi: 'प्रश्नावली-wise हल', en: 'प्रश्नावली-wise Solutions' },
  { key: 'search', hi: 'खोजें', en: 'Search' },
  { key: 'related', hi: 'संबंधित सामग्री', en: 'Related Content' },
  { key: 'video', hi: 'वीडियो', en: 'Video' },
  { key: 'watchVideo', hi: 'वीडियो देखें', en: 'Watch Video' },
  { key: 'viewSolution', hi: 'हल देखें', en: 'View Solution' },
  { key: 'hideSolution', hi: 'हल छिपाएँ', en: 'Hide Solution' },
  { key: 'viewInHindi', hi: 'हिंदी में देखें', en: 'हिंदी में देखें' },
  { key: 'viewInEnglish', hi: 'View in English', en: 'View in English' },
  { key: 'loadMore', hi: 'और प्रश्न देखें', en: 'Load more questions' },
  { key: 'marks', hi: 'अंक', en: 'Marks' },
  { key: 'easy', hi: 'सरल', en: 'Easy' },
  { key: 'medium', hi: 'मध्यम', en: 'Medium' },
  { key: 'hard', hi: 'कठिन', en: 'Hard' },
  { key: 'comingSoon', hi: 'जल्द उपलब्ध होगा', en: 'Coming soon' },
  { key: 'noResults', hi: 'कोई परिणाम नहीं मिला', en: 'No results found' },
  { key: 'introduction', hi: 'परिचय', en: 'Introduction' },
  { key: 'questions', hi: 'प्रश्न', en: 'Questions' },
  { key: 'previous', hi: 'पिछला', en: 'Previous' },
  { key: 'next', hi: 'अगला', en: 'Next' },
];

const siteSettingsSchema = new Schema(
  {
    key: { type: String, default: 'site', unique: true },
    brand: {
      name: l10n(),
      shortName: { type: String, default: 'PMS', maxlength: 40 },
      tagline: l10n(),
      logo: { type: ObjectId, ref: 'Media' },
      logoUrl: { type: String, default: '/brand/pms-logo.png', maxlength: 500 },
      logoAlt: { type: String, default: 'Passion Maths Study logo', maxlength: 200 },
      footerLogo: { type: ObjectId, ref: 'Media' },
      favicon: { type: ObjectId, ref: 'Media' },
    },
    header: {
      sticky: { type: Boolean, default: true },
      showSearch: { type: Boolean, default: true },
      searchPlaceholder: l10n(),
      showLanguageSwitch: { type: Boolean, default: true },
      showThemeSwitch: { type: Boolean, default: true },
      showLoginButton: { type: Boolean, default: false },
      loginLabel: l10n(),
      loginUrl: { type: String, default: '', maxlength: 500 },
      showAnnouncement: { type: Boolean, default: true },
      showClassPills: { type: Boolean, default: true },
    },
    footer: {
      description: textL10n(),
      copyright: l10n(),
      disclaimer: textL10n(),
      badges: [l10n()],
      showSocial: { type: Boolean, default: true },
    },
    contact: {
      email: { type: String, default: '', maxlength: 200 },
      phone: { type: String, default: '', maxlength: 40 },
      whatsapp: { type: String, default: '', maxlength: 200 },
      address: textL10n(),
    },
    social: [
      {
        platform: {
          type: String,
          enum: ['youtube', 'facebook', 'instagram', 'x', 'telegram', 'whatsapp', 'linkedin', 'website'],
        },
        url: { type: String, maxlength: 500 },
      },
    ],
    language: {
      default: { type: String, enum: ['hi', 'en'], default: 'hi' },
      enableToggle: { type: Boolean, default: true },
      showLanguageNotice: { type: Boolean, default: true },
    },
    terminology: [
      {
        _id: false,
        key: { type: String, required: true, maxlength: 60 },
        hi: { type: String, default: '', maxlength: 120 },
        en: { type: String, default: '', maxlength: 120 },
      },
    ],
    theme: {
      brandColor: { type: String, default: '#b83a2e', match: /^#[0-9a-fA-F]{6}$/ },
      accentColor: { type: String, default: '#f59e0b', match: /^#[0-9a-fA-F]{6}$/ },
      inkColor: { type: String, default: '#1b1d2a', match: /^#[0-9a-fA-F]{6}$/ },
      defaultMode: { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
    },
    seo: {
      siteUrl: { type: String, default: '', maxlength: 300 },
      titleTemplate: { type: String, default: '%s | Passion Maths Study', maxlength: 120 },
      defaultTitle: l10n(),
      defaultDescription: textL10n(),
      defaultOgImage: { type: ObjectId, ref: 'Media' },
      twitterHandle: { type: String, default: '', maxlength: 60 },
      googleSiteVerification: { type: String, default: '', maxlength: 200 },
      organizationName: { type: String, default: 'Passion Maths Study', maxlength: 120 },
    },
    ads: {
      enabled: { type: Boolean, default: false },
    },
    updatedBy: { type: ObjectId, ref: 'Admin' },
  },
  { timestamps: true },
);

siteSettingsSchema.statics.getSingleton = async function getSingleton() {
  let doc = await this.findOne({ key: 'site' });
  if (!doc) doc = await this.create({ key: 'site', terminology: DEFAULT_TERMINOLOGY });
  return doc;
};

export const SiteSettings = mongoose.model('SiteSettings', siteSettingsSchema);
