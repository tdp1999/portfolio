import {
  AuthErrorCode,
  BlogPostErrorCode,
  CategoryErrorCode,
  CommonErrorCode,
  ContactMessageErrorCode,
  EmailTemplateErrorCode,
  ExperienceErrorCode,
  MediaErrorCode,
  ProfileErrorCode,
  ProjectErrorCode,
  SkillErrorCode,
  TagErrorCode,
  UserErrorCode,
} from '@portfolio/shared/errors';

/**
 * Exhaustive union of every error code the BE can emit. The `${EnumName}` template-literal
 * trick converts each string enum into the union of its values. If you add a value to any
 * enum and forget to add a dictionary entry below, TypeScript will refuse to compile — that
 * is the point.
 */
type AllErrorCodes =
  | `${AuthErrorCode}`
  | `${BlogPostErrorCode}`
  | `${CategoryErrorCode}`
  | `${CommonErrorCode}`
  | `${ContactMessageErrorCode}`
  | `${EmailTemplateErrorCode}`
  | `${ExperienceErrorCode}`
  | `${MediaErrorCode}`
  | `${ProfileErrorCode}`
  | `${ProjectErrorCode}`
  | `${SkillErrorCode}`
  | `${TagErrorCode}`
  | `${UserErrorCode}`;

const VALIDATION_FALLBACK = 'Please fix the highlighted fields and try again.';

