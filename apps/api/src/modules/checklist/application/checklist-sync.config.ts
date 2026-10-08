export const CHECKLIST_SYNC_CONFIG = Symbol('CHECKLIST_SYNC_CONFIG');

export interface ChecklistSyncConfig {
  /** SHA-256 of the push token, or null when the sync route is switched off. */
  tokenHash: Buffer | null;
}

const SHA256_HEX = /^[0-9a-f]{64}$/i;

/**
 * Reads `CHECKLIST_SYNC_TOKEN_HASH` (hex SHA-256 of the token `pnpm checklist:push` sends).
 * Optional, as for the Radar worker: unset or malformed answers 401 instead of failing the boot.
 */
export function loadChecklistSyncConfig(value = process.env['CHECKLIST_SYNC_TOKEN_HASH']): ChecklistSyncConfig {
  const hex = value?.trim();
  return { tokenHash: hex && SHA256_HEX.test(hex) ? Buffer.from(hex, 'hex') : null };
}
