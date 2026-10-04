import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AuthModule } from '../auth';
import { UserModule } from '../user';
import { MediaModule } from '../media/media.module';

import {
  CreateSourceHandler,
  DeleteSourceHandler,
  PersistItemImagesHandler,
  SetSourceActiveHandler,
  UploadCaptureHandler,
} from './application/commands';
import { ListSourcesHandler } from './application/queries';
import {
  CAPTURE_NORMALIZERS,
  IMAGE_DOWNLOADER,
  RADAR_CAPTURE_REPOSITORY,
  RADAR_IMAGE_REPOSITORY,
  RADAR_SOURCE_REPOSITORY,
} from './application/radar.token';
import { ApifyFacebookNormalizer } from './infrastructure/capture/apify-facebook.normalizer';
import { FetchImageDownloader } from './infrastructure/capture/fetch-image.downloader';
import { RadarCaptureRepository } from './infrastructure/repositories/radar-capture.repository';
import { RadarImageRepository } from './infrastructure/repositories/radar-image.repository';
import { RadarSourceRepository } from './infrastructure/repositories/radar-source.repository';
import { RadarAdminController } from './presentation/radar-admin.controller';

const CommandHandlers = [
  CreateSourceHandler,
  DeleteSourceHandler,
  SetSourceActiveHandler,
  UploadCaptureHandler,
  PersistItemImagesHandler,
];
const QueryHandlers = [ListSourcesHandler];

@Module({
  imports: [CqrsModule, forwardRef(() => AuthModule), forwardRef(() => UserModule), MediaModule],
  controllers: [RadarAdminController],
  providers: [
    { provide: RADAR_SOURCE_REPOSITORY, useClass: RadarSourceRepository },
    { provide: RADAR_CAPTURE_REPOSITORY, useClass: RadarCaptureRepository },
    { provide: RADAR_IMAGE_REPOSITORY, useClass: RadarImageRepository },
    { provide: IMAGE_DOWNLOADER, useClass: FetchImageDownloader },
    {
      // One normalizer per provider export format; the upload route picks by `format`.
      provide: CAPTURE_NORMALIZERS,
      useFactory: () => [new ApifyFacebookNormalizer()],
    },
    ...CommandHandlers,
    ...QueryHandlers,
  ],
})
export class RadarModule {}
