import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { FileInterceptor } from '@nestjs/platform-express';

import { JwtAccessGuard } from '../../auth/application/guards/jwt-access.guard';
import { Roles, RoleGuard } from '../../auth/application/guards/role.guard';
import { MulterFile } from '../../../shared/types';
import {
  CancelRunCommand,
  CreateRunCommand,
  CreateSourceCommand,
  DeleteSourceCommand,
  PersistItemImagesCommand,
  RequeueStuckCommand,
  SetSourceActiveCommand,
  UploadCaptureCommand,
  UpsertWorkflowProfileCommand,
} from '../application/commands';
import {
  GetRunQuery,
  GetRadarItemQuery,
  GetRadarQueueStatsQuery,
  GetWorkflowProfileQuery,
  ListRadarItemsQuery,
  ListRunsQuery,
  ListSourcesQuery,
} from '../application/queries';
import { MAX_UPLOAD_BYTES } from '../application/radar.dto';

@Controller('radar')
@UseGuards(JwtAccessGuard, RoleGuard)
@Roles(['ADMIN'])
export class RadarAdminController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Get('sources')
  async listSources() {
    return await this.queryBus.execute(new ListSourcesQuery());
  }

  @Post('sources')
  @HttpCode(HttpStatus.CREATED)
  async createSource(@Body() body: unknown) {
    return await this.commandBus.execute(new CreateSourceCommand(body));
  }

  @Patch('sources/:id/deactivate')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deactivateSource(@Param('id') id: string) {
    await this.commandBus.execute(new SetSourceActiveCommand(id, false));
  }

  @Patch('sources/:id/activate')
  @HttpCode(HttpStatus.NO_CONTENT)
  async activateSource(@Param('id') id: string) {
    await this.commandBus.execute(new SetSourceActiveCommand(id, true));
  }

  /** Deletes the source, its runs and items, and every stored image of those items. */
  @Delete('sources/:id')
  async deleteSource(@Param('id') id: string) {
    return await this.commandBus.execute(new DeleteSourceCommand(id));
  }

  /** Multipart, not a JSON body: a 6-month export is ~14 MB and the global JSON limit is 100 KB. */
  @Post('sources/:id/captures/upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }))
  async uploadCapture(@Param('id') id: string, @UploadedFile() file: MulterFile | undefined, @Body() body: unknown) {
    return await this.commandBus.execute(new UploadCaptureCommand(id, file, body));
  }

  /** Resume image copying by hand, e.g. after a redeploy interrupted the post-upload run. */
  @Post('images/persist')
  @HttpCode(HttpStatus.OK)
  async persistImages() {
    return await this.commandBus.execute(new PersistItemImagesCommand());
  }

  /** Starts a run on the Owner's request (RAD-006); the cron tick drives it from there. */
  @Post('runs')
  @HttpCode(HttpStatus.CREATED)
  async createRun(@Body() body: unknown) {
    return await this.commandBus.execute(new CreateRunCommand(body));
  }

  @Get('runs')
  async listRuns() {
    return await this.queryBus.execute(new ListRunsQuery());
  }

  @Get('runs/:id')
  async getRun(@Param('id') id: string) {
    return await this.queryBus.execute(new GetRunQuery(id));
  }

  /** Abandons an active run so its source can start a new one. */
  @Post('runs/:id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelRun(@Param('id') id: string) {
    return await this.commandBus.execute(new CancelRunCommand(id));
  }

  @Get('items')
  async listItems(@Query() query: unknown) {
    return await this.queryBus.execute(new ListRadarItemsQuery(query));
  }

  /** Declared before `items/:id` so "stats" is not read as an item id. */
  @Get('items/stats')
  async queueStats() {
    return await this.queryBus.execute(new GetRadarQueueStatsQuery());
  }

  @Post('items/requeue-stuck')
  @HttpCode(HttpStatus.OK)
  async requeueStuck() {
    return await this.commandBus.execute(new RequeueStuckCommand());
  }

  @Get('items/:id')
  async getItem(@Param('id') id: string) {
    return await this.queryBus.execute(new GetRadarItemQuery(id));
  }

  @Get('profile')
  async getProfile() {
    return await this.queryBus.execute(new GetWorkflowProfileQuery());
  }

  @Put('profile')
  async upsertProfile(@Body() body: unknown) {
    return await this.commandBus.execute(new UpsertWorkflowProfileCommand(body));
  }
}
