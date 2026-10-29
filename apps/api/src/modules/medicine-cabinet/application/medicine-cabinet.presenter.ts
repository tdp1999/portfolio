import type { HealthProfileDto, MedicalItemDto, MedicineLookupItem } from '@portfolio/shared/types';
import { HealthProfile } from '../domain/entities/health-profile.entity';
import { MedicalItem } from '../domain/entities/medical-item.entity';

export class MedicineCabinetPresenter {
  static toItem(item: MedicalItem): MedicalItemDto {
    const { createdById: _c, updatedById: _u, deletedAt: _d, deletedById: _db, ...props } = item.toProps();
    return {
      ...props,
      activeIngredients: [...props.activeIngredients],
      createdAt: props.createdAt.toISOString(),
      updatedAt: props.updatedAt.toISOString(),
    };
  }

  static toLookupItem(item: MedicalItem, profileName: string): MedicineLookupItem {
    return { ...MedicineCabinetPresenter.toItem(item), profileName };
  }

  static toProfile(profile: HealthProfile, itemCount: number): HealthProfileDto {
    return {
      id: profile.id,
      name: profile.name,
      itemCount,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    };
  }
}
