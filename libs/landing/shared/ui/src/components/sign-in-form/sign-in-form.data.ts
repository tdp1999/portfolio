import type { LandingSignInError } from '@portfolio/landing/shared/util';

import type { LandingCopyKey } from '../../services/copy';

export const SIGN_IN_ERROR_COPY: Readonly<Record<LandingSignInError, LandingCopyKey>> = {
  invalid: 'auth.signIn.error.invalid',
  throttled: 'auth.signIn.error.throttled',
  network: 'auth.signIn.error.network',
  unknown: 'auth.signIn.error.unknown',
};
