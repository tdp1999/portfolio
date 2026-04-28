import { z } from 'zod/v4';
import { nonEmptyPartial, PaginatedQuerySchema } from '@portfolio/shared/utils';
import { EmailSchema, NameSchema, PasswordSchema } from '@portfolio/shared/validation/zod';
import { UserRole } from '../domain/user.types';

export { PasswordSchema };

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

export const PaginationSearchSchema = PaginatedQuerySchema.extend({
  status: z.enum(['active', 'invited', 'deleted']).optional(),
  sortBy: z.enum(['updatedAt', 'name', 'createdAt']).default('updatedAt'),
});

export type UserPublicDto = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  hasPassword: boolean;
  hasGoogleLinked: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type UserAdminDto = UserPublicDto & {
  deletedAt: Date | null;
  hasAcceptedInvite: boolean;
};

export type CreateUserDto = z.infer<typeof CreateUserSchema>;
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
export type CreateUserByAdminDto = z.infer<typeof CreateUserByAdminSchema>;
export type PaginationSearchDto = z.infer<typeof PaginationSearchSchema>;
