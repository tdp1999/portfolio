import { ErrorOptions } from './error-options';

export interface InfrastructureErrorPayload {
  statusCode: number;
  errorCode?: string | null;
  error: string;
  message: string;
  remarks?: string;
  cause?: Error;
}

export class InfrastructureError extends Error {
  statusCode!: number;
  errorCode?: string | null;
  error!: string;
  override message!: string;
  remarks?: string;
  override cause?: Error;

  private constructor(payload: InfrastructureErrorPayload) {
    super(payload.message);
    Object.assign(this, payload);
    Object.setPrototypeOf(this, InfrastructureError.prototype);
  }

  toJSON() {
    return {
      name: 'InfrastructureError',
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      error: this.error,
      message: this.message,
      remarks: this.remarks,
      cause: this.cause ? InfrastructureError.serializeError(this.cause) : undefined,
    };
  }

  static fromJSON(json: InfrastructureErrorPayload): InfrastructureError {
    return new InfrastructureError({
      statusCode: json.statusCode,
      errorCode: json.errorCode,
      error: json.error,
      message: json.message,
      remarks: json.remarks,
      cause: json.cause,
    });
  }

  private static serializeError(error: Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
}

export const DatabaseError = (
  message = 'Database error',
  cause?: Error,
  options?: ErrorOptions
) => {
  return InfrastructureError.fromJSON({
    statusCode: 500,
    errorCode: options?.errorCode,
    error: 'DATABASE_ERROR',
    message,
    remarks: options?.remarks,
    cause,
  });
};

export const ExternalServiceError = (
  message = 'External service error',
  cause?: Error,
  options?: ErrorOptions
) => {
  return InfrastructureError.fromJSON({
    statusCode: 502,
    errorCode: options?.errorCode,
    error: 'EXTERNAL_SERVICE_ERROR',
    message,
    remarks: options?.remarks,
    cause,
  });
};
