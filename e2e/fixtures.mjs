// Throwaway accounts for the isolated end-to-end database (pms_e2e). Never used outside tests.
export const E2E_PORT = 5055;
export const BASE_URL = `http://localhost:${E2E_PORT}`;
export const ADMIN_PATH = '/pms-control-room';
export const E2E_DB = 'mongodb://127.0.0.1:27017/pms_e2e';

export const OWNER = { email: 'owner@e2e.local', password: 'Trial#Maths-9043', name: 'E2E Owner' };
export const EDITOR = { email: 'editor@e2e.local', password: 'Trial#Ganit-7712', name: 'E2E Editor' };

export const OWNER_STATE = 'e2e-results/.auth/owner.json';
export const EDITOR_STATE = 'e2e-results/.auth/editor.json';

export const admin = (path = '') => `${ADMIN_PATH}${path ? `/${path}` : ''}`;

// 1×1 PNG used for upload tests.
export const PNG_1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);
