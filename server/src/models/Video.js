import mongoose from 'mongoose';
import { extractYouTubeId, youTubeThumbnail, youTubeWatchUrl } from '../utils/youtube.js';
import { ObjectId, l10n, textL10n } from './schemas/common.js';

const videoSchema = new mongoose.Schema(
  {
    youtubeId: { type: String, required: true, unique: true, match: /^[A-Za-z0-9_-]{11}$/ },
    url: { type: String, required: true },
    title: l10n(),
    description: textL10n(),
    thumbnailUrl: { type: String, default: '' },
    isVisible: { type: Boolean, default: true },
    tags: [{ type: String, trim: true, lowercase: true, maxlength: 60 }],
    createdBy: { type: ObjectId, ref: 'Admin' },
    updatedBy: { type: ObjectId, ref: 'Admin' },
  },
  { timestamps: true },
);

videoSchema.index({ 'title.hi': 'text', 'title.en': 'text', tags: 'text' }, { default_language: 'none' });

videoSchema.pre('validate', function normalizeVideo() {
  const id = extractYouTubeId(this.youtubeId || this.url);
  if (!id) {
    this.invalidate('url', 'Invalid YouTube URL');
    return;
  }
  this.youtubeId = id;
  this.url = youTubeWatchUrl(id);
  if (!this.thumbnailUrl) this.thumbnailUrl = youTubeThumbnail(id);
});

export const Video = mongoose.model('Video', videoSchema);
