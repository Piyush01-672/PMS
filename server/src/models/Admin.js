import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { ROLES } from '../lib/permissions.js';
import { ObjectId } from './schemas/common.js';

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 200,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email'],
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: 'editor' },
    isActive: { type: Boolean, default: true },
    totpEnabled: { type: Boolean, default: false },
    totpSecretEnc: { type: String, select: false },
    totpPendingSecretEnc: { type: String, select: false },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: Date,
    lastLoginAt: Date,
    lastLoginIp: String,
    passwordChangedAt: Date,
    createdBy: { type: ObjectId, ref: 'Admin' },
  },
  { timestamps: true },
);

adminSchema.methods.setPassword = async function setPassword(password) {
  this.passwordHash = await bcrypt.hash(password, 12);
  this.passwordChangedAt = new Date();
};

adminSchema.methods.verifyPassword = function verifyPassword(password) {
  return bcrypt.compare(String(password || ''), this.passwordHash || '');
};

adminSchema.methods.isLocked = function isLocked() {
  return Boolean(this.lockUntil && this.lockUntil > new Date());
};

adminSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    isActive: this.isActive,
    totpEnabled: this.totpEnabled,
    lastLoginAt: this.lastLoginAt,
    lastLoginIp: this.lastLoginIp,
    lockUntil: this.lockUntil,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const Admin = mongoose.model('Admin', adminSchema);
