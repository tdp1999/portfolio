import { ChecklistRun } from '../../domain/entities/checklist-run.entity';

export interface IChecklistRunRepository {
  add(run: ChecklistRun): Promise<void>;
  findById(id: string): Promise<ChecklistRun | null>;
  findAll(): Promise<ChecklistRun[]>;
  /** Name and status only. */
  updateMeta(run: ChecklistRun): Promise<void>;
  /**
   * Writes the body only while the stored version is still `baseVersion`. False when another
   * save got there first, between the read and this write.
   */
  saveBody(run: ChecklistRun, baseVersion: number): Promise<boolean>;
  remove(id: string): Promise<void>;
}
