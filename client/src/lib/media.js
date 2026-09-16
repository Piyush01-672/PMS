const WIDTHS = [320, 480, 640, 960, 1280, 1600];

export function imageUrl(media, width) {
  if (!media?.url) return '';
  if (media.provider === 'cloudinary' && width && media.format !== 'svg') {
    return media.url.replace('/upload/', `/upload/f_auto,q_auto,c_limit,w_${width}/`);
  }
  return media.url;
}

export function imageSrcSet(media) {
  if (media?.provider !== 'cloudinary' || media.format === 'svg') return undefined;
  const max = media.width ? media.width * 1.25 : Infinity;
  const widths = WIDTHS.filter((w) => w <= max);
  return widths.length ? widths.map((w) => `${imageUrl(media, w)} ${w}w`).join(', ') : undefined;
}

export function aspectRatio(media) {
  return media?.width && media?.height ? `${media.width} / ${media.height}` : undefined;
}
