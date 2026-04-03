import { InjectionToken } from '@angular/core';

/**
 * Base URL for API calls. Empty string for client-side (relative URLs).
 * Provide an absolute URL (e.g. 'http://localhost:3000') for SSR context.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  factory: () => '',
});
