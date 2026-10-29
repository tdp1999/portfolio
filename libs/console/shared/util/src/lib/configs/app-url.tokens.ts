import { InjectionToken } from '@angular/core';

/** Origin of the landing app; `safeReturnTo` only accepts URLs on it (R16.6). */
export const LANDING_URL = new InjectionToken<string>('LANDING_URL');

/** Leaves the console app for a full URL (`returnTo`). Tests replace it with a spy. */
export const EXTERNAL_NAVIGATE = new InjectionToken<(url: string) => void>('EXTERNAL_NAVIGATE');
