import express from 'express';
import activity from './activity.js';
import admins from './admins.js';
import auth from './auth.js';
import backups from './backups.js';
import content from './content.js';
import dashboard from './dashboard.js';
import media from './media.js';
import publicRoutes, { searchHandler } from './public.js';
import settings from './settings.js';
import videos from './videos.js';
import { searchLimiter } from '../middleware/rateLimits.js';

const api = express.Router();

api.get('/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));
api.use('/auth', auth);
api.use('/public', publicRoutes);
api.get('/search', searchLimiter, searchHandler);
api.use('/', settings);
api.use('/', content);
api.use('/media', media);
api.use('/videos', videos);
api.use('/admins', admins);
api.use('/dashboard', dashboard);
api.use('/activity-logs', activity);
api.use('/backups', backups);

export default api;
