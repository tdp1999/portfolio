import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';
import { DomainError, InfrastructureError, CommonErrorCode } from '@portfolio/shared/errors';

const isProduction = process.env['NODE_ENV'] === 'production';

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const { remarks, ...json } = exception.toJSON();

    if (isProduction) {
      response.status(exception.statusCode).json(json);
    } else {
      response.status(exception.statusCode).json({ ...json, remarks });
    }
  }
}

@Catch(InfrastructureError)
export class InfrastructureExceptionFilter implements ExceptionFilter {
  catch(exception: InfrastructureError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(500).json({
      name: 'DomainError',
      statusCode: 500,
      errorCode: CommonErrorCode.INTERNAL_ERROR,
      error: 'Internal Server Error',
      message: isProduction ? 'An unexpected error occurred' : exception.message,
    });
  }
}
