import { AboutFailure as PrismaAboutFailure } from '@prisma/client';
import type { TranslatableJson } from '@portfolio/shared/types';
import { PersistenceTranslatableSchema } from '@portfolio/shared/utils';
import { AboutFailure } from '../../domain/entities/about-failure.entity';
import { IAboutFailureProps } from '../../domain/about-failure.types';

const parseTranslatable = (raw: unknown): TranslatableJson =>
  PersistenceTranslatableSchema.parse(raw) as TranslatableJson;

export class AboutFailureMapper {
  static toDomain(raw: PrismaAboutFailure): AboutFailure {
    const props: IAboutFailureProps = {
      id: raw.id,
      order: raw.order,
      year: raw.year,
      context: parseTranslatable(raw.context),
      decision: parseTranslatable(raw.decision),
      consequence: parseTranslatable(raw.consequence),
      lesson: parseTranslatable(raw.lesson),
      isPublished: raw.isPublished,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
    return AboutFailure.load(props);
  }
}
