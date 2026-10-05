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
  CreateSourceCommand,
  DeleteSourceCommand,
  PersistItemImagesCommand,
  SetSourceActiveCommand,
  UploadCaptureCommand,
  UpsertWorkflowProfileCommand,
} from '../application/commands';
import { GetWorkflowProfileQuery, ListSourcesQuery } from '../application/queries';
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

  @Get('profile')
  async getProfile() {
    return await this.queryBus.execute(new GetWorkflowProfileQuery());
  }

  @Put('profile')
  async upsertProfile(@Body() body: unknown) {
    return await this.commandBus.execute(new UpsertWorkflowProfileCommand(body));
  }
}
