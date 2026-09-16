import mongoose from 'mongoose';
import { ObjectId, l10n, languageMode, richL10n, textL10n } from './schemas/common.js';

const { Schema } = mongoose;

export const BLOCK_TYPES = [
  'text',
  'hindiText',
  'englishText',
  'mixedText',
  'explanation',
  'step',
  'construction',
  'calculation',
  'formula',
  'image',
  'diagram',
  'graph',
  'youtube',
  'table',
  'note',
  'warning',
  'tip',
  'finalAnswer',
];

const BlockMediaSchema = new Schema({
  media: { type: ObjectId, ref: 'Media', required: true },
  caption: textL10n(),
  alt: l10n(),
});

// Solution blocks are embedded (ordered array) so reordering is one atomic write.
export const SolutionBlockSchema = new Schema({
  type: { type: String, enum: BLOCK_TYPES, required: true },
  title: l10n(),
  content: richL10n(),
  latex: { type: String, default: '', maxlength: 20_000 },
  displayMode: { type: Boolean, default: true },
  media: [BlockMediaSchema],
  video: { type: ObjectId, ref: 'Video' },
  languageMode,
  isVisible: { type: Boolean, default: true },
});

export const BLOCK_POPULATE = [
  { path: 'media.media', select: 'url width height alt title caption format provider publicId' },
  { path: 'video', select: 'youtubeId url title description thumbnailUrl isVisible' },
];
