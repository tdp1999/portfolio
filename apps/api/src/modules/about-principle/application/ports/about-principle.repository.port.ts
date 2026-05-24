import { AboutPrinciple } from '../../domain/entities/about-principle.entity';

export interface IAboutPrincipleRepository {
  add(principle: AboutPrinciple): Promise<string>;
  findById(id: string): Promise<AboutPrinciple | null>;
  findAll(options?: { onlyPublished?: boolean }): Promise<AboutPrinciple[]>;
  update(id: string, principle: AboutPrinciple): Promise<void>;
  delete(id: string): Promise<void>;
  /** Persist a list of (id, order) pairs in a single transaction. */
  reorder(updates: ReadonlyArray<{ id: string; order: number }>): Promise<void>;
}
