import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import type { EditorDocument } from '@portfolio/shared/features/rte-core/image-refs';
import { NotFoundError, ErrorLayer, ProjectErrorCode } from '@portfolio/shared/errors';
import { MediaRefResolverService } from '../../../media/application/media-ref-resolver.service';
import { IProjectRepository } from '../ports/project.repository.port';
import { PROJECT_REPOSITORY } from '../project.token';
import { ProjectPresenter, ProjectDetailDto } from '../project.presenter';

export class GetProjectBySlugQuery {
  constructor(readonly slug: string) {}
}

@QueryHandler(GetProjectBySlugQuery)
export class GetProjectBySlugHandler implements IQueryHandler<GetProjectBySlugQuery> {
  constructor(
    @Inject(PROJECT_REPOSITORY) private readonly repo: IProjectRepository,
    private readonly mediaRefs: MediaRefResolverService
  ) {}

  async execute(query: GetProjectBySlugQuery): Promise<ProjectDetailDto> {
    const result = await this.repo.findBySlug(query.slug);
    if (!result)
      throw NotFoundError('Project not found', {
        errorCode: ProjectErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    // Resolve the case-study body's image-ref ids (both locales) so landing can
    // hydrate the URL-free figures into real <img> at read-time.
    const body = result.entity.bodyJson as { en?: EditorDocument; vi?: EditorDocument } | null;
    const mediaRefs = await this.mediaRefs.resolveForDocuments([body?.en, body?.vi]);

    return ProjectPresenter.toDetail(result, mediaRefs);
  }
}
