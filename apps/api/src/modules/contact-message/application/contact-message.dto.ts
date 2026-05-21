import { z } from 'zod/v4';

import { stripHtmlTags, PaginatedQuerySchema } from '@portfolio/shared/utils';

export const SubmitContactMessageSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(200)
    .transform((v) => stripHtmlTags(v.trim())),
  email: z.email().max(320),
  purpose: z
    .enum(['GENERAL', 'JOB_OPPORTUNITY', 'FREELANCE', 'COLLABORATION', 'BUG_REPORT', 'PRESS', 'OTHER'])
    .default('GENERAL'),
  subject: z
    .string()
    .max(500)
    .transform((v) => stripHtmlTags(v.trim()))
    .optional(),
  message: z
    .string()
    .min(10)
    .max(5000)
    .transform((v) => v.trim()),
  locale: z.enum(['en', 'vi']).default('en'),
  consentGivenAt: z.iso.datetime(),
  website: z.string().optional(),
  /**
   * Cloudflare Turnstile token captured by the FE widget. Server-side verified
   * in {@link SubmitContactMessageHandler} before any DB write. Optional so
   * non-browser callers (admin tooling, integration tests) can opt out when a
   * dev-mode skip flag is configured.
   */
  turnstileToken: z.string().min(1).optional(),
});

export const ContactMessageQuerySchema = PaginatedQuerySchema.extend({
  status: z
    .union([
      z.enum(['UNREAD', 'READ', 'REPLIED', 'ARCHIVED']),
      z.array(z.enum(['UNREAD', 'READ', 'REPLIED', 'ARCHIVED'])),
    ])
    .optional(),
  purpose: z
    .union([
      z.enum(['GENERAL', 'JOB_OPPORTUNITY', 'FREELANCE', 'COLLABORATION', 'BUG_REPORT', 'PRESS', 'OTHER']),
      z.array(z.enum(['GENERAL', 'JOB_OPPORTUNITY', 'FREELANCE', 'COLLABORATION', 'BUG_REPORT', 'PRESS', 'OTHER'])),
    ])
    .optional(),
  includeDeleted: z.coerce.boolean().default(false),
  includeSpam: z.coerce.boolean().default(false),
  sortBy: z.enum(['createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type SubmitContactMessageDto = z.infer<typeof SubmitContactMessageSchema>;
export type ContactMessageQueryDto = z.infer<typeof ContactMessageQuerySchema>;

export type ContactMessageResponseDto = {
  id: string;
  name: string;
  email: string;
  purpose: string;
  subject: string | null;
  message: string;
  status: string;
  isSpam: boolean;
  locale: string;
  createdAt: Date;
  readAt: Date | null;
  repliedAt: Date | null;
  archivedAt: Date | null;
  expiresAt: Date;
  deletedAt: Date | null;
};

export type ContactMessageListItemDto = {
  id: string;
  name: string;
  email: string;
  purpose: string;
  subject: string | null;
  status: string;
  isSpam: boolean;
  createdAt: Date;
};

export type UnreadCountDto = {
  unreadCount: number;
};
