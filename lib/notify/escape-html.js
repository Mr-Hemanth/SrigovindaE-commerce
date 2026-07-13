// Escapes untrusted text before it's interpolated into an HTML email template. Without this,
// a customer-supplied name/address/message could inject markup or links into emails sent to
// themselves or the store owner (e.g. the contact form, which emails the owner directly).
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
