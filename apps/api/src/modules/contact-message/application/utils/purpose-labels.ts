import { ContactPurpose } from '@prisma/client';

/**
 * Human-readable labels for {@link ContactPurpose} per locale.
 *
 * Used when surfacing purpose to humans (auto-reply email body, admin
 * notification, console UI). Keep in lockstep with the Prisma enum.
 */
const LABELS_EN: Record<ContactPurpose, string> = {
  GENERAL: 'Just saying hi',
  JOB_OPPORTUNITY: 'Hire me',
  FREELANCE: 'Freelance project',
  COLLABORATION: 'Collaboration',
  BUG_REPORT: 'Bug report',
  PRESS: 'Press / podcast',
  OTHER: 'Other',
};

const LABELS_VI: Record<ContactPurpose, string> = {
  GENERAL: 'Chào hỏi',
  JOB_OPPORTUNITY: 'Tuyển dụng',
  FREELANCE: 'Freelance',
  COLLABORATION: 'Hợp tác',
  BUG_REPORT: 'Báo lỗi',
  PRESS: 'Báo chí',
  OTHER: 'Khác',
};

export function humanizePurpose(purpose: ContactPurpose, locale: 'en' | 'vi'): string {
  return (locale === 'vi' ? LABELS_VI : LABELS_EN)[purpose];
}

/**
 * Derive an email subject from the submitted purpose + name. The contact form
 * has no subject input — this synthesizes one consistent across auto-reply and
 * admin notification, and makes inbox filtering easier.
 *
 * Format: `[<purpose>] <name>` (e.g. `[Hire me] John Doe`).
 */
export function deriveContactSubject(purpose: ContactPurpose, name: string, locale: 'en' | 'vi'): string {
  return `[${humanizePurpose(purpose, locale)}] ${name}`;
}
