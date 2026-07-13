import { escapeHtml } from './escape-html';

describe('escapeHtml', () => {
  it('escapes HTML special characters', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('escapes quotes and ampersands', () => {
    expect(escapeHtml(`Tom & "Jerry" 'Inc'`)).toBe('Tom &amp; &quot;Jerry&quot; &#39;Inc&#39;');
  });

  it('passes plain text through unchanged', () => {
    expect(escapeHtml('123 Main St, Springfield')).toBe('123 Main St, Springfield');
  });

  it('handles null/undefined as empty string', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });
});
