import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { escapeHtml } from '@/lib/notify/escape-html';

const OWNER_EMAIL = 'support@srigovindacollections.com';
const FROM_ADDRESS = 'Sri Govinda Collections Website <orders@srigovindacollections.com>';

export async function POST(request) {
  const { name, email, subject, message } = await request.json();

  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('Contact form submission received but RESEND_API_KEY is not configured — message not delivered.');
    return NextResponse.json({ error: 'Support email is not configured yet. Please reach out via WhatsApp instead.' }, { status: 503 });
  }

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: OWNER_EMAIL,
      replyTo: email.trim(),
      subject: `[Website Contact] ${subject.trim()}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px;">
          <p><strong>From:</strong> ${escapeHtml(name.trim())} (${escapeHtml(email.trim())})</p>
          <p><strong>Subject:</strong> ${escapeHtml(subject.trim())}</p>
          <p><strong>Message:</strong></p>
          <p>${escapeHtml(message.trim()).replace(/\n/g, '<br/>')}</p>
        </div>
      `,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Contact form email failed:', err);
    return NextResponse.json({ error: 'Could not send your message. Please try again or reach out via WhatsApp.' }, { status: 500 });
  }
}
