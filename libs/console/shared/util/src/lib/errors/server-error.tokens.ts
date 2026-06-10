import { InjectionToken } from '@angular/core';
import type { ServerErrorFallback } from './server-error.types';

/** Injection token allowing the directive to toast unmatched field errors. */
export const SERVER_ERROR_FALLBACK = new InjectionToken<ServerErrorFallback>('SERVER_ERROR_FALLBACK');
