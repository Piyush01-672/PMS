// Extracts and validates YouTube video IDs from the URL formats admins typically paste.
const ID_RE = /^[A-Za-z0-9_-]{11}$/;
const YT_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
  'youtu.be',
]);

export function extractYouTubeId(input) {
  if (!input || typeof input !== 'string') return null;
  const value = input.trim();
  if (ID_RE.test(value)) return value;

  let url;
  try {
    url = new URL(value.startsWith('http') ? value : `https://${value}`);
  } catch {
    return null;
  }
  if (!YT_HOSTS.has(url.hostname.toLowerCase())) return null;

  let id = null;
  if (url.hostname.toLowerCase() === 'youtu.be') {
    id = url.pathname.split('/')[1];
  } else if (url.pathname === '/watch') {
    id = url.searchParams.get('v');
  } else {
    const match = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/);
    if (match) id = match[1];
  }
  return id && ID_RE.test(id) ? id : null;
}

export function youTubeThumbnail(id, quality = 'hqdefault') {
  return `https://i.ytimg.com/vi/${id}/${quality}.jpg`;
}

export function youTubeWatchUrl(id) {
  return `https://www.youtube.com/watch?v=${id}`;
}
