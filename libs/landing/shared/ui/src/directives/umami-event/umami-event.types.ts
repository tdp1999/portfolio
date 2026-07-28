/** The global `umami` object the analytics script installs on `window`. */
export type UmamiTracker = { track: (event: string, data?: Record<string, unknown>) => void };
