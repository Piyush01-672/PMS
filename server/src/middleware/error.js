import mongoose from 'mongoose';
import multer from 'multer';
import { ZodError } from 'zod';
import { env } from '../config/env.js';

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const notFound = (req, res, next) => next(new ApiError(404, `Not found: ${req.method} ${req.originalUrl}`));

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  let details = err.details;

  if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = 'Validation failed';
    details = Object.fromEntries(Object.entries(err.errors).map(([path, e]) => [path, e.message]));
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err?.code === 11000) {
    status = 409;
    const fields = Object.keys(err.keyValue || err.keyPattern || {});
    message = `Duplicate value: ${fields.join(', ') || 'unique field'} already exists`;
    details = err.keyValue;
  } else if (err instanceof ZodError) {
    status = 400;
    message = 'Validation failed';
    details = Object.fromEntries(err.issues.map((i) => [i.path.join('.') || 'body', i.message]));
  } else if (err instanceof multer.MulterError) {
    status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? `File too large (max ${env.MAX_UPLOAD_MB} MB)` : err.message;
  } else if (err?.type === 'entity.too.large') {
    status = 413;
    message = 'Request body too large';
  } else if (err?.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON body';
  }

  if (status >= 500) {
    console.error('[error]', req.method, req.originalUrl, err);
    if (env.isProd) message = 'Internal server error';
  }

  res.status(status).json({ error: { message, ...(details ? { details } : {}) } });
}
