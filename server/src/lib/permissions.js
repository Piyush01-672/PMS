export const ROLES = ['superadmin', 'admin', 'editor'];

// Least privilege: editors prepare drafts, admins publish and manage the site, the owner manages access & backups.
const MATRIX = {
  superadmin: ['*'],
  admin: [
    'content:read',
    'content:write',
    'content:publish',
    'content:delete',
    'media:write',
    'media:delete',
    'settings:write',
    'activity:read',
    'backup:read',
    'backup:create',
  ],
  editor: ['content:read', 'content:write', 'media:write'],
};

export function hasPermission(role, permission) {
  const granted = MATRIX[role] || [];
  return granted.includes('*') || granted.includes(permission);
}

export function permissionsFor(role) {
  const granted = MATRIX[role] || [];
  if (granted.includes('*')) {
    return [...new Set(Object.values(MATRIX).flat().filter((p) => p !== '*')), 'users:manage', 'backup:restore', 'ads:code'];
  }
  return granted;
}

const SPECIAL_RE = /[^A-Za-z0-9]/;

export function passwordProblems(password, email = '') {
  const problems = [];
  const value = String(password || '');
  if (value.length < 10) problems.push('at least 10 characters');
  if (!/[a-z]/.test(value)) problems.push('a lowercase letter');
  if (!/[A-Z]/.test(value)) problems.push('an uppercase letter');
  if (!/\d/.test(value)) problems.push('a number');
  if (!SPECIAL_RE.test(value)) problems.push('a symbol');
  const local = String(email).split('@')[0]?.toLowerCase();
  if (local && local.length >= 4 && value.toLowerCase().includes(local)) problems.push('not contain your email name');
  return problems;
}

/** Human-readable password policy error, or null when the password is acceptable. */
export function passwordError(password, email = '', subject = 'Password') {
  const problems = passwordProblems(password, email);
  if (!problems.length) return null;
  const needs = problems.filter((p) => !p.startsWith('not '));
  const parts = [];
  if (needs.length) parts.push(`must have ${needs.join(', ')}`);
  if (needs.length !== problems.length) parts.push('must not contain the name part of the email address');
  return `${subject} ${parts.join(' and ')}`;
}
