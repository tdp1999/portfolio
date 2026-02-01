/**
 * Mock HTTP response helper for testing API calls
 */
export interface MockHttpResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

/**
 * Creates a successful mock HTTP response
 */
export function createMockHttpResponse<T>(
  data: T,
  status = 200,
  statusText = 'OK'
): MockHttpResponse<T> {
  return { data, status, statusText };
}

/**
 * Creates a mock error HTTP response
 */
export function createMockHttpError(
  status: number,
  statusText: string,
  message?: string
): MockHttpResponse<{ error: string }> {
  return {
    data: { error: message || statusText },
    status,
    statusText,
  };
}

/**
 * Common HTTP errors for testing
 */
export const httpErrors = {
  notFound: () => createMockHttpError(404, 'Not Found', 'Resource not found'),
  unauthorized: () =>
    createMockHttpError(401, 'Unauthorized', 'Authentication required'),
  forbidden: () =>
    createMockHttpError(403, 'Forbidden', 'Access denied'),
  serverError: () =>
    createMockHttpError(500, 'Internal Server Error', 'An unexpected error occurred'),
  badRequest: (message = 'Invalid request') =>
    createMockHttpError(400, 'Bad Request', message),
};
