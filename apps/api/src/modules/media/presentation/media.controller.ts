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
  Query,
  Req,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { AuthenticatedRequest, MulterFile } from '../../../shared/types';
import { JwtAccessGuard } from '../../auth/application/guards/jwt-access.guard';
import { RoleGuard, Roles } from '../../auth/application/guards/role.guard';
import {
  UploadMediaCommand,
  BulkUploadMediaCommand,
  UpdateMediaMetadataCommand,
  SoftDeleteMediaCommand,
  RestoreMediaCommand,
} from '../application/commands';
import { ListMediaQuery, GetMediaByIdQuery, GetStorageStatsQuery, ListDeletedMediaQuery } from '../application/queries';
import { MULTER_LIMITS, MAX_BULK_UPLOAD_FILES } from '../application/media.constants';

@Controller('media')
@UseGuards(JwtAccessGuard, RoleGuard)
@Roles(['ADMIN'])
export class MediaController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', { limits: MULTER_LIMITS }))
  async upload(@UploadedFile() file: MulterFile, @Body() body: unknown, @Req() req: AuthenticatedRequest) {
    return await this.commandBus.execute(new UploadMediaCommand(file, body, req.user.id));
  }

  @Post('upload/bulk')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FilesInterceptor('files', MAX_BULK_UPLOAD_FILES, { limits: MULTER_LIMITS }))
  async uploadBulk(@UploadedFiles() files: MulterFile[], @Body() body: unknown, @Req() req: AuthenticatedRequest) {
    return await this.commandBus.execute(new BulkUploadMediaCommand(files, body, req.user.id));
  }

  @Get()
  async list(@Query() query: unknown) {
    return await this.queryBus.execute(new ListMediaQuery(query));
  }

  @Get('stats')
  async stats() {
    return await this.queryBus.execute(new GetStorageStatsQuery());
  }

  @Get('trash')
  async trash(@Query() query: unknown) {
    return await this.queryBus.execute(new ListDeletedMediaQuery(query));
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return await this.queryBus.execute(new GetMediaByIdQuery(id));
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest
  ): Promise<{ success: boolean }> {
    await this.commandBus.execute(new UpdateMediaMetadataCommand(id, body, req.user.id));
    return { success: true };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string, @Req() req: AuthenticatedRequest): Promise<{ success: boolean }> {
    await this.commandBus.execute(new SoftDeleteMediaCommand(id, req.user.id));
    return { success: true };
  }

  @Post(':id/restore')
  async restore(@Param('id') id: string, @Req() req: AuthenticatedRequest): Promise<{ success: boolean }> {
    await this.commandBus.execute(new RestoreMediaCommand(id, req.user.id));
    return { success: true };
  }
}
