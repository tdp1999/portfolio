import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user';
import { MediaController } from './presentation/media.controller';
import { MediaFileController } from './presentation/media-file.controller';
import { MediaRepository } from './infrastructure/repositories/media.repository';
import { LocalStorageService } from './infrastructure/adapters/local-storage.service';
import { createStorageService } from './infrastructure/adapters/storage.factory';
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
import { MediaRefResolverService } from './application/media-ref-resolver.service';

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
  controllers: [MediaController, MediaFileController],
  providers: [
    LocalStorageService,
    {
      // Cloudinary when configured, local disk in development and CI, a boot failure in
      // production. See `createStorageService`.
      provide: STORAGE_SERVICE,
      useFactory: createStorageService,
      inject: [LocalStorageService],
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
    MediaRefResolverService,
  ],
  exports: [MEDIA_REPOSITORY, MediaRefResolverService],
})
export class MediaModule {}
