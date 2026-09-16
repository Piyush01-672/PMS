import mongoose from 'mongoose';
import { ObjectId } from './schemas/common.js';

const backupSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true, unique: true },
    bytes: Number,
    type: { type: String, enum: ['auto', 'manual', 'pre-restore'], default: 'manual' },
    status: { type: String, enum: ['running', 'completed', 'failed'], default: 'running' },
    error: String,
    collections: [{ _id: false, name: String, count: Number }],
    uploads: { files: Number, copied: Number },
    external: {
      provider: { type: String, enum: ['none', 'directory', 'cloudinary'], default: 'none' },
      location: String,
      status: { type: String, enum: ['skipped', 'completed', 'failed'], default: 'skipped' },
      error: String,
    },
    verifiedAt: Date,
    verifyResult: String,
    restoredAt: Date,
    createdBy: { type: ObjectId, ref: 'Admin' },
  },
  { timestamps: true },
);

export const Backup = mongoose.model('Backup', backupSchema);
