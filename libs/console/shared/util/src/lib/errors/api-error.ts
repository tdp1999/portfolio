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
