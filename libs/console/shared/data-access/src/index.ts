export type { ApiConfig } from './lib/api';
export { API_CONFIG, ApiService, provideApi } from './lib/api';
export type { LoginResponse, UserProfile } from './lib/interfaces';
export { AuthStore } from './lib/auth.store';
export { authInterceptor, csrfInterceptor, errorInterceptor, refreshInterceptor } from './lib/interceptors';
export type { ErrorHandler } from './lib/interceptors';
export { ERROR_HANDLER, SKIP_ERROR_HANDLING } from './lib/interceptors';
export { adminGuard, authGuard, guestGuard } from './lib/guards';
export { ThemeService } from './lib/theme.service';
export type { Theme } from './lib/theme.service';
export type { ApiError } from './lib/errors/api-error';
export { extractApiError } from './lib/errors/api-error';
export { resolveErrorMessage, ERROR_DICTIONARY } from './lib/errors/error-dictionary';
export { ValidationErrorService } from './lib/errors/validation-error.service';
export { ErrorDataService } from './lib/errors/error-data.service';
export { ServerErrorDirective, SERVER_ERROR_FALLBACK } from './lib/errors/server-error.directive';
export type { ServerErrorFallback } from './lib/errors/server-error.directive';
export { FormErrorPipe } from './lib/errors/form-error.pipe';
export { RewardEarlyErrorStateMatcher } from './lib/errors/reward-early-error-state.matcher';
export type { ErrorMessage } from './lib/errors/validation-messages';
export { DEFAULT_VALIDATION_MESSAGES, resolveValidationMessage } from './lib/errors/validation-messages';
export { passwordsMatchValidator, maxDecimalsValidator } from './lib/validators';
export { UnreadBadgeService } from './lib/unread-badge.service';
export { MediaService } from './lib/media/media.service';
export type {
  MediaItem,
  MediaListResponse,
  StorageStats,
  UploadResult,
  BulkUploadResult,
  MediaListParams,
  UpdateMediaPayload,
} from './lib/media/media.types';
