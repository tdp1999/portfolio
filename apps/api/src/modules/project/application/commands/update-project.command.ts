import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ValidationError, NotFoundError, ErrorLayer, ProjectErrorCode } from '@portfolio/shared/errors';
import { IdentifierValue, SlugValue } from '@portfolio/shared/types';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { Project } from '../../domain/entities/project.entity';
import { IProjectRepository } from '../ports/project.repository.port';
import { PROJECT_REPOSITORY } from '../project.token';
import { UpdateProjectSchema } from '../project.dto';
import { IUpdateProjectPayload } from '../../domain/project.types';

export class UpdateProjectCommand extends BaseCommand {
  constructor(
    readonly projectId: string,
    readonly dto: unknown,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(UpdateProjectCommand)
export class UpdateProjectHandler implements ICommandHandler<UpdateProjectCommand> {
  constructor(@Inject(PROJECT_REPOSITORY) private readonly repo: IProjectRepository) {}

  async execute(command: UpdateProjectCommand): Promise<void> {
    IdentifierValue.from(command.projectId);

    const { success, data, error } = UpdateProjectSchema.safeParse(command.dto);
    if (!success)
      throw ValidationError(error, {
        errorCode: ProjectErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
        remarks: 'Project update validation failed',
      });

    const result = await this.repo.findById(command.projectId);
    if (!result)
      throw NotFoundError('Project not found', {
        errorCode: ProjectErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    let updated = result.entity.update(data as IUpdateProjectPayload, command.userId);

    if (data.title) {
      const newSlug = SlugValue.from(data.title);
      if (newSlug !== result.entity.slug) {
        let candidateSlug = newSlug;
        let counter = 2;
        while (await this.repo.slugExists(candidateSlug, command.projectId)) {
          candidateSlug = `${newSlug}-${counter++}`;
          if (counter > 10) break;
        }
        if (candidateSlug !== updated.slug) {
          updated = Project.load({ ...updated.toProps(), slug: candidateSlug });
        }
      }
    }

    const highlights = (data.highlights ?? result.relations.highlights).map((h, i) => ({
      challenge: h.challenge,
      approach: h.approach,
      outcome: h.outcome,
      codeUrl: h.codeUrl ?? null,
      displayOrder: i,
    }));

    const imageIds = data.imageIds ?? result.relations.images.map((i) => i.mediaId);
    const skillIds = data.skillIds ?? result.relations.skills.map((s) => s.id);

    await this.repo.update(command.projectId, {
      entity: updated,
      highlights,
      imageIds,
      skillIds,
    });
  }
}
