/** Hop-by-hop headers Express/Node manage themselves. */
const SKIPPED_HEADERS = ['transfer-encoding', 'connection'];

/**
 * The API response's headers as the proxy sends them on. `Set-Cookie` is kept as a list: `forEach`
 * joins repeated headers into one string, and the browser would then keep only one cookie. Login and
 * refresh set two (`refresh_token` + `csrf_token`), and both must arrive.
 */
export function proxyResponseHeaders(headers: Headers): [string, string | string[]][] {
  const out: [string, string | string[]][] = [];
  headers.forEach((value, key) => {
    if (SKIPPED_HEADERS.includes(key) || key === 'set-cookie') return;
    out.push([key, value]);
  });
  const cookies = headers.getSetCookie();
  if (cookies.length > 0) out.push(['set-cookie', cookies]);
  return out;
}

/** `path` is one of `paths` (given without the leading slash) or a page below it. */
export function isUnderPaths(path: string, paths: readonly string[]): boolean {
  return paths.some((p) => path === `/${p}` || path.startsWith(`/${p}/`));
}
