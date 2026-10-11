import mongoose from 'mongoose';
import { env } from '../server/src/config/env.js';
import { connectDB } from '../server/src/config/db.js';
import { createApp } from '../server/src/app.js';
import { SiteSettings } from '../server/src/models/index.js';

let appInstance = null;

async function getApp() {
  await connectDB(env.MONGODB_URI);
  if (!appInstance) {
    await SiteSettings.getSingleton();
    appInstance = createApp();
  }
  return appInstance;
}

export default async function handler(req, res) {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (error) {
    console.error('[vercel-api] Error processing request:', error);
    const maskedUri = env.MONGODB_URI ? env.MONGODB_URI.replace(/\/\/[^@]*@/, '//***@') : 'NOT_SET';
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error?.message || 'Server error',
      mongoReadyState: mongoose.connection.readyState,
      targetDb: maskedUri,
    });
  }
}
