import { z } from 'zod/v4';
import { OPEN_TO_VALUE, SOCIAL_PLATFORM } from '@portfolio/shared/types';

// --- Translatable Schemas ---

export const TranslatableSchema = z.object({
  en: z.string().min(1),
  vi: z.string().min(1),
});

export const OptionalTranslatableSchema = z
  .object({
    en: z.string().min(1).optional(),
    vi: z.string().min(1).optional(),
  })
  .nullable()
  .refine((val) => val === null || val.en !== undefined || val.vi !== undefined, {
    message: 'At least one locale (en or vi) must be provided',
  });

export const PartialTranslatableSchema = z
  .object({
    en: z.string().min(1).optional(),
    vi: z.string().min(1).optional(),
  })
  .refine((val) => val.en !== undefined || val.vi !== undefined, {
    message: 'At least one of en or vi is required',
  });

// --- Social Link Schemas ---

export const SocialPlatformSchema = z.enum(Object.values(SOCIAL_PLATFORM) as [string, ...string[]]);

export const SocialLinkSchema = z.object({
  platform: SocialPlatformSchema,
  url: z.url(),
  handle: z.string().optional(),
});

export const SocialLinksArraySchema = z.array(SocialLinkSchema).max(20);

// --- Certification Schemas ---

export const CertificationSchema = z.object({
  name: z.string().min(1).max(200),
  issuer: z.string().min(1).max(200),
  year: z.number().int().min(1990).max(2100),
  url: z.url().optional(),
});

export const CertificationsArraySchema = z.array(CertificationSchema).max(50);

// --- Resume URLs Schema ---

export const ResumeUrlsSchema = z.object({
  en: z.url().optional(),
  vi: z.url().optional(),
});

// --- OpenTo Schema ---

export const OpenToSchema = z.array(z.enum(Object.values(OPEN_TO_VALUE) as [string, ...string[]]));
