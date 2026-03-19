import {
  AuthErrorCode,
  UserErrorCode,
  CommonErrorCode,
  TagErrorCode,
  CategoryErrorCode,
  SkillErrorCode,
} from '@portfolio/shared/errors';

export const ERROR_DICTIONARY: Record<string, string> = {
  // Auth
  [AuthErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password.',
  [AuthErrorCode.ACCOUNT_LOCKED]: 'Your account has been locked due to too many failed attempts.',
  [AuthErrorCode.WRONG_PASSWORD]: 'Current password is incorrect.',
  [AuthErrorCode.INVALID_RESET_TOKEN]: 'Reset link is invalid or expired. Please request a new one.',
  [AuthErrorCode.RESET_TOKEN_EXPIRED]: 'Reset link is invalid or expired. Please request a new one.',
  [AuthErrorCode.GOOGLE_ONLY_ACCOUNT]: 'This account uses Google sign-in. No password is set.',
  [AuthErrorCode.NO_PASSWORD]: 'No password is set for this account.',
  [AuthErrorCode.ACCOUNT_DELETED]: 'Your account has been deactivated. Contact the administrator.',
  [AuthErrorCode.INVALID_INVITE_TOKEN]: 'Invite link is invalid or expired. Please contact your administrator.',
  [AuthErrorCode.INVITE_TOKEN_EXPIRED]: 'Invite link is invalid or expired. Please contact your administrator.',

  // User
  [UserErrorCode.EMAIL_TAKEN]: 'This email is already registered.',

  // Common
  [CommonErrorCode.NOT_FOUND]: 'The requested resource was not found.',

  // Tag
  [TagErrorCode.NAME_TAKEN]: 'A tag with this name already exists.',
  [TagErrorCode.ALREADY_DELETED]: 'This tag has already been deleted.',

  // Category
  [CategoryErrorCode.NAME_TAKEN]: 'A category with this name already exists.',
  [CategoryErrorCode.ALREADY_DELETED]: 'This category has already been deleted.',

  // Skill
  [SkillErrorCode.NAME_TAKEN]: 'A skill with this name already exists.',
  [SkillErrorCode.ALREADY_DELETED]: 'This skill has already been deleted.',
  [SkillErrorCode.HAS_CHILDREN]: 'Cannot delete a skill that has child skills. Remove or reassign them first.',
  [SkillErrorCode.PARENT_DELETED]: 'The parent skill has been deleted.',
  [SkillErrorCode.MAX_DEPTH_EXCEEDED]: 'Skills can only be nested one level deep.',
  [SkillErrorCode.CIRCULAR_REFERENCE]: 'A skill cannot be its own parent.',
};

export function resolveErrorMessage(errorCode: string | null): string | null {
  if (!errorCode) return null;
  return ERROR_DICTIONARY[errorCode] ?? null;
}
