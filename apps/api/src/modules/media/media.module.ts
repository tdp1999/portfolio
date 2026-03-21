import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user';
import { MediaController } from './presentation/media.controller';
import { MediaRepository } from './infrastructure/repositories/media.repository';
import { CloudinaryStorageService } from './infrastructure/adapters/cloudinary-storage.service';
import { FileSecurityScanner } from './infrastructure/adapters/file-security-scanner.service';
import { MEDIA_REPOSITORY, STORAGE_SERVICE, SECURITY_SCANNER } from './application/media.token';
import {
  UploadMediaHandler,
  BulkUploadMediaHandler,
  UpdateMediaMetadataHandler,
  SoftDeleteMediaHandler,
  RestoreMediaHandler,
  HardDeleteMediaHandler,
} from './application/commands';
import {
  ListMediaHandler,
  GetMediaByIdHandler,
  GetStorageStatsHandler,
  ListDeletedMediaHandler,
} from './application/queries';
import { MediaCleanupJob } from './application/jobs/media-cleanup.job';

const commandHandlers = [
  UploadMediaHandler,
  BulkUploadMediaHandler,
  UpdateMediaMetadataHandler,
  SoftDeleteMediaHandler,
  RestoreMediaHandler,
  HardDeleteMediaHandler,
];

const queryHandlers = [ListMediaHandler, GetMediaByIdHandler, GetStorageStatsHandler, ListDeletedMediaHandler];

@Module({
  imports: [CqrsModule, forwardRef(() => AuthModule), forwardRef(() => UserModule)],
  controllers: [MediaController],
  providers: [
    {
      provide: STORAGE_SERVICE,
      useClass: CloudinaryStorageService,
    },
    {
      provide: SECURITY_SCANNER,
      useClass: FileSecurityScanner,
    },
    {
      provide: MEDIA_REPOSITORY,
      useClass: MediaRepository,
    },
    ...commandHandlers,
    ...queryHandlers,
    MediaCleanupJob,
  ],
  exports: [MEDIA_REPOSITORY],
})
export class MediaModule {}
