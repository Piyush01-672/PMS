import mongoose from 'mongoose';
import { ObjectId } from './schemas/common.js';

const sessionSchema = new mongoose.Schema(
  {
    admin: { type: ObjectId, ref: 'Admin', required: true, index: true },
    sid: { type: String, required: true, unique: true },
    ip: String,
    userAgent: String,
    lastSeenAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// MongoDB removes expired sessions automatically.
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session = mongoose.model('Session', sessionSchema);
