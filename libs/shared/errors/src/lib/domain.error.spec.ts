import { ZodError } from 'zod';
import {
  DomainError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  MethodNotAllowedError,
  InternalServerError,
} from './domain.error';
import { ErrorLayer } from './error-layer';

describe('DomainError', () => {
  describe('factory functions', () => {
    it.each([
      { fn: BadRequestError, status: 400, error: 'Bad Request', defaultMsg: 'Data is invalid' },
      { fn: UnauthorizedError, status: 401, error: 'Unauthorized', defaultMsg: 'Unauthorized' },
      { fn: ForbiddenError, status: 403, error: 'Forbidden', defaultMsg: 'Forbidden' },
      { fn: NotFoundError, status: 404, error: 'Not Found', defaultMsg: 'Not Found' },
      {
        fn: MethodNotAllowedError,
        status: 405,
        error: 'Method Not Allowed',
        defaultMsg: 'Method Not Allowed',
      },
      {
        fn: InternalServerError,
        status: 500,
        error: 'Internal Server Error',
        defaultMsg: 'Internal Server Error',
      },
    ])(
      '$error should create DomainError with status $status',
      ({ fn, status, error, defaultMsg }) => {
        const err = fn();

        expect(err).toBeInstanceOf(DomainError);
        expect(err.statusCode).toBe(status);
        expect(err.error).toBe(error);
        expect(err.message).toBe(defaultMsg);
      }
    );
  });

  it('should include custom message', () => {
    const err = NotFoundError('User not found');

    expect(err.message).toBe('User not found');
  });

  it('should include errorCode from options', () => {
    const err = BadRequestError('bad', { errorCode: 'CUSTOM_CODE' });

    expect(err.errorCode).toBe('CUSTOM_CODE');
  });

  it('should construct remarks from options', () => {
    const err = BadRequestError('bad', { layer: ErrorLayer.APPLICATION, remarks: 'extra info' });

    expect(err.remarks).toBe('[APPLICATION] extra info');
  });

  it('should construct remarks with layer only', () => {
    const err = BadRequestError('bad', { layer: ErrorLayer.DOMAIN });

    expect(err.remarks).toBe('[DOMAIN] No remarks provided.');
  });

  it('should serialize to JSON', () => {
    const err = NotFoundError('missing', { errorCode: 'NF' });
    const json = err.toJSON();

    expect(json).toEqual({
      name: 'DomainError',
      statusCode: 404,
      errorCode: 'NF',
      error: 'Not Found',
      message: 'missing',
      remarks: undefined,
    });
  });

  it('should format ZodError in BadRequestError', () => {
    const zodError = new ZodError([
      {
        code: 'invalid_type',
        expected: 'string',
        received: 'number',
        path: ['name'],
        message: 'Expected string',
      },
    ]);
    const err = BadRequestError(zodError);

    expect(err.message).toEqual({ name: ['Expected string'] });
  });
});
