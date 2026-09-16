const ID_RE = /^[A-Za-z0-9_-]{11}$/;
const HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com', 'youtu.be']);

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
  const host = url.hostname.toLowerCase();
  if (!HOSTS.has(host)) return null;
  let id = null;
  if (host === 'youtu.be') id = url.pathname.split('/')[1];
  else if (url.pathname === '/watch') id = url.searchParams.get('v');
  else id = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/)?.[1] ?? null;
  return id && ID_RE.test(id) ? id : null;
}

export const youTubeThumb = (id, quality = 'hqdefault') => `https://i.ytimg.com/vi/${id}/${quality}.jpg`;
export const youTubeEmbed = (id) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
