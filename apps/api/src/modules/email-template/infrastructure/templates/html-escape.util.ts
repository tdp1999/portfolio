export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function sanitizeSubject(str: string): string {
  return str.replace(/[\r\n\t]/g, ' ').trim();
}

export function sanitizeUrl(url: string): string {
  return /^https?:\/\//.test(url) ? escapeHtml(url) : '#';
}
