import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';
import { isImage, isPdf } from './imageInfo.js';
import { slugify } from '../utils/slug.js';

if (env.cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

const uploadRoot = path.resolve(env.UPLOAD_DIR);

function uploadToCloudinary(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => (err ? reject(err) : resolve(result)));
    stream.end(buffer);
  });
}

function cloudinaryResourceType(info) {
  if (isImage(info)) return 'image';
  if (isPdf(info)) return 'raw';
  if (info && info.format && ['mp4','webm','mov','m4v','ogv'].includes(info.format)) return 'video';
  return 'auto';
}

// SEO-friendly file names: "<title-or-original-name>-<random>.<ext>"
export async function storeFile({ buffer, info, name, kind = 'file' }) {
  const base = slugify(String(name || 'file').replace(/\.[a-z0-9]+$/i, ''), 'image').slice(0, 60);
  const suffix = crypto.randomBytes(4).toString('hex');
  const ext = String(info?.format || 'bin').toLowerCase();

  if (env.storageProvider === 'cloudinary') {
    const resourceType = cloudinaryResourceType(info);
    const opts = {
      folder: `${env.CLOUDINARY_FOLDER}/${kind}`,
      public_id: `${base}-${suffix}`,
      resource_type: resourceType,
      overwrite: false,
    };
    if (resourceType === 'image' && isImage(info)) {
      if (info.format === 'svg') opts.format = 'svg';
    }
    const result = await uploadToCloudinary(buffer, opts);
    return {
      provider: 'cloudinary',
      url: result.secure_url,
      publicId: result.public_id,
      filename: `${base}-${suffix}.${ext}`,
      width: result.width ?? info?.width ?? null,
      height: result.height ?? info?.height ?? null,
      bytes: result.bytes ?? buffer.length,
      format: result.format ?? ext,
    };
  }

  const now = new Date();
  const dir = path.join(uploadRoot, String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, '0'));
  await fs.mkdir(dir, { recursive: true });
  const filename = `${base}-${suffix}.${ext}`;
  await fs.writeFile(path.join(dir, filename), buffer, { flag: 'wx' });
  const relative = path.relative(uploadRoot, path.join(dir, filename)).split(path.sep).join('/');
  return {
    provider: 'local',
    url: `/uploads/${relative}`,
    publicId: relative,
    filename,
    width: info?.width ?? null,
    height: info?.height ?? null,
    bytes: buffer.length,
    format: ext,
  };
}

export const storeImage = storeFile;

export async function removeFile(media) {
  if (!media?.publicId) return;
  if (media.provider === 'cloudinary') {
    if (env.cloudinaryConfigured) {
      const resourceType = String(media.format || '').toLowerCase() === 'pdf' ? 'raw'
        : ['mp4','webm','mov','m4v','ogv'].includes(String(media.format || '').toLowerCase()) ? 'video'
        : 'image';
      await cloudinary.uploader.destroy(media.publicId, { invalidate: true, resource_type: resourceType });
    }
    return;
  }
  const file = path.resolve(uploadRoot, media.publicId);
  if (!file.startsWith(uploadRoot + path.sep)) return;
  await fs.rm(file, { force: true });
}

export const removeImage = removeFile;

export { cloudinary, uploadRoot };
