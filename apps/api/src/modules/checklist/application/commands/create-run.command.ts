import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ChecklistDocKind } from '@prisma/client';

import { ChecklistErrorCode, ErrorLayer, NotFoundError, ValidationError } from '@portfolio/shared/errors';

import { ChecklistRun } from '../../domain/entities/checklist-run.entity';
import { CreateChecklistRunSchema } from '../checklist.dto';
import { CHECKLIST_DOC_REPOSITORY, CHECKLIST_RUN_REPOSITORY } from '../checklist.token';
import { IChecklistDocRepository } from '../ports/checklist-doc.repository.port';
import { IChecklistRunRepository } from '../ports/checklist-run.repository.port';

export class CreateChecklistRunCommand {
  constructor(readonly dto: unknown) {}
}

@CommandHandler(CreateChecklistRunCommand)
export class CreateChecklistRunHandler implements ICommandHandler<CreateChecklistRunCommand> {
  constructor(
    @Inject(CHECKLIST_DOC_REPOSITORY) private readonly docs: IChecklistDocRepository,
    @Inject(CHECKLIST_RUN_REPOSITORY) private readonly runs: IChecklistRunRepository
  ) {}

  async execute(command: CreateChecklistRunCommand): Promise<string> {
    const { success, data, error } = CreateChecklistRunSchema.safeParse(command.dto);
    if (!success) {
      throw ValidationError(error, { errorCode: ChecklistErrorCode.INVALID_INPUT, layer: ErrorLayer.APPLICATION });
    }

    const [template, project] = await Promise.all([
      this.docs.findBySlug(ChecklistDocKind.TEMPLATE, data.templateSlug),
      this.docs.findBySlug(ChecklistDocKind.PROJECT, data.projectSlug),
    ]);
    if (!template || !project) {
      throw NotFoundError(`Unknown ${template ? 'project' : 'template'}`, {
        errorCode: ChecklistErrorCode.DOC_NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });
    }

    const run = ChecklistRun.create(data.name, template, project);
    await this.runs.add(run);
    return run.id;
  }
}
