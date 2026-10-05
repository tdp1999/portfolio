export const RADAR_WORKER_CONFIG = Symbol('RADAR_WORKER_CONFIG');

export interface RadarWorkerConfig {
  /** SHA-256 of the machine token, or null when the worker routes are switched off. */
  tokenHash: Buffer | null;
}

const SHA256_HEX = /^[0-9a-f]{64}$/i;

/**
 * Reads `RADAR_WORKER_TOKEN_HASH` (hex SHA-256 of the token the Owner generated). Optional on
 * purpose: when it is unset or malformed the worker routes answer 401 instead of the API refusing
 * to boot, so a deploy never depends on this variable.
 */
export function loadRadarWorkerConfig(value = process.env['RADAR_WORKER_TOKEN_HASH']): RadarWorkerConfig {
  const hex = value?.trim();
  return { tokenHash: hex && SHA256_HEX.test(hex) ? Buffer.from(hex, 'hex') : null };
}
