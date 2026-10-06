import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { z } from 'zod/v4';

import { ErrorLayer, RadarErrorCode, ValidationError } from '@portfolio/shared/errors';

import { IRadarWorkRepository } from '../ports/radar-work.repository.port';
import { RadarEnrichmentSchema } from '../radar-enrichment.schema';
import { SubmitResultsResponseDto, SubmitResultsSchema } from '../radar.dto';
import { RADAR_WORK_REPOSITORY } from '../radar.token';

export class SubmitResultsCommand {
  constructor(readonly dto: unknown) {}
}

const describe = (error: z.ZodError) =>
  error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ');

/**
 * Stores each valid result (replacing any earlier one for that item) and rejects each invalid one
 * on its own. A rejected item keeps its lease: the worker can correct and resubmit at once, and if
 * it does not, the item returns to the queue when the lease expires. Not releasing early means a
 * late submit can never take an item away from a worker that reclaimed it.
 */
@CommandHandler(SubmitResultsCommand)
export class SubmitResultsHandler implements ICommandHandler<SubmitResultsCommand> {
  private readonly logger = new Logger(SubmitResultsHandler.name);

  constructor(@Inject(RADAR_WORK_REPOSITORY) private readonly repo: IRadarWorkRepository) {}

  async execute(command: SubmitResultsCommand): Promise<SubmitResultsResponseDto> {
    const { success, data, error } = SubmitResultsSchema.safeParse(command.dto);
    if (!success) {
      throw ValidationError(error, { errorCode: RadarErrorCode.INVALID_INPUT, layer: ErrorLayer.APPLICATION });
    }

    let stored = 0;
    const rejected: SubmitResultsResponseDto['rejected'] = [];

    for (const { itemId, enrichment } of data.results) {
      const parsed = RadarEnrichmentSchema.safeParse(enrichment);
      if (!parsed.success) {
        rejected.push({ itemId, reason: describe(parsed.error) });
        continue;
      }

      try {
        const item = await this.repo.findById(itemId);
        if (item && (await this.repo.saveEnrichment(item.takeEnrichment(), parsed.data))) stored++;
        else rejected.push({ itemId, reason: 'Item not found' });
      } catch (err) {
        this.logger.error(`Saving enrichment for ${itemId} failed`, err instanceof Error ? err.stack : err);
        rejected.push({ itemId, reason: 'Could not be saved, retry later' });
      }
    }

    return { stored, rejected };
  }
}
