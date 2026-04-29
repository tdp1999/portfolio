import { InfrastructureError, DatabaseError, ExternalServiceError } from './infrastructure.error';

describe('InfrastructureError', () => {
  it('should create DatabaseError with status 500', () => {
    const err = DatabaseError();

    expect(err).toBeInstanceOf(InfrastructureError);
    expect(err.statusCode).toBe(500);
    expect(err.error).toBe('DATABASE_ERROR');
    expect(err.message).toBe('Database error');
  });

  it('should create ExternalServiceError with status 502', () => {
    const err = ExternalServiceError();

    expect(err).toBeInstanceOf(InfrastructureError);
    expect(err.statusCode).toBe(502);
    expect(err.error).toBe('EXTERNAL_SERVICE_ERROR');
  });

  it('should serialize cause in toJSON', () => {
    const cause = new Error('connection lost');
    const err = DatabaseError('DB failed', cause);
    const json = err.toJSON();

    expect(json.cause).toEqual({
      name: 'Error',
      message: 'connection lost',
      stack: expect.any(String),
    });
  });

  it('should omit cause from JSON when not provided', () => {
    const err = DatabaseError();
    const json = err.toJSON();

    expect(json.cause).toBeUndefined();
  });
});
