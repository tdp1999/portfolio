import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ValidationError, ErrorLayer, ProjectErrorCode } from '@portfolio/shared/errors';
import { SlugValue } from '@portfolio/shared/types';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { Project } from '../../domain/entities/project.entity';
import { IProjectRepository } from '../ports/project.repository.port';
import { PROJECT_REPOSITORY } from '../project.token';
import { CreateProjectSchema } from '../project.dto';
import { ICreateProjectPayload } from '../../domain/project.types';

export class CreateProjectCommand extends BaseCommand {
  constructor(
    readonly dto: unknown,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(CreateProjectCommand)
export class CreateProjectHandler implements ICommandHandler<CreateProjectCommand> {
  constructor(@Inject(PROJECT_REPOSITORY) private readonly repo: IProjectRepository) {}

  async execute(command: CreateProjectCommand): Promise<string> {
    const { success, data, error } = CreateProjectSchema.safeParse(command.dto);
    if (!success)
      throw ValidationError(error, {
        errorCode: ProjectErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
        remarks: 'Project creation validation failed',
      });

    const baseSlug = SlugValue.from(data.title);
    let candidateSlug = baseSlug;
    let counter = 2;
    while (await this.repo.slugExists(candidateSlug)) {
      candidateSlug = `${baseSlug}-${counter++}`;
      if (counter > 10) break;
    }

    const entity = Project.create(data as ICreateProjectPayload, command.userId);
    const finalEntity =
      candidateSlug !== baseSlug ? Project.load({ ...entity.toProps(), slug: candidateSlug }) : entity;

    const highlights = data.highlights.map((h, i) => ({ ...h, codeUrl: h.codeUrl ?? null, displayOrder: i }));

    return this.repo.create({
      entity: finalEntity,
      highlights,
      imageIds: data.imageIds,
      skillIds: data.skillIds,
    });
  }
}
