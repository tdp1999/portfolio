import { HealthProfile as PrismaHealthProfile, MedicalItem as PrismaMedicalItem } from '@prisma/client';
import { HealthProfile } from '../../domain/entities/health-profile.entity';
import { MedicalItem } from '../../domain/entities/medical-item.entity';

export class HealthProfileMapper {
  static toDomain(raw: PrismaHealthProfile): HealthProfile {
    return HealthProfile.load({ ...raw });
  }

  static toPrisma(profile: HealthProfile): Omit<PrismaHealthProfile, 'createdAt' | 'updatedAt'> {
    const { createdAt: _createdAt, updatedAt: _updatedAt, ...props } = profile.toProps();
    return props;
  }
}

export class MedicalItemMapper {
  static toDomain(raw: PrismaMedicalItem): MedicalItem {
    return MedicalItem.load({ ...raw });
  }

  static toPrisma(item: MedicalItem): Omit<PrismaMedicalItem, 'createdAt' | 'updatedAt'> {
    const { createdAt: _createdAt, updatedAt: _updatedAt, ...props } = item.toProps();
    return props;
  }
}
