import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';
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

// SEO-friendly file names: "<title-or-original-name>-<random>.<ext>"
export async function storeImage({ buffer, info, name, kind = 'image' }) {
  const base = slugify(String(name || 'image').replace(/\.[a-z0-9]+$/i, ''), 'image').slice(0, 60);
  const suffix = crypto.randomBytes(4).toString('hex');

  if (env.storageProvider === 'cloudinary') {
    const result = await uploadToCloudinary(buffer, {
      folder: `${env.CLOUDINARY_FOLDER}/${kind}`,
      public_id: `${base}-${suffix}`,
      resource_type: 'image',
      overwrite: false,
    });
    return {
      provider: 'cloudinary',
      url: result.secure_url,
      publicId: result.public_id,
      filename: `${base}-${suffix}.${info.format}`,
      width: result.width ?? info.width,
      height: result.height ?? info.height,
      bytes: result.bytes ?? buffer.length,
      format: result.format ?? info.format,
    };
  }

  const now = new Date();
  const dir = path.join(uploadRoot, String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, '0'));
  await fs.mkdir(dir, { recursive: true });
  const filename = `${base}-${suffix}.${info.format}`;
  await fs.writeFile(path.join(dir, filename), buffer, { flag: 'wx' });
  const relative = path.relative(uploadRoot, path.join(dir, filename)).split(path.sep).join('/');
  return {
    provider: 'local',
    url: `/uploads/${relative}`,
    publicId: relative,
    filename,
    width: info.width,
    height: info.height,
    bytes: buffer.length,
    format: info.format,
  };
}

export async function removeImage(media) {
  if (!media?.publicId) return;
  if (media.provider === 'cloudinary') {
    if (env.cloudinaryConfigured) {
      await cloudinary.uploader.destroy(media.publicId, { invalidate: true, resource_type: 'image' });
    }
    return;
  }
  const file = path.resolve(uploadRoot, media.publicId);
  if (!file.startsWith(uploadRoot + path.sep)) return;
  await fs.rm(file, { force: true });
}

export { cloudinary, uploadRoot };
