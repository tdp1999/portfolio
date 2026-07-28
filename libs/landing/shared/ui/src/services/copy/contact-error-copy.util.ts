import { resolveCopy } from './landing-copy.util';
import type { LandingCopyKey } from './landing-copy.types';
import type { Locale } from '@portfolio/shared/types';

/**
 * Contact form error dictionary + extractor.
 *
 * The API returns a {@link DomainError} envelope with an `errorCode` discriminator
 * (e.g. `CONTACT_MESSAGE_DISPOSABLE_EMAIL`). The landing form is intentionally
 * lightweight — no ServerErrorDirective / dictionary infrastructure like the
 * console — so we map the small set of codes the contact handler can throw onto
 * copy keys, and let `LANDING_COPY` own the wording per locale (task 388).
 *
 * Keep these in sync with `ContactMessageErrorCode` in
 * `libs/shared/utils/errors/src/lib/error-codes/contact-message.error-codes.ts`.
 */
const COPY_KEY_BY_CODE: Readonly<Record<string, LandingCopyKey>> = {
  CONTACT_MESSAGE_DISPOSABLE_EMAIL: 'error.contact.disposableEmail',
  CONTACT_MESSAGE_RATE_LIMITED: 'error.contact.rateLimited',
  CONTACT_MESSAGE_INVALID_INPUT: 'error.contact.invalidInput',
  CONTACT_MESSAGE_SPAM_DETECTED: 'error.contact.spamDetected',
};

/**
 * Extract a user-facing message from an `HttpErrorResponse`-shaped error.
 *
 * Resolution order:
 *   1. Known {@link ContactMessageErrorCode} → curated localized message
 *   2. BE-supplied `message` (verbatim fallback if the code was unrecognized)
 *   3. Locale-specific generic fallback
 */
export function mapContactSubmitError(err: unknown, locale: Locale): string {
  const fallback = resolveCopy('error.contact.fallback', locale);
  if (!err || typeof err !== 'object') return fallback;
  const body = (err as { error?: { errorCode?: string; message?: string } }).error;
  if (!body) return fallback;

  const key = body.errorCode ? COPY_KEY_BY_CODE[body.errorCode] : undefined;
  if (key) return resolveCopy(key, locale);
  if (body.message) return body.message;
  return fallback;
}
