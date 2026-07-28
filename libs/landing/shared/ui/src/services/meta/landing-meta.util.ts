/** The path part of a router URL — `og:url` and `canonical` identify a page, not a filter state. */
export function stripQuery(url: string): string {
  return url.split('?')[0].split('#')[0];
}
