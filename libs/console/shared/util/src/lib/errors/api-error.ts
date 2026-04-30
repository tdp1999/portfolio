import { HttpErrorResponse } from '@angular/common/http';

export interface ApiError {
  statusCode: number;
  errorCode: string | null;
  message: string;
  data?: unknown;
}

export function extractApiError(err: HttpErrorResponse): ApiError {
  let body = err.error;

  if (typeof body === 'string' && body.trim() !== '') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      // Nếu là string thường không parse được, gán nó luôn vào message để không mất dữ liệu
      body = { message: body };
    }
  }

  const isObject = body !== null && typeof body === 'object';

  // 3. XỬ LÝ LỖI MẠNG (Client-side / Network)
  if (err.status === 0) {
    return {
      statusCode: 0,
      errorCode: 'NETWORK_ERROR',
      message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng hoặc CORS.',
      data: undefined,
    };
  }

  return {
    statusCode: err.status,
    errorCode: isObject && typeof body.errorCode === 'string' ? body.errorCode : null,
    message: isObject && typeof body.message === 'string' ? body.message : 'An unexpected error occurred',
    data: isObject ? body.data : undefined,
  };
}

/**
 * Joins a `{ field: ['msg', ...] }` field-error map into a human-readable string.
 * Returns null if `data` isn't a field-errors map. Used by `SERVER_ERROR_FALLBACK`
 * to surface unmatched validation errors as a toast.
 */
export function formatFieldErrors(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const entries = Object.entries(data as Record<string, unknown>);
  if (entries.length === 0) return null;
  const parts: string[] = [];
  for (const [field, value] of entries) {
    const messages = Array.isArray(value) ? value.filter((m): m is string => typeof m === 'string') : [];
    if (messages.length === 0) return null;
    parts.push(`${field}: ${messages.join(', ')}`);
  }
  return parts.join('; ');
}
