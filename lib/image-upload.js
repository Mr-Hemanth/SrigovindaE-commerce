'use client';

import { auth } from '@/lib/firebase/client';

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.8;

// Downscales and re-encodes an uploaded photo to a web-friendly JPEG before it ever
// leaves the browser, so admins don't have to manually compress product photos
// (raw phone/AI-generated exports were routinely 2-3MB, causing slow/broken loads).
async function compressImage(file) {
  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Image compression failed'))),
      'image/jpeg',
      JPEG_QUALITY
    );
  });
}

export async function uploadProductImage(file) {
  if (!file.type.startsWith('image/')) {
    throw new Error(`"${file.name}" is not an image file.`);
  }
  if (!auth.currentUser) {
    throw new Error('You must be signed in as an admin to upload images.');
  }

  const compressed = await compressImage(file);
  const idToken = await auth.currentUser.getIdToken();

  const formData = new FormData();
  formData.append('file', compressed, 'upload.jpg');

  const res = await fetch('/api/admin/upload-product-image', {
    method: 'POST',
    headers: { Authorization: `Bearer ${idToken}` },
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to upload image');
  }

  const { url } = await res.json();
  return url;
}
