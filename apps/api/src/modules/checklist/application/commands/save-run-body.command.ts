import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  ChecklistErrorCode,
  ConflictError,
  ErrorLayer,
  NotFoundError,
  ValidationError,
} from '@portfolio/shared/errors';

import { SaveChecklistRunBodySchema } from '../checklist.dto';
import { CHECKLIST_RUN_REPOSITORY } from '../checklist.token';
import { IChecklistRunRepository } from '../ports/checklist-run.repository.port';

export class SaveChecklistRunBodyCommand {
  constructor(
    readonly id: string,
    readonly dto: unknown
  ) {}
}

/** Autosave of the run page: the whole body, guarded by the version it was based on. */
@CommandHandler(SaveChecklistRunBodyCommand)
export class SaveChecklistRunBodyHandler implements ICommandHandler<SaveChecklistRunBodyCommand> {
  constructor(@Inject(CHECKLIST_RUN_REPOSITORY) private readonly runs: IChecklistRunRepository) {}

  async execute(command: SaveChecklistRunBodyCommand): Promise<{ version: number }> {
    const { success, data, error } = SaveChecklistRunBodySchema.safeParse(command.dto);
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

    const next = run.replaceBody(data.body, data.version);
    // The entity check covers a stale page; this one covers two saves racing past the read.
    if (!(await this.runs.saveBody(next, data.version))) {
      throw ConflictError('This run was saved elsewhere. Reload to get the latest version', {
        errorCode: ChecklistErrorCode.RUN_VERSION_CONFLICT,
        layer: ErrorLayer.APPLICATION,
      });
    }
    return { version: next.version };
  }
}
