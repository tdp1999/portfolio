import { IChecklistSource } from '../../application/ports/checklist-source.port';

import { ChecklistDirSource } from './checklist-dir.source';
import { ChecklistHttpSource } from './checklist-http.source';

const DEFAULT_SOURCE_URL = 'https://raw.githubusercontent.com/tdp1999/claude-code-ctx/master/plugins/ctx/checklist';

/**
 * `CHECKLIST_SOURCE_DIR` (a local folder) wins, for editing lanes in dev. Otherwise the raw URL of
 * the plugin repo, `CHECKLIST_SOURCE_URL` or the default.
 */
export function createChecklistSource(env: NodeJS.ProcessEnv = process.env): IChecklistSource {
  const dir = env['CHECKLIST_SOURCE_DIR']?.trim();
  if (dir) return new ChecklistDirSource(dir);
  return new ChecklistHttpSource(env['CHECKLIST_SOURCE_URL']?.trim() || DEFAULT_SOURCE_URL);
}
