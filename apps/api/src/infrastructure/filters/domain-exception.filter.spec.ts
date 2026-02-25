import { ArgumentsHost } from '@nestjs/common';
import { DomainExceptionFilter } from './domain-exception.filter';
import { UnauthorizedError, NotFoundError } from '@portfolio/shared/errors';

describe('DomainExceptionFilter', () => {
  let filter: DomainExceptionFilter;
  let mockResponse: { status: jest.Mock; json: jest.Mock };
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new DomainExceptionFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => ({}),
        getNext: () => jest.fn(),
      }),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    } as unknown as ArgumentsHost;
  });

  it('should set status code from DomainError', () => {
    const error = UnauthorizedError('Test unauthorized');

    filter.catch(error, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
  });

  it('should return toJSON() as response body', () => {
    const error = NotFoundError('User not found');

    filter.catch(error, mockHost);

    expect(mockResponse.json).toHaveBeenCalledWith(error.toJSON());
  });

  it('should handle 400 status correctly', () => {
    const { BadRequestError } = require('@portfolio/shared/errors');
    const error = BadRequestError('Invalid data');

    filter.catch(error, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, error: 'Bad Request' })
    );
  });
});
