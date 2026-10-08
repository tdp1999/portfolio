import { ChecklistDocKind } from '@prisma/client';

import { ChecklistDoc } from '../../domain/entities/checklist-doc.entity';

export interface IChecklistDocRepository {
  /** Every doc, archived ones included: a sync compares the push against all of them. */
  findAll(): Promise<ChecklistDoc[]>;
  findLive(kind?: ChecklistDocKind): Promise<ChecklistDoc[]>;
  findBySlug(kind: ChecklistDocKind, slug: string): Promise<ChecklistDoc | null>;
  /** Writes creates and changes of one push in a single transaction. */
  saveSync(created: ChecklistDoc[], changed: ChecklistDoc[]): Promise<void>;
}
