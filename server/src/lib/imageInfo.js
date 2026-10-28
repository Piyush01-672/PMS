// Detects the real image type from magic bytes (never trust the client mimetype) and reads dimensions.
// Also detects PDFs (%PDF-) for document uploads.

function pngInfo(buf) {
  if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47 || buf.readUInt32BE(4) !== 0x0d0a1a0a) return null;
  return { format: 'png', mimeType: 'image/png', width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

const SOF_MARKERS = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);

function jpegInfo(buf) {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8 || buf[2] !== 0xff) return null;
  let offset = 2;
  while (offset + 9 < buf.length) {
    if (buf[offset] !== 0xff) return null;
    const marker = buf[offset + 1];
    if (marker === 0xff) {
      offset += 1;
      continue;
    }
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    const length = buf.readUInt16BE(offset + 2);
    if (length < 2) return null;
    if (SOF_MARKERS.has(marker)) {
      return {
        format: 'jpg',
        mimeType: 'image/jpeg',
        height: buf.readUInt16BE(offset + 5),
        width: buf.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + length;
  }
  return { format: 'jpg', mimeType: 'image/jpeg', width: null, height: null };
}

function webpInfo(buf) {
  if (buf.length < 30 || buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') return null;
  const chunk = buf.toString('ascii', 12, 16);
  const base = { format: 'webp', mimeType: 'image/webp' };
  if (chunk === 'VP8 ') {
    return { ...base, width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
  }
  if (chunk === 'VP8L') {
    const bits = buf.readUInt32LE(21);
    return { ...base, width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (chunk === 'VP8X') {
    return { ...base, width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
  }
  return { ...base, width: null, height: null };
}

function svgInfo(buf) {
  const head = buf.subarray(0, Math.min(buf.length, 4096)).toString('utf8');
  if (head.indexOf('\0') !== -1) return null;
  const trimmed = head.replace(/^\uFEFF/, '').trimStart();
  if (!/^(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*(<!DOCTYPE svg[^>]*>\s*)?<svg[\s>]/i.test(trimmed)) return null;

  const tag = trimmed.match(/<svg[^>]*>/i)?.[0] ?? '';
  const num = (attr) => {
    const m = tag.match(new RegExp(`\\s${attr}=["']\\s*([\\d.]+)(px)?\\s*["']`, 'i'));
    return m ? Math.round(Number(m[1])) : null;
  };
  let width = num('width');
  let height = num('height');
  if (!width || !height) {
    const vb = tag.match(/viewBox=["']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)\s*["']/i);
    if (vb) {
      width = Math.round(Number(vb[1]));
      height = Math.round(Number(vb[2]));
    }
  }
  return { format: 'svg', mimeType: 'image/svg+xml', width, height };
}

function pdfInfo(buf) {
  if (buf.length < 5) return null;
  const head = buf.subarray(0, Math.min(buf.length, 1024)).toString('ascii');
  if (!head.startsWith('%PDF-')) return null;
  return { format: 'pdf', mimeType: 'application/pdf', width: null, height: null };
}

function mp4Info(buf) {
  if (buf.length < 12) return null;
  if (buf.readUInt32BE(4) === 0x66747970) {
    const brand = buf.toString('ascii', 8, 12);
    if (['isom', 'mp41', 'mp42', 'm4v ', 'qt  ', 'M4V '].includes(brand) || brand.startsWith('iso') || brand.startsWith('mp4') || brand.startsWith('avc')) {
      const format = brand === 'qt  ' ? 'mov' : (brand === 'M4V ' || brand === 'm4v ' ? 'm4v' : 'mp4');
      return { format, mimeType: format === 'mov' ? 'video/quicktime' : `video/${format}`, width: null, height: null };
    }
  }
  return null;
}

function webmInfo(buf) {
  if (buf.length < 8) return null;
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) {
    return { format: 'webm', mimeType: 'video/webm', width: null, height: null };
  }
  return null;
}

function oggInfo(buf) {
  if (buf.length < 4 || buf.toString('ascii', 0, 4) !== 'OggS') return null;
  return { format: 'ogv', mimeType: 'video/ogg', width: null, height: null };
}

function gifInfo(buf) {
  if (buf.length < 14 || !['GIF87a', 'GIF89a'].includes(buf.toString('ascii', 0, 6)) || buf[buf.length - 1] !== 0x3b) return null;
  const width = buf.readUInt16LE(6);
  const height = buf.readUInt16LE(8);
  return width && height ? { format: 'gif', mimeType: 'image/gif', width, height } : null;
}

export function detectImage(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) return null;
  return pngInfo(buffer) || jpegInfo(buffer) || webpInfo(buffer) || gifInfo(buffer) || svgInfo(buffer);
}

export function detectVideo(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) return null;
  return mp4Info(buffer) || webmInfo(buffer) || oggInfo(buffer);
}

export function detectFile(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) return null;
  return detectImage(buffer) || pdfInfo(buffer) || detectVideo(buffer);
}

export function isImage(info) {
  return Boolean(info && ['png', 'jpg', 'webp', 'gif', 'svg'].includes(info.format));
}

export function isPdf(info) {
  return Boolean(info && info.format === 'pdf');
}

export function isVideo(info) {
  return Boolean(info && ['mp4', 'webm', 'ogv', 'mov', 'm4v'].includes(info && info.format));
}
