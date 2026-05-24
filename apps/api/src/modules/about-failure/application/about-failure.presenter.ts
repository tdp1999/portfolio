import { AboutFailure } from '../domain/entities/about-failure.entity';
import { AboutFailureDto } from './about-failure.dto';

export class AboutFailurePresenter {
  static toResponse(failure: AboutFailure): AboutFailureDto {
    return {
      id: failure.id,
      order: failure.order,
      year: failure.year,
      context: { en: failure.context.en, vi: failure.context.vi },
      decision: { en: failure.decision.en, vi: failure.decision.vi },
      consequence: { en: failure.consequence.en, vi: failure.consequence.vi },
      lesson: { en: failure.lesson.en, vi: failure.lesson.vi },
      isPublished: failure.isPublished,
      createdAt: failure.createdAt,
      updatedAt: failure.updatedAt,
    };
  }
}
