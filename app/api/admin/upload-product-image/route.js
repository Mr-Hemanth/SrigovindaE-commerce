import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getDownloadURL } from 'firebase-admin/storage';
import { adminAuth, adminDb, adminBucket } from '@/lib/firebase/admin';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;

async function requireAdmin(request) {
  const authHeader = request.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!idToken) return null;
  try {
    const decoded = await adminAuth().verifyIdToken(idToken);
    const userSnap = await adminDb().collection('users').doc(decoded.uid).get();
    if (!userSnap.exists || userSnap.data().isAdmin !== true) return null;
    return decoded;
  } catch {
    return null;
  }
}

// Uploads go through this server route (rather than straight from the browser to Firebase
// Storage) because the Storage bucket has no CORS configuration for direct client uploads —
// routing through our own origin sidesteps that entirely and lets us verify admin auth the
// same way the other /api/admin/* routes do.
export async function POST(request) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, or WebP images are allowed' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Image must be under 5MB' }, { status: 400 });
  }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `products/${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
  const token = randomUUID();

  const buffer = Buffer.from(await file.arrayBuffer());
  const bucketFile = adminBucket().file(path);
  await bucketFile.save(buffer, {
    metadata: {
      contentType: file.type,
      metadata: { firebaseStorageDownloadTokens: token },
    },
  });

  const url = await getDownloadURL(bucketFile);
  return NextResponse.json({ url });
}
