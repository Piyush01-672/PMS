import mongoose from 'mongoose';
import { ObjectId } from './schemas/common.js';

// Student accounts (reserved for future features such as bookmarks and progress tracking).
const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 120 },
    email: { type: String, lowercase: true, trim: true, unique: true, sparse: true, maxlength: 200 },
    passwordHash: { type: String, select: false },
    isActive: { type: Boolean, default: true },
    preferredLanguage: { type: String, enum: ['hi', 'en'], default: 'hi' },
    classLevel: { type: ObjectId, ref: 'Class' },
    bookmarks: [
      {
        kind: { type: String, enum: ['Chapter', 'Exercise', 'Question', 'Note', 'ImportantQuestion'] },
        item: { type: ObjectId, refPath: 'bookmarks.kind' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    lastLoginAt: Date,
  },
  { timestamps: true },
);

export const User = mongoose.model('User', userSchema);
