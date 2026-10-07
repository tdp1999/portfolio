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
  CreateBriefCommand,
  CreateRunCommand,
  CollectItemCommentsCommand,
  FetchItemCommentsCommand,
  CreateSourceCommand,
  DeleteSourceCommand,
  PersistItemImagesCommand,
  RequeueStuckCommand,
  SetSourceActiveCommand,
  TriageItemsCommand,
  UploadCaptureCommand,
  UploadCommentsCommand,
  UpsertWorkflowProfileCommand,
} from '../application/commands';
import {
  GetBriefQuery,
  GetCommentsSettingsQuery,
  GetAiSettingsQuery,
  ListBriefsQuery,
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

  /** A comments export from the provider console, matched to this source's posts by URL (task 411). */
  @Post('sources/:id/comments/upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }))
  async uploadComments(@Param('id') id: string, @UploadedFile() file: MulterFile | undefined) {
    return await this.commandBus.execute(new UploadCommentsCommand(id, file));
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

  @Post('briefs')
  async createBrief(@Body() body: unknown) {
    return await this.commandBus.execute(new CreateBriefCommand(body));
  }

  @Get('briefs')
  async listBriefs() {
    return await this.queryBus.execute(new ListBriefsQuery());
  }

  @Get('briefs/:id')
  async getBrief(@Param('id') id: string) {
    return await this.queryBus.execute(new GetBriefQuery(id));
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

  @Patch('items/triage')
  async triageItems(@Body() body: unknown) {
    return await this.commandBus.execute(new TriageItemsCommand(body));
  }

  @Get('items/:id')
  async getItem(@Param('id') id: string) {
    return await this.queryBus.execute(new GetRadarItemQuery(id));
  }

  /** Starts fetching one post's comments (billed; capped per call). The page then polls the job. */
  @Post('items/:id/comments/fetch')
  @HttpCode(HttpStatus.ACCEPTED)
  async fetchItemComments(@Param('id') id: string) {
    return await this.commandBus.execute(new FetchItemCommentsCommand(id));
  }

  /** Polls a fetch started above; once its job ended, replaces the item's stored comments. */
  @Post('items/:id/comments/fetch/:jobRef')
  @HttpCode(HttpStatus.OK)
  async collectItemComments(@Param('id') id: string, @Param('jobRef') jobRef: string) {
    return await this.commandBus.execute(new CollectItemCommentsCommand(id, jobRef));
  }

  @Get('comments/settings')
  async getCommentsSettings() {
    return await this.queryBus.execute(new GetCommentsSettingsQuery());
  }

  @Get('ai/settings')
  async getAiSettings() {
    return await this.queryBus.execute(new GetAiSettingsQuery());
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
