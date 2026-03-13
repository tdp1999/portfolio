import { z } from 'zod/v4';
import { nonEmptyPartial } from '@portfolio/shared/utils';

const PASSWORD_REGEX = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;
const PASSWORD_ERROR =
  'Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character (#?!@$%^&*-)';

// Structural strip only — output encoding in the frontend is the primary XSS defense
const stripHtmlTags = (value: string) => value.replace(/<[^>]*>/g, '');

export const PasswordSchema = z.string().regex(PASSWORD_REGEX, PASSWORD_ERROR);

const NameSchema = z
  .string()
  .min(1)
  .max(100)
  .transform((v) => stripHtmlTags(v.trim()));

const EmailSchema = z.email().transform((v) => v.toLowerCase());

const UserFieldsSchema = z.object({
  email: EmailSchema,
  name: NameSchema,
});

export const CreateUserSchema = UserFieldsSchema.extend({
  password: PasswordSchema,
});

const UpdateUserFieldsSchema = z.object({
  name: NameSchema,
});

export const UpdateUserSchema = nonEmptyPartial(UpdateUserFieldsSchema);

export const CreateUserByAdminSchema = z.object({
  name: NameSchema,
  email: EmailSchema,
  role: z.enum(['ADMIN', 'USER']).default('USER'),
});

export const PaginationSearchSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
});

export type CreateUserDto = z.infer<typeof CreateUserSchema>;
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
export type CreateUserByAdminDto = z.infer<typeof CreateUserByAdminSchema>;
export type PaginationSearchDto = z.infer<typeof PaginationSearchSchema>;
