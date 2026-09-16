// The admin panel lives on a private, non-guessable path (configure VITE_ADMIN_PATH, keep in sync with server ADMIN_PATH).
export const ADMIN_PATH = (import.meta.env.VITE_ADMIN_PATH || '/pms-control-room').replace(/\/$/, '');
export const API_BASE = import.meta.env.VITE_API_URL || '/api';
export const adminUrl = (path = '') => `${ADMIN_PATH}${path.startsWith('/') || !path ? path : `/${path}`}`;
