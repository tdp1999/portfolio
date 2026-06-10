/**
 * Strip the URL chrome (`https://`, `www.`, trailing slash) for a more
 * scannable display value beside the link. The full URL stays on the `href`.
 */
export function prettyChannelValue(url: string): string {
  if (url.startsWith('mailto:')) return url.slice('mailto:'.length);
  return url
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '');
}
