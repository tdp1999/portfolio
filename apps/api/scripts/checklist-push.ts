/**
 * `pnpm checklist:push` — sends the Owner's workflow markdown to the checklist sync route.
 *
 * The markdown folder is the source of truth for templates, the lookup table and the project
 * profiles. This script only reads files and posts them; the API parses, upserts by file name and
 * archives any doc whose file is gone. Runs already made are never changed.
 *
 * Which files count is decided by `ChecklistFilePolicy`, the same rule the API applies, so a
 * README or the profile template in the folder is simply not sent.
 *
 * Env (read from the shell, never from a file):
 *   CHECKLIST_SYNC_TOKEN    required; its SHA-256 is CHECKLIST_SYNC_TOKEN_HASH on the API
 *   CHECKLIST_API_URL       default http://localhost:3000 (prod: https://dashboard-api.thunderphong.com)
 *   CHECKLIST_WORKFLOW_DIR  default ~/Code/personal/learning/workflow
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, relative } from 'node:path';

import { ChecklistFilePolicy } from '../src/modules/checklist/domain/policies/checklist-file.policy';

const DEFAULT_API_URL = 'http://localhost:3000';
const DEFAULT_WORKFLOW_DIR = join(homedir(), 'Code/personal/learning/workflow');

interface SyncResult {
  created: string[];
  updated: string[];
  unchanged: string[];
  archived: string[];
}

/** Relative paths of every file in the folder and its subfolders. */
function listFiles(root: string, dir = root): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? listFiles(root, path) : [relative(root, path)];
  });
}

function fail(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(1);
}

async function main(): Promise<void> {
  const token = process.env['CHECKLIST_SYNC_TOKEN']?.trim();
  if (!token) fail('CHECKLIST_SYNC_TOKEN is not set');

  const apiUrl = (process.env['CHECKLIST_API_URL']?.trim() || DEFAULT_API_URL).replace(/\/$/, '');
  const workflowDir = process.env['CHECKLIST_WORKFLOW_DIR']?.trim() || DEFAULT_WORKFLOW_DIR;

  let paths: string[];
  try {
    paths = listFiles(workflowDir)
      .filter((path) => ChecklistFilePolicy.classify(path) !== null)
      .sort();
  } catch {
    fail(`cannot read ${workflowDir}`);
  }
  if (paths.length === 0) fail(`no checklist files in ${workflowDir}`);

  const files = paths.map((path) => ({ path, content: readFileSync(join(workflowDir, path), 'utf8') }));
  console.log(`→ ${apiUrl} · ${files.length} files from ${workflowDir}`);

  let response: Response;
  try {
    response = await fetch(`${apiUrl}/api/checklist/sync`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ files }),
    });
  } catch (error) {
    fail(`cannot reach ${apiUrl} (${(error as Error).message})`);
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = (body as { message?: unknown } | null)?.message;
    fail(`${response.status} ${typeof message === 'string' ? message : JSON.stringify(message ?? body)}`);
  }

  const result = body as SyncResult;
  for (const [label, slugs] of Object.entries(result)) {
    if (slugs.length > 0) console.log(`  ${label.padEnd(9)} ${slugs.join(', ')}`);
  }
  console.log('✓ synced');
}

void main();
