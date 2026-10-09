/**
 * Owner sign-in on landing (console account). Shared by the session in `shared/data-access` and the
 * gate and form in `shared/ui`, which may not import each other.
 */

/** Where the sign-in stands: checking on load, then one of the two outcomes. */
export type LandingAuthStatus = 'checking' | 'signed-out' | 'signed-in';

/** Why a sign-in attempt failed. The form turns it into copy; the API's wording is not shown. */
export type LandingSignInError = 'invalid' | 'throttled' | 'network' | 'unknown';

export interface LandingCredentials {
  readonly email: string;
  readonly password: string;
}
