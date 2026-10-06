import mongoose from 'mongoose';
import { extractYouTubeId, youTubeThumbnail, youTubeWatchUrl } from '../utils/youtube.js';
import { ObjectId, l10n, textL10n } from './schemas/common.js';

export const VIDEO_PROVIDERS = Object.freeze(['youtube', 'local', 'cloudinary']);

const VIDEO_PROVIDER_SET = new Set(VIDEO_PROVIDERS);

const videoSchema = new mongoose.Schema(
  {
    provider: { type: String, enum: VIDEO_PROVIDERS, required: true, default: 'youtube', index: true },
    youtubeId: {
      type: String,
      required: false,
      match: /^[A-Za-z0-9_-]{11}$/,
    },
    url: { type: String, required: true },
    title: l10n(),
    description: textL10n(),
    thumbnailUrl: { type: String, default: '' },
    // Fields for uploaded video files (provider local or cloudinary)
    mimeType: { type: String, default: '' },
    bytes: { type: Number, default: 0, min: 0 },
    durationSecs: { type: Number, default: 0, min: 0 },
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    publicId: { type: String, default: '' },
    isVisible: { type: Boolean, default: true },
    tags: [{ type: String, trim: true, lowercase: true, maxlength: 60 }],
    createdBy: { type: ObjectId, ref: 'Admin' },
    updatedBy: { type: ObjectId, ref: 'Admin' },
  },
  { timestamps: true },
);

// Partial unique index: YouTube ids must be globally unique, but uploads can repeat null
videoSchema.index(
  { youtubeId: 1 },
  { unique: true, partialFilterExpression: { youtubeId: { $type: 'string' } } },
);
videoSchema.index({ 'title.hi': 'text', 'title.en': 'text', tags: 'text' }, { default_language: 'none' });

videoSchema.pre('validate', function normalizeVideo() {
  const provider = String(this.provider || 'youtube').toLowerCase();
  if (!VIDEO_PROVIDER_SET.has(provider)) {
    const err = new mongoose.Error.ValidationError(this);
    err.addError('provider', new mongoose.Error.ValidatorError({ message: `Provider must be one of: ${VIDEO_PROVIDERS.join(', ')}`, path: 'provider', value: provider }));
    throw err;
  }
  this.provider = provider;

  if (provider === 'youtube') {
    const id = extractYouTubeId(this.youtubeId || this.url);
    if (!id) {
      const err = new mongoose.Error.ValidationError(this);
      err.addError('url', new mongoose.Error.ValidatorError({ message: 'Invalid YouTube URL', path: 'url', value: this.url || this.youtubeId }));
      throw err;
    }
    this.youtubeId = id;
    this.url = youTubeWatchUrl(id);
    if (!this.thumbnailUrl) this.thumbnailUrl = youTubeThumbnail(id);
  } else {
    // local / cloudinary: do not carry over a youtubeId from a different record
    const idStr = typeof this.youtubeId === 'string' ? this.youtubeId.trim() : '';
    this.youtubeId = idStr ? undefined : this.youtubeId === null ? undefined : this.youtubeId;
    if (typeof this.youtubeId === 'string' && this.youtubeId !== '') {
      this.youtubeId = undefined;
    }
    const urlOk = typeof this.url === 'string' && this.url.trim().length > 0;
    if (!urlOk) {
      const err = new mongoose.Error.ValidationError(this);
      err.addError('url', new mongoose.Error.ValidatorError({ message: 'Uploaded video is missing a valid URL', path: 'url', value: this.url }));
      throw err;
    }
  }
});

export const Video = mongoose.model('Video', videoSchema);
