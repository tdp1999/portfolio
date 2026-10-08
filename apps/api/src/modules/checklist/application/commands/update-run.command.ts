import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { ChecklistErrorCode, ErrorLayer, NotFoundError, ValidationError } from '@portfolio/shared/errors';

import { UpdateChecklistRunSchema } from '../checklist.dto';
import { CHECKLIST_RUN_REPOSITORY } from '../checklist.token';
import { IChecklistRunRepository } from '../ports/checklist-run.repository.port';

export class UpdateChecklistRunCommand {
  constructor(
    readonly id: string,
    readonly dto: unknown
  ) {}
}

/** Rename, or mark done / archived. The body is saved by `SaveChecklistRunBodyCommand`. */
@CommandHandler(UpdateChecklistRunCommand)
export class UpdateChecklistRunHandler implements ICommandHandler<UpdateChecklistRunCommand> {
  constructor(@Inject(CHECKLIST_RUN_REPOSITORY) private readonly runs: IChecklistRunRepository) {}

  async execute(command: UpdateChecklistRunCommand): Promise<void> {
    const { success, data, error } = UpdateChecklistRunSchema.safeParse(command.dto);
    if (!success) {
      throw ValidationError(error, { errorCode: ChecklistErrorCode.INVALID_INPUT, layer: ErrorLayer.APPLICATION });
    }

    const run = await this.runs.findById(command.id);
    if (!run) {
      throw NotFoundError('Run not found', {
        errorCode: ChecklistErrorCode.RUN_NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });
    }
    await this.runs.updateMeta(run.update(data));
  }
}
