import { ZodError } from 'zod';
import { ErrorOptions } from './error-options';
import { formatZodError } from './zod-formatter';

interface DomainErrorConstructPayload {
  statusCode: number;
  errorCode?: string | null;
  error: string;
  message: unknown;
  remarks?: string;
}

export interface DomainErrorPayload {
  statusCode: number;
  errorCode?: string | null;
  error: string;
  message: unknown;
  options?: ErrorOptions;
  remarks?: string;
}

function constructRemarks(options?: ErrorOptions): string | undefined {
  if (!options || (!options.layer && !options.remarks)) return undefined;

  const prefix = options.layer ? `[${options.layer.toUpperCase()}]` : '';
  return `${prefix} ${options.remarks ?? 'No remarks provided.'}`.trim();
}

export class DomainError extends Error {
  statusCode!: number;
  errorCode?: string | null;
  error!: string;
  override message!: string;
  remarks?: string;

  private constructor(payload: DomainErrorConstructPayload) {
    super(typeof payload.message === 'string' ? payload.message : JSON.stringify(payload.message));
    Object.assign(this, payload);
    Object.setPrototypeOf(this, DomainError.prototype);
  }

  toJSON() {
    return {
      name: 'DomainError',
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      error: this.error,
      message: this.message as unknown,
      remarks: this.remarks,
    };
  }

  static fromJSON(json: DomainErrorPayload): DomainError {
    return new DomainError({
      statusCode: json.statusCode,
      errorCode: json.errorCode,
      error: json.error,
      message: json.message,
      remarks: json.remarks || constructRemarks(json.options),
    });
  }
}

// 400
export const BadRequestError = (message: unknown = 'Data is invalid', options?: ErrorOptions) => {
  let messageContent: unknown = message;

  if (messageContent instanceof ZodError) {
    messageContent = formatZodError(messageContent);
  }

  return DomainError.fromJSON({
    statusCode: 400,
    errorCode: options?.errorCode,
    error: 'Bad Request',
    message: messageContent,
    options,
  });
};

// 401
export const UnauthorizedError = (message: unknown = 'Unauthorized', options?: ErrorOptions) => {
  return DomainError.fromJSON({
    statusCode: 401,
    errorCode: options?.errorCode,
    error: 'Unauthorized',
    message,
    options,
  });
};

// 403
export const ForbiddenError = (message: unknown = 'Forbidden', options?: ErrorOptions) => {
  return DomainError.fromJSON({
    statusCode: 403,
    errorCode: options?.errorCode,
    error: 'Forbidden',
    message,
    options,
  });
};

// 404
export const NotFoundError = (message: unknown = 'Not Found', options?: ErrorOptions) => {
  return DomainError.fromJSON({
    statusCode: 404,
    errorCode: options?.errorCode,
    error: 'Not Found',
    message,
    options,
  });
};

// 405
export const MethodNotAllowedError = (
  message: unknown = 'Method Not Allowed',
  options?: ErrorOptions
) => {
  return DomainError.fromJSON({
    statusCode: 405,
    errorCode: options?.errorCode,
    error: 'Method Not Allowed',
    message,
    options,
  });
};

// 500
export const InternalServerError = (
  message: unknown = 'Internal Server Error',
  options?: ErrorOptions
) => {
  return DomainError.fromJSON({
    statusCode: 500,
    errorCode: options?.errorCode,
    error: 'Internal Server Error',
    message,
    options,
  });
};
