import { ChecklistDocKind } from '@prisma/client';

import { ChecklistDoc } from '../../domain/entities/checklist-doc.entity';

export interface IChecklistDocRepository {
  /** Every doc, archived ones included: a refresh compares the source against all of them. */
  findAll(): Promise<ChecklistDoc[]>;
  findLive(kind?: ChecklistDocKind): Promise<ChecklistDoc[]>;
  findBySlug(kind: ChecklistDocKind, slug: string): Promise<ChecklistDoc | null>;
  /** Writes creates and changes of one refresh in a single transaction. */
  saveSync(created: ChecklistDoc[], changed: ChecklistDoc[]): Promise<void>;
}
