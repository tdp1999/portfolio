import { AuthErrorCode } from '@portfolio/shared/errors';

export const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  [AuthErrorCode.INVITE_ONLY]: 'This site is invite-only. Contact the administrator to get access.',
  [AuthErrorCode.ACCOUNT_DELETED]: 'Your account has been deactivated. Contact the administrator.',
};
