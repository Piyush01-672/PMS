import { env } from '../src/config/env.js';
import { connectDB } from '../src/config/db.js';
import { createApp } from '../src/app.js';
import { SiteSettings } from '../src/models/index.js';

let appPromise;

async function getApp() {
  await connectDB(env.MONGODB_URI);

  if (!appPromise) {
    appPromise = (async () => {
      await SiteSettings.getSingleton();
      return createApp();
    })();
  }

  try {
    return await appPromise;
  } catch (error) {
    appPromise = undefined;
    throw error;
  }
}

export default async function handler(req, res) {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (error) {
    console.error('[vercel-api] failed to initialize request handler', error);
    if (res.headersSent) return;
    return res.status(503).json({ error: 'Service Unavailable' });
  }
}
