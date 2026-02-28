import { AuthErrorCode, UserErrorCode, CommonErrorCode } from '@portfolio/shared/errors';

export const ERROR_DICTIONARY: Record<string, string> = {
  [AuthErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password.',
  [AuthErrorCode.ACCOUNT_LOCKED]: 'Your account has been locked due to too many failed attempts.',
  [AuthErrorCode.WRONG_PASSWORD]: 'Current password is incorrect.',
  [AuthErrorCode.INVALID_RESET_TOKEN]: 'Reset link is invalid or expired. Please request a new one.',
  [AuthErrorCode.RESET_TOKEN_EXPIRED]: 'Reset link is invalid or expired. Please request a new one.',
  [AuthErrorCode.GOOGLE_ONLY_ACCOUNT]: 'This account uses Google sign-in. No password is set.',
  [AuthErrorCode.NO_PASSWORD]: 'No password is set for this account.',
  [UserErrorCode.EMAIL_TAKEN]: 'This email is already registered.',
  [CommonErrorCode.NOT_FOUND]: 'The requested resource was not found.',
};

export function resolveErrorMessage(errorCode: string | null): string | null {
  if (!errorCode) return null;
  return ERROR_DICTIONARY[errorCode] ?? null;
}
