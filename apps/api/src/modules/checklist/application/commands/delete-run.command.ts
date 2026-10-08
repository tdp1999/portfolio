import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { ChecklistErrorCode, ErrorLayer, NotFoundError } from '@portfolio/shared/errors';

import { CHECKLIST_RUN_REPOSITORY } from '../checklist.token';
import { IChecklistRunRepository } from '../ports/checklist-run.repository.port';

export class DeleteChecklistRunCommand {
  constructor(readonly id: string) {}
}

@CommandHandler(DeleteChecklistRunCommand)
export class DeleteChecklistRunHandler implements ICommandHandler<DeleteChecklistRunCommand> {
  constructor(@Inject(CHECKLIST_RUN_REPOSITORY) private readonly runs: IChecklistRunRepository) {}

  async execute(command: DeleteChecklistRunCommand): Promise<void> {
    const run = await this.runs.findById(command.id);
    if (!run) {
      throw NotFoundError('Run not found', {
        errorCode: ChecklistErrorCode.RUN_NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });
    }
    await this.runs.remove(run.id);
  }
}
