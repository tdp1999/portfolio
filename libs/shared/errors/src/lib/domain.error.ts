import { ZodError } from 'zod';
import { ErrorOptions } from './error-options';
import { formatZodError } from './zod-formatter';

interface DomainErrorConstructPayload {
  statusCode: number;
  errorCode: string;
  error: string;
  message: string;
  data?: unknown;
  remarks?: string;
}

export interface DomainErrorPayload {
  statusCode: number;
  errorCode: string;
  error: string;
  message: string;
  data?: unknown;
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
  errorCode!: string;
  error!: string;
  override message!: string;
  data?: unknown;
  remarks?: string;

  private constructor(payload: DomainErrorConstructPayload) {
    super(payload.message);
    Object.assign(this, payload);
    Object.setPrototypeOf(this, DomainError.prototype);
  }

  toJSON() {
    return {
      name: 'DomainError',
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      error: this.error,
      message: this.message,
      ...(this.data !== undefined && { data: this.data }),
      remarks: this.remarks,
    };
  }

  static fromJSON(json: DomainErrorPayload): DomainError {
    return new DomainError({
      statusCode: json.statusCode,
      errorCode: json.errorCode,
      error: json.error,
      message: json.message,
      data: json.data,
      remarks: json.remarks || constructRemarks(json.options),
    });
  }
}

// 400
export const BadRequestError = (message: string, options: ErrorOptions, data?: unknown) => {
  return DomainError.fromJSON({
    statusCode: 400,
    errorCode: options.errorCode,
    error: 'Bad Request',
    message,
    data,
    options,
  });
};

// 400 — Zod validation shorthand
export const ValidationError = (error: ZodError, options: ErrorOptions) => {
  return DomainError.fromJSON({
    statusCode: 400,
    errorCode: options.errorCode,
    error: 'Bad Request',
    message: 'Validation failed',
    data: formatZodError(error),
    options,
  });
};

// 401
export const UnauthorizedError = (message: string, options: ErrorOptions, data?: unknown) => {
  return DomainError.fromJSON({
    statusCode: 401,
    errorCode: options.errorCode,
    error: 'Unauthorized',
    message,
    data,
    options,
  });
};

// 403
export const ForbiddenError = (message: string, options: ErrorOptions, data?: unknown) => {
  return DomainError.fromJSON({
    statusCode: 403,
    errorCode: options.errorCode,
    error: 'Forbidden',
    message,
    data,
    options,
  });
};

// 404
export const NotFoundError = (message: string, options: ErrorOptions, data?: unknown) => {
  return DomainError.fromJSON({
    statusCode: 404,
    errorCode: options.errorCode,
    error: 'Not Found',
    message,
    data,
    options,
  });
};

// 405
export const MethodNotAllowedError = (message: string, options: ErrorOptions, data?: unknown) => {
  return DomainError.fromJSON({
    statusCode: 405,
    errorCode: options.errorCode,
    error: 'Method Not Allowed',
    message,
    data,
    options,
  });
};

// 500
export const InternalServerError = (message: string, options: ErrorOptions, data?: unknown) => {
  return DomainError.fromJSON({
    statusCode: 500,
    errorCode: options.errorCode,
    error: 'Internal Server Error',
    message,
    data,
    options,
  });
};
