import { SIGN_IN_PATH } from '../private.routes';

/**
 * Where sign-in returns to: the `next` query param a private page sent the Owner here with, else the
 * page the Owner came from, else home. Only same-site paths count (a leading `/` but not `//`, which
 * a browser reads as another host), and never the sign-in page itself.
 */
export function signInReturnUrl(next: string | null | undefined, previousUrl: string | undefined): string {
  return [next, previousUrl].find(isReturnPath) ?? '/';
}

function isReturnPath(url: string | null | undefined): url is string {
  return !!url && url.startsWith('/') && !url.startsWith('//') && !url.startsWith(`/${SIGN_IN_PATH}`);
}
