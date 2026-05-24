import { AboutPrinciple } from '../domain/entities/about-principle.entity';
import { AboutPrincipleDto } from './about-principle.dto';

export class AboutPrinciplePresenter {
  static toResponse(principle: AboutPrinciple): AboutPrincipleDto {
    return {
      id: principle.id,
      order: principle.order,
      claim: { en: principle.claim.en, vi: principle.claim.vi },
      expansion: { en: principle.expansion.en, vi: principle.expansion.vi },
      isPublished: principle.isPublished,
      createdAt: principle.createdAt,
      updatedAt: principle.updatedAt,
    };
  }
}
