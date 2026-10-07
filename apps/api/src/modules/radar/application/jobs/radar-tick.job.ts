import { Inject, Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Cron, CronExpression } from '@nestjs/schedule';

import { WriteAutoBriefCommand } from '../commands/brief.write.command';
import { AdvanceRunCommand } from '../commands/run.advance.command';
import { IRadarRunRepository } from '../ports/radar-run.repository.port';
import { RADAR_RUN_REPOSITORY } from '../radar.token';

/**
 * Drives active runs forward once a minute, and writes a pending AUTO brief. Idle cost is two
 * indexed queries; runs and briefs only exist because the Owner asked for one (RAD-006), so nothing
 * here ever schedules a capture.
 */
@Injectable()
export class RadarTickJob {
  private readonly logger = new Logger(RadarTickJob.name);
  /** Single API instance on Railway, so an in-process flag is enough to stop overlapping ticks. */
  private running = false;
  /** A brief takes minutes to write, so it runs beside the run loop instead of holding it up. */
  private writingBrief = false;

  constructor(
    @Inject(RADAR_RUN_REPOSITORY) private readonly runs: IRadarRunRepository,
    private readonly commandBus: CommandBus
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async tick(): Promise<void> {
    void this.writeBrief();
    if (this.running) return;
    this.running = true;
    try {
      for (const runId of await this.runs.findActiveIds()) {
        try {
          await this.commandBus.execute(new AdvanceRunCommand(runId));
        } catch (error) {
          this.logger.error(`Radar run ${runId} tick crashed: ${error instanceof Error ? error.message : error}`);
        }
      }
    } catch (error) {
      this.logger.error(`Radar tick failed: ${error instanceof Error ? error.message : error}`);
    } finally {
      this.running = false;
    }
  }

  private async writeBrief(): Promise<void> {
    if (this.writingBrief) return;
    this.writingBrief = true;
    try {
      await this.commandBus.execute(new WriteAutoBriefCommand());
    } catch (error) {
      this.logger.error(`Radar brief tick failed: ${error instanceof Error ? error.message : error}`);
    } finally {
      this.writingBrief = false;
    }
  }
}
