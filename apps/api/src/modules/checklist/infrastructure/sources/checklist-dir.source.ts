import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';

import { IChecklistSource } from '../../application/ports/checklist-source.port';

/** Reads a local checkout of the checklist folder (`CHECKLIST_SOURCE_DIR`), so a lane edit shows without a push. */
export class ChecklistDirSource implements IChecklistSource {
  private readonly root: string;

  constructor(dir: string) {
    this.root = resolve(dir);
  }

  async read(path: string): Promise<string> {
    const file = resolve(this.root, path);
    if (!file.startsWith(this.root + sep)) throw new Error(`${path}: outside the checklist folder`);
    return readFile(file, 'utf8');
  }
}
