export const AUTH_LOGIN_URL = '/api/auth/login';
export const AUTH_REFRESH_URL = '/api/auth/refresh';
export const AUTH_LOGOUT_URL = '/api/auth/logout';

/** Requests under `API_PREFIX` carry the access token, except the auth calls themselves. */
export const API_PREFIX = '/api/';
export const AUTH_API_PREFIX = '/api/auth/';

/** Readable cookie the API sets next to the httpOnly refresh cookie; its value goes in `x-csrf-token`. */
export const CSRF_COOKIE = 'csrf_token';
export const CSRF_HEADER = 'x-csrf-token';
