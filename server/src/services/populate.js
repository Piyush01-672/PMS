export const MEDIA_SELECT = 'url width height alt title caption format provider publicId kind';
export const VIDEO_SELECT = 'youtubeId url title description thumbnailUrl isVisible';

export const blockPopulate = (prefix = 'blocks') => [
  { path: `${prefix}.media.media`, select: MEDIA_SELECT },
  { path: `${prefix}.video`, select: VIDEO_SELECT },
];

export const questionPopulate = [
  { path: 'attachments.media', select: MEDIA_SELECT },
  { path: 'video.video', select: VIDEO_SELECT },
];

const isVisibleVideo = (video) => video && video.isVisible !== false;

export function cleanBlocks(blocks = []) {
  return blocks
    .filter((b) => b.isVisible !== false)
    .map((b) => ({
      ...b,
      media: (b.media || []).filter((m) => m.media),
      video: isVisibleVideo(b.video) ? b.video : null,
    }))
    .filter((b) => {
      if (['image', 'diagram', 'graph'].includes(b.type)) return b.media.length > 0;
      if (b.type === 'youtube') return Boolean(b.video);
      if (b.type === 'formula') return Boolean(b.latex?.trim());
      return true;
    });
}

export function cleanAttachments(attachments = []) {
  return attachments.filter((a) => a.media);
}

export function cleanVideoRef(value) {
  return isVisibleVideo(value) ? value : null;
}
