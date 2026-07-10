import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

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

function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'products', resource_type: 'image' },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

// Uploads go through this server route (rather than straight from the browser) so we can
// verify admin auth the same way the other /api/admin/* routes do, and so the Cloudinary API
// secret never has to reach the client.
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

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadToCloudinary(buffer);
    return NextResponse.json({ url: result.secure_url });
  } catch (err) {
    console.error('Cloudinary upload failed:', err);
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 502 });
  }
}
