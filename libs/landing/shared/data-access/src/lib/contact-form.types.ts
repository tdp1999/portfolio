export const CONTACT_PURPOSES = ['hire', 'freelance', 'collab', 'press', 'hi'] as const;

export type ContactPurpose = (typeof CONTACT_PURPOSES)[number];

export function isContactPurpose(value: string | null | undefined): value is ContactPurpose {
  if (value === null || value === undefined) return false;
  return (CONTACT_PURPOSES as readonly string[]).includes(value);
}

/**
 * Backend `ContactPurpose` enum (Prisma) — kept in lockstep with the API. The
 * FE-friendly chip ids in {@link CONTACT_PURPOSES} are mapped to these via
 * {@link FE_TO_BE_PURPOSE} before submitting. `PRESS` is pending a BE enum
 * extension; `press` currently maps to `OTHER` until that migration lands.
 */
export type BackendContactPurpose =
  | 'GENERAL'
  | 'JOB_OPPORTUNITY'
  | 'FREELANCE'
  | 'COLLABORATION'
  | 'BUG_REPORT'
  | 'PRESS'
  | 'OTHER';

export const FE_TO_BE_PURPOSE: Record<ContactPurpose, BackendContactPurpose> = {
  hire: 'JOB_OPPORTUNITY',
  freelance: 'FREELANCE',
  collab: 'COLLABORATION',
  press: 'PRESS',
  hi: 'GENERAL',
};

/**
 * FE-facing shape produced by the contact form. The service normalizes this
 * into the wire-shape {@link ContactSubmitPayload} before posting.
 */
export interface ContactFormInput {
  readonly name: string;
  readonly email: string;
  readonly message: string;
  readonly purpose: ContactPurpose;
  readonly locale: 'en' | 'vi';
  /** Honeypot — always empty for legitimate submissions. */
  readonly website: string;
  /** Cloudflare Turnstile token captured by the widget. Optional in dev. */
  readonly turnstileToken?: string;
}

/**
 * Wire shape sent to `POST /api/contact-messages`. Matches the backend Zod
 * `SubmitContactMessageSchema` exactly — keep in sync if either side changes.
 */
export interface ContactSubmitPayload {
  readonly name: string;
  readonly email: string;
  readonly message: string;
  readonly purpose: BackendContactPurpose;
  readonly locale: 'en' | 'vi';
  readonly consentGivenAt: string;
  /** Honeypot — always empty for legitimate submissions. */
  readonly website: string;
  /** Cloudflare Turnstile token. Empty string until widget integration lands. */
  readonly turnstileToken?: string;
}

export interface ContactSubmitResponse {
  readonly id: string;
}
