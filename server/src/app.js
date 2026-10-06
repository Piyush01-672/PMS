import fs from 'node:fs';
import path from 'node:path';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { csrfProtection } from './middleware/csrf.js';
import { errorHandler, notFound } from './middleware/error.js';
import { apiLimiter } from './middleware/rateLimits.js';
import { sanitizeInput } from './middleware/sanitizeInput.js';
import api from './routes/index.js';
import { renderAppHtml, robotsTxt, sitemapXml } from './services/seoHtml.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', env.TRUST_PROXY);
  app.disable('x-powered-by');

  const imgSources = ["'self'", 'data:', 'blob:', 'https://i.ytimg.com', 'https://img.youtube.com', 'https://res.cloudinary.com'];
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'default-src': ["'self'"],
          'script-src': ["'self'"],
          'style-src': ["'self'", "'unsafe-inline'"],
          'img-src': imgSources,
          'font-src': ["'self'", 'data:'],
          'connect-src': ["'self'"],
          'frame-src': ["'self'", 'https://www.youtube-nocookie.com', 'https://www.youtube.com'],
          'media-src': ["'self'"],
          'object-src': ["'none'"],
          'frame-ancestors': ["'self'"],
          'form-action': ["'self'"],
          'upgrade-insecure-requests': env.isProd ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'same-site' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      strictTransportSecurity: env.isProd ? { maxAge: 31536000, includeSubDomains: true, preload: false } : false,
    }),
  );
  app.use(compression());
  app.use(cors({ origin: env.clientOrigins, credentials: true, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] }));
  if (!env.isTest) app.use(morgan(env.isProd ? 'combined' : 'dev'));

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: false, limit: '256kb' }));
  app.use(cookieParser());
  app.use(sanitizeInput);

  // Locally stored uploads (development / no Cloudinary). SVGs can never execute scripts here.
  app.use(
    '/uploads',
    express.static(path.resolve(env.UPLOAD_DIR), {
      maxAge: '30d',
      immutable: true,
      index: false,
      dotfiles: 'deny',
      setHeaders: (res, filePath) => {
        const lower = String(filePath || '').toLowerCase();
        if (lower.endsWith('.pdf')) {
          res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'self'; object-src 'self'");
        } else if (/\.(mp4|webm|mov|m4v|ogv)$/i.test(lower)) {
          res.setHeader('Content-Security-Policy', "default-src 'none'; media-src 'self'; frame-ancestors 'self'");
        } else {
          res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
        }
        res.setHeader('X-Content-Type-Options', 'nosniff');
      },
    }),
  );

  app.use('/api', apiLimiter, csrfProtection, api);
  app.use('/api', notFound);

  app.get('/robots.txt', async (req, res) => {
    res.type('text/plain').set('Cache-Control', 'public, max-age=3600').send(await robotsTxt());
  });
  app.get('/sitemap.xml', async (req, res) => {
    res.type('application/xml').set('Cache-Control', 'public, max-age=3600').send(await sitemapXml());
  });

  // Production: serve the built React app with server-rendered SEO tags for every content URL.
  const distIndex = path.join(env.CLIENT_DIST_DIR, 'index.html');
  if (fs.existsSync(distIndex)) {
    app.use(
      '/assets',
      express.static(path.join(env.CLIENT_DIST_DIR, 'assets'), { maxAge: '1y', immutable: true, index: false }),
    );
    app.use(express.static(env.CLIENT_DIST_DIR, { index: false, maxAge: '1h' }));
    app.get('/{*splat}', renderAppHtml);
  }

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
