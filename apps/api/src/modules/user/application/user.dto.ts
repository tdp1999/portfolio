import { z } from 'zod/v4';
import { nonEmptyPartial } from '@portfolio/shared/utils';

const PASSWORD_REGEX = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;
const PASSWORD_ERROR =
  'Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character (#?!@$%^&*-)';

export const PasswordSchema = z.string().regex(PASSWORD_REGEX, PASSWORD_ERROR);

const UserFieldsSchema = z.object({
  email: z.email(),
  name: z.string().min(1).max(100),
});

export const CreateUserSchema = UserFieldsSchema.extend({
  password: PasswordSchema,
});

export const UpdateUserSchema = nonEmptyPartial(UserFieldsSchema);

export type CreateUserDto = z.infer<typeof CreateUserSchema>;
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
