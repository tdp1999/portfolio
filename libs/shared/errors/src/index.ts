export { ErrorLayer } from './lib/error-layer';
export type { ErrorOptions } from './lib/error-options';
export {
  DomainError,
  BadRequestError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  MethodNotAllowedError,
  InternalServerError,
} from './lib/domain.error';
export type { DomainErrorPayload } from './lib/domain.error';
export { InfrastructureError, DatabaseError, ExternalServiceError } from './lib/infrastructure.error';
export type { InfrastructureErrorPayload } from './lib/infrastructure.error';
export { formatZodError, customFlatten } from './lib/zod-formatter';
export { AuthErrorCode } from './lib/error-codes/auth.error-codes';
export { UserErrorCode } from './lib/error-codes/user.error-codes';
export { CommonErrorCode } from './lib/error-codes/common.error-codes';
