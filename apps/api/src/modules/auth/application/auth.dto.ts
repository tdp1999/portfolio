import { z } from 'zod/v4';
import { PasswordSchema } from '../../user/application/user.dto';

export const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
  rememberMe: z.boolean().default(false),
});

export type LoginDto = z.infer<typeof LoginSchema>;

export const ChangePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: PasswordSchema,
});

export type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.email(),
});

export type ForgotPasswordDto = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  userId: z.string().min(1),
  newPassword: PasswordSchema,
});

export type ResetPasswordDto = z.infer<typeof ResetPasswordSchema>;

export const GoogleCallbackSchema = z.object({
  email: z.email(),
  name: z.string().min(1),
  googleId: z.string().min(1),
});

export type GoogleCallbackDto = z.infer<typeof GoogleCallbackSchema>;
