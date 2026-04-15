import { z } from 'zod/v4';
import { SocialLinksArraySchema, CertificationsArraySchema, ResumeUrlsSchema } from '@portfolio/shared/utils';

export const UpdateProfileSocialLinksSchema = z.object({
  socialLinks: SocialLinksArraySchema,
  resumeUrls: ResumeUrlsSchema,
  certifications: CertificationsArraySchema,
});

export type UpdateProfileSocialLinksDto = z.infer<typeof UpdateProfileSocialLinksSchema>;
