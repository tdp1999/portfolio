/**
 * Contact form error dictionary + extractor.
 *
 * The API returns a {@link DomainError} envelope with an `errorCode` discriminator
 * (e.g. `CONTACT_MESSAGE_DISPOSABLE_EMAIL`). The landing form is intentionally
 * lightweight — no ServerErrorDirective / dictionary infrastructure like the
 * console — so we map the small set of codes the contact handler can throw
 * directly into user-facing copy per locale.
 *
 * Keep these in sync with `ContactMessageErrorCode` in
 * `libs/shared/utils/errors/src/lib/error-codes/contact-message.error-codes.ts`.
 */

const FALLBACK_EN = 'Something went wrong. Please try again, or email me directly.';
const FALLBACK_VI = 'Có sự cố xảy ra. Vui lòng thử lại hoặc gửi email trực tiếp.';

const DICT_EN: Record<string, string> = {
  CONTACT_MESSAGE_DISPOSABLE_EMAIL:
    "We don't accept disposable email addresses — please use a regular email so I can reply.",
  CONTACT_MESSAGE_RATE_LIMITED: "You've sent quite a few messages already — please wait an hour before trying again.",
  CONTACT_MESSAGE_INVALID_INPUT: 'Some fields look invalid. Please check and try again.',
  CONTACT_MESSAGE_SPAM_DETECTED: 'Your message was flagged. Please rephrase and try again.',
};

const DICT_VI: Record<string, string> = {
  CONTACT_MESSAGE_DISPOSABLE_EMAIL:
    'Mình không nhận email tạm thời — vui lòng dùng email cá nhân hoặc công việc để mình có thể phản hồi.',
  CONTACT_MESSAGE_RATE_LIMITED: 'Bạn đã gửi khá nhiều tin từ địa chỉ này — vui lòng thử lại sau 1 giờ.',
  CONTACT_MESSAGE_INVALID_INPUT: 'Một số trường không hợp lệ. Vui lòng kiểm tra và thử lại.',
  CONTACT_MESSAGE_SPAM_DETECTED: 'Tin nhắn bị flag là spam. Vui lòng diễn đạt khác và thử lại.',
};

/**
 * Extract a user-facing message from an `HttpErrorResponse`-shaped error.
 *
 * Resolution order:
 *   1. Known {@link ContactMessageErrorCode} → curated localized message
 *   2. BE-supplied `message` (verbatim fallback if dictionary missed)
 *   3. Locale-specific generic fallback
 */
export function mapContactSubmitError(err: unknown, locale: 'en' | 'vi'): string {
  const fallback = locale === 'vi' ? FALLBACK_VI : FALLBACK_EN;
  if (!err || typeof err !== 'object') return fallback;
  const body = (err as { error?: { errorCode?: string; message?: string } }).error;
  if (!body) return fallback;

  const dict = locale === 'vi' ? DICT_VI : DICT_EN;
  if (body.errorCode && dict[body.errorCode]) return dict[body.errorCode];
  if (body.message) return body.message;
  return fallback;
}
