import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ValidationError, NotFoundError, ErrorLayer, ProjectErrorCode } from '@portfolio/shared/errors';
import { IdentifierValue, SlugValue } from '@portfolio/shared/types';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { Project } from '../../domain/entities/project.entity';
import { IProjectRepository, TechnicalHighlightInput } from '../ports/project.repository.port';
import { PROJECT_REPOSITORY } from '../project.token';
import { UpdateProjectSchema } from '../project.dto';
import { IUpdateProjectPayload } from '../../domain/project.types';
import { RichTextService } from '../../../shared/rich-text';
import { mapHighlightDtoToInput, mapStoredHighlightToInput } from '../project-highlight.mapper';

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
  constructor(
    @Inject(PROJECT_REPOSITORY) private readonly repo: IProjectRepository,
    private readonly richText: RichTextService
  ) {}

  async execute(command: UpdateProjectCommand): Promise<void> {
    IdentifierValue.from(command.projectId);

    const { success, data, error } = UpdateProjectSchema.safeParse(command.dto);
    if (!success)
      throw ValidationError(error, {
        errorCode: ProjectErrorCode.INVALID_INPUT,
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

    if (data.bodyJson) {
      const rich = await this.richText.toCanonicalFormTranslatable(data.bodyJson, 'project.body');
      updated = updated.withBodyRichText(rich, command.userId);
    }

    // Highlights are delete+recreate. When the DTO carries them, run the RTE
    // pipeline per CAO field; otherwise rebuild the input from the stored docs.
    const highlights: TechnicalHighlightInput[] = data.highlights
      ? await Promise.all(data.highlights.map((h, i) => mapHighlightDtoToInput(this.richText, h, i)))
      : result.relations.highlights.map(mapStoredHighlightToInput);

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