export const ERROR_DICTIONARY: Record<AllErrorCodes, string> = {
  // --- Auth ---
  [AuthErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password.',
  [AuthErrorCode.ACCOUNT_LOCKED]: 'Your account has been locked due to too many failed attempts.',
  [AuthErrorCode.INVALID_INPUT]: VALIDATION_FALLBACK,
  [AuthErrorCode.UNAUTHORIZED]: 'You need to sign in to continue.',
  [AuthErrorCode.INVALID_REFRESH_TOKEN]: 'Your session has expired. Please sign in again.',
  [AuthErrorCode.TOKEN_VERSION_MISMATCH]: 'Your session is no longer valid. Please sign in again.',
  [AuthErrorCode.TOKEN_EXPIRED]: 'Your session has expired. Please sign in again.',
  [AuthErrorCode.TOKEN_INVALID]: 'Your session is invalid. Please sign in again.',
  [AuthErrorCode.CSRF_MISMATCH]: 'Security check failed. Please refresh the page and try again.',
  [AuthErrorCode.GOOGLE_AUTH_FAILED]: "Google sign-in didn't complete. Please try again.",
  [AuthErrorCode.GOOGLE_ONLY_ACCOUNT]: 'This account uses Google sign-in. No password is set.',
  [AuthErrorCode.NO_PASSWORD]: 'No password is set for this account.',
  [AuthErrorCode.WRONG_PASSWORD]: 'Current password is incorrect.',
  [AuthErrorCode.INVALID_RESET_TOKEN]: 'Reset link is invalid or expired. Please request a new one.',
  [AuthErrorCode.RESET_TOKEN_EXPIRED]: 'Reset link is invalid or expired. Please request a new one.',
  [AuthErrorCode.INVITE_ONLY]: 'This area is invite-only. Please contact the administrator for access.',
  [AuthErrorCode.ACCOUNT_DELETED]: 'Your account has been deactivated. Contact the administrator.',
  [AuthErrorCode.INVALID_INVITE_TOKEN]: 'Invite link is invalid or expired. Please contact your administrator.',
  [AuthErrorCode.INVITE_TOKEN_EXPIRED]: 'Invite link is invalid or expired. Please contact your administrator.',

  // --- Blog Post ---
  [BlogPostErrorCode.NOT_FOUND]: 'Blog post not found.',
  [BlogPostErrorCode.SLUG_CONFLICT]: 'A blog post with this slug already exists.',
  [BlogPostErrorCode.INVALID_STATUS_TRANSITION]: 'That status change is not allowed for this post.',
  [BlogPostErrorCode.CONTENT_REQUIRED]: 'Content is required to publish this post.',

  // --- Category ---
  [CategoryErrorCode.NOT_FOUND]: 'Category not found.',
  [CategoryErrorCode.INVALID_INPUT]: VALIDATION_FALLBACK,
  [CategoryErrorCode.NAME_TAKEN]: 'A category with this name already exists.',
  [CategoryErrorCode.ALREADY_DELETED]: 'This category has already been deleted.',

  // --- Common ---
  [CommonErrorCode.VALIDATION_ERROR]: VALIDATION_FALLBACK,
  [CommonErrorCode.INTERNAL_ERROR]: 'Something went wrong on our end. Please try again.',
  [CommonErrorCode.NOT_FOUND]: 'The requested resource was not found.',
  [CommonErrorCode.RATE_LIMITED]: 'Too many requests. Please wait a moment and try again.',

  // --- Contact Message ---
  [ContactMessageErrorCode.NOT_FOUND]: 'Message not found.',
  [ContactMessageErrorCode.INVALID_INPUT]: VALIDATION_FALLBACK,
  [ContactMessageErrorCode.ALREADY_DELETED]: 'This message has already been deleted.',
  [ContactMessageErrorCode.ALREADY_ARCHIVED]: 'This message has already been archived.',
  [ContactMessageErrorCode.INVALID_TRANSITION]: 'That status change is not allowed for this message.',
  [ContactMessageErrorCode.RATE_LIMITED]: 'Too many messages. Please wait a moment before sending another.',
  [ContactMessageErrorCode.DISPOSABLE_EMAIL]: 'Please use a permanent email address.',
  [ContactMessageErrorCode.SPAM_DETECTED]: 'Your message looks like spam and was not sent.',

  // --- Email Template ---
  [EmailTemplateErrorCode.NOT_FOUND]: 'Email template not found.',

  // --- Experience ---
  [ExperienceErrorCode.NOT_FOUND]: 'Experience not found.',
  [ExperienceErrorCode.INVALID_INPUT]: VALIDATION_FALLBACK,
  [ExperienceErrorCode.SLUG_TAKEN]: 'An experience with this slug already exists.',
  [ExperienceErrorCode.ALREADY_DELETED]: 'This experience has already been deleted.',
  [ExperienceErrorCode.NOT_DELETED]: 'This experience has not been deleted.',

  // --- Media ---
  [MediaErrorCode.NOT_FOUND]: 'File not found.',
  [MediaErrorCode.INVALID_INPUT]: VALIDATION_FALLBACK,
  [MediaErrorCode.ALREADY_DELETED]: 'This file has already been deleted.',
  [MediaErrorCode.NOT_DELETED]: 'This file has not been deleted.',
  [MediaErrorCode.FILE_TOO_LARGE]: 'This file is too large. Please choose a smaller file.',
  [MediaErrorCode.UNSUPPORTED_TYPE]: 'This file type is not supported.',
  [MediaErrorCode.UPLOAD_FAILED]: 'The upload failed. Please try again.',
  [MediaErrorCode.DELETE_FAILED]: 'Could not delete the file. Please try again.',
  [MediaErrorCode.SECURITY_THREAT]: 'This file was rejected for security reasons.',

  // --- Profile ---
  [ProfileErrorCode.NOT_FOUND]: 'Profile not found.',
  [ProfileErrorCode.INVALID_INPUT]: VALIDATION_FALLBACK,
  [ProfileErrorCode.ALREADY_EXISTS]: 'A profile already exists for this account.',
  [ProfileErrorCode.MEDIA_NOT_FOUND]: 'The selected image could not be found.',

  // --- Project ---
  [ProjectErrorCode.NOT_FOUND]: 'Project not found.',
  [ProjectErrorCode.INVALID_INPUT]: VALIDATION_FALLBACK,
  [ProjectErrorCode.SLUG_CONFLICT]: 'A project with this slug already exists.',
  [ProjectErrorCode.MAX_HIGHLIGHTS_EXCEEDED]: "You've reached the maximum number of highlights for this project.",

  // --- Skill ---
  [SkillErrorCode.NOT_FOUND]: 'Skill not found.',
  [SkillErrorCode.INVALID_INPUT]: VALIDATION_FALLBACK,
  [SkillErrorCode.NAME_TAKEN]: 'A skill with this name already exists.',
  [SkillErrorCode.ALREADY_DELETED]: 'This skill has already been deleted.',
  [SkillErrorCode.CIRCULAR_REFERENCE]: 'A skill cannot be its own parent.',
  [SkillErrorCode.MAX_DEPTH_EXCEEDED]: 'Skills can only be nested one level deep.',
  [SkillErrorCode.PARENT_DELETED]: 'The parent skill has been deleted.',
  [SkillErrorCode.HAS_CHILDREN]: 'Cannot delete a skill that has child skills. Remove or reassign them first.',

  // --- Tag ---
  [TagErrorCode.NOT_FOUND]: 'Tag not found.',
  [TagErrorCode.INVALID_INPUT]: VALIDATION_FALLBACK,
  [TagErrorCode.NAME_TAKEN]: 'A tag with this name already exists.',
  [TagErrorCode.ALREADY_DELETED]: 'This tag has already been deleted.',

  // --- User ---
  [UserErrorCode.NOT_FOUND]: 'User not found.',
  [UserErrorCode.INVALID_INPUT]: VALIDATION_FALLBACK,
  [UserErrorCode.EMAIL_TAKEN]: 'This email is already registered.',
  [UserErrorCode.ACCESS_DENIED]: "You don't have permission to perform this action.",
  [UserErrorCode.ALREADY_ACTIVATED]: 'This account is already activated.',
  [UserErrorCode.ALREADY_DELETED]: 'This user has already been deleted.',
};

/**
 * Look up the user-facing message for an error code. Returns `null` for unknown codes
 * (legacy responses, codes the FE hasn't been deployed for yet) — callers should fall
 * back to the BE-provided message in that case.
 */
export function resolveErrorMessage(errorCode: string | null): string | null {
  if (!errorCode) return null;
  return (ERROR_DICTIONARY as Record<string, string>)[errorCode] ?? null;
}
