export const TURNSTILE_VERIFIER = Symbol('TURNSTILE_VERIFIER');

export interface ITurnstileVerifier {
  verify(token: string, ip?: string): Promise<boolean>;
}
