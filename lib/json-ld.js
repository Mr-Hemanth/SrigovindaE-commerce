// JSON.stringify() output is not safe to drop straight into dangerouslySetInnerHTML: a string
// value containing a literal "</script>" (e.g. an admin-entered product description) would
// close the script tag early and let anything after it be parsed as live HTML. Escaping "<"
// to its unicode equivalent is the standard mitigation — it round-trips through JSON.parse
// identically but can no longer form a closing tag.
export function safeJsonLd(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
