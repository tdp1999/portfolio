import { AboutPrinciple as PrismaAboutPrinciple } from '@prisma/client';
import type { TranslatableJson } from '@portfolio/shared/types';
import { PersistenceTranslatableSchema } from '@portfolio/shared/utils';
import { AboutPrinciple } from '../../domain/entities/about-principle.entity';
import { IAboutPrincipleProps } from '../../domain/about-principle.types';

const parseTranslatable = (raw: unknown): TranslatableJson =>
  PersistenceTranslatableSchema.parse(raw) as TranslatableJson;

export class AboutPrincipleMapper {
  static toDomain(raw: PrismaAboutPrinciple): AboutPrinciple {
    const props: IAboutPrincipleProps = {
      id: raw.id,
      order: raw.order,
      claim: parseTranslatable(raw.claim),
      expansion: parseTranslatable(raw.expansion),
      isPublished: raw.isPublished,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
    return AboutPrinciple.load(props);
  }
}
