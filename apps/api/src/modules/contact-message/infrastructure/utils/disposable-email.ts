// Hardcoded blocklist covers the most common disposable services.
// For broader coverage, consider integrating a maintained package or external API.
const DISPOSABLE_DOMAINS = [
  'mailinator.com',
  'guerrillamail.com',
  'guerrillamail.net',
  'tempmail.com',
  'throwaway.email',
  'temp-mail.org',
  'fakeinbox.com',
  'sharklasers.com',
  'guerrillamailblock.com',
  'grr.la',
  'dispostable.com',
  'yopmail.com',
  'yopmail.fr',
  'trashmail.com',
  'trashmail.me',
  'trashmail.net',
  'mailnesia.com',
  'maildrop.cc',
  'discard.email',
  'mailcatch.com',
  'tempail.com',
  'tempr.email',
  'temp-mail.io',
  'mohmal.com',
  'burpcollaborator.net',
  'mailnator.com',
  'getairmail.com',
  'getnada.com',
  'emailondeck.com',
  'inboxalias.com',
  'jetable.org',
  'meltmail.com',
  'harakirimail.com',
  'mintemail.com',
  'mytrashmail.com',
  'spamgourmet.com',
  'mailexpire.com',
  'incognitomail.org',
  'mailforspam.com',
  'safetymail.info',
  'filzmail.com',
  'trashymail.com',
  'bugmenot.com',
  'spaml.com',
  'tempinbox.com',
  'crazymailing.com',
  'trash-mail.com',
  'fakemailgenerator.com',
  '10minutemail.com',
  'guerrillamail.de',
] as const;

const DISPOSABLE_DOMAIN_SET = new Set<string>(DISPOSABLE_DOMAINS);

export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return DISPOSABLE_DOMAIN_SET.has(domain);
}
