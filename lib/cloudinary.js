// Product photos are uploaded to Cloudinary with no transform (see
// app/api/admin/upload-product-image/route.js), so some existing originals are multi-MB PNGs.
// Cloudinary can re-encode any asset on the fly via URL segments — inserting f_auto,q_auto (and
// an optional width cap) right after `/upload/` gets an auto-negotiated modern format at a sane
// quality with zero re-upload, and fixes already-uploaded oversized images retroactively since
// this is applied at render time, not stored.
const UPLOAD_MARKER = '/upload/';

export function optimizeCloudinaryUrl(url, { width } = {}) {
  if (typeof url !== 'string' || !url.includes('res.cloudinary.com') || !url.includes(UPLOAD_MARKER)) {
    return url;
  }
  const transform = width ? `f_auto,q_auto,w_${width},c_limit` : 'f_auto,q_auto';
  return url.replace(UPLOAD_MARKER, `${UPLOAD_MARKER}${transform}/`);
}
