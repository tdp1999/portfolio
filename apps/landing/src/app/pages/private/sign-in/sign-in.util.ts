import { SIGN_IN_PATH } from '../private.routes';

/** Where sign-in returns to: the page the Owner came from, or home on a direct load (or from itself). */
export function signInReturnUrl(previousUrl: string | undefined): string {
  return previousUrl && !previousUrl.startsWith(`/${SIGN_IN_PATH}`) ? previousUrl : '/';
}
