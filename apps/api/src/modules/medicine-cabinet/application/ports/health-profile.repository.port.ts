import { HealthProfile } from '../../domain/entities/health-profile.entity';

export interface HealthProfileWithItemCount {
  profile: HealthProfile;
  /** Counts only items that are not deleted ('S5 Hộp xóa người'). */
  itemCount: number;
}

export interface IHealthProfileRepository {
  add(profile: HealthProfile): Promise<string>;
  update(id: string, profile: HealthProfile): Promise<void>;
  /** Excludes deleted people. */
  findById(id: string): Promise<HealthProfile | null>;
  /** Case-insensitive, excludes deleted people ('P9 Trùng tên'). */
  findByName(name: string): Promise<HealthProfile | null>;
  findAllWithItemCount(): Promise<HealthProfileWithItemCount[]>;
  /** Soft deletes the person and every item of theirs in one transaction (Q-11). */
  removeWithItems(id: string, deletedProfile: HealthProfile): Promise<void>;
}
