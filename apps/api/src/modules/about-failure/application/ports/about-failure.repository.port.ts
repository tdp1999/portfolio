import { AboutFailure } from '../../domain/entities/about-failure.entity';

export interface IAboutFailureRepository {
  add(failure: AboutFailure): Promise<string>;
  findById(id: string): Promise<AboutFailure | null>;
  findAll(options?: { onlyPublished?: boolean }): Promise<AboutFailure[]>;
  update(id: string, failure: AboutFailure): Promise<void>;
  delete(id: string): Promise<void>;
  /** Persist a list of (id, order) pairs in a single transaction. */
  reorder(updates: ReadonlyArray<{ id: string; order: number }>): Promise<void>;
}
