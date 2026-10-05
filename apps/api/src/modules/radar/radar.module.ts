import { Logger, Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AuthModule } from '../auth';
import { UserModule } from '../user';
import { MediaModule } from '../media/media.module';

import {
  ClaimWorkHandler,
  CreateSourceHandler,
  DeleteSourceHandler,
  PersistItemImagesHandler,
  RequeueStuckHandler,
  SetSourceActiveHandler,
  SubmitResultsHandler,
  UploadCaptureHandler,
  UpsertWorkflowProfileHandler,
} from './application/commands';
import { MachineTokenGuard } from './application/guards/machine-token.guard';
import { RADAR_WORKER_CONFIG, loadRadarWorkerConfig } from './application/radar-worker.config';
import {
  GetRadarItemHandler,
  GetRadarQueueStatsHandler,
  GetWorkflowProfileHandler,
  ListRadarItemsHandler,
  ListSourcesHandler,
} from './application/queries';
import {
  CAPTURE_NORMALIZERS,
  IMAGE_DOWNLOADER,
  RADAR_CAPTURE_REPOSITORY,
  RADAR_IMAGE_REPOSITORY,
  RADAR_ITEM_REPOSITORY,
  RADAR_PROFILE_REPOSITORY,
  RADAR_SOURCE_REPOSITORY,
  RADAR_WORK_REPOSITORY,
} from './application/radar.token';
import { ApifyFacebookNormalizer } from './infrastructure/capture/apify-facebook.normalizer';
import { FetchImageDownloader } from './infrastructure/capture/fetch-image.downloader';
import { RadarCaptureRepository } from './infrastructure/repositories/radar-capture.repository';
import { RadarImageRepository } from './infrastructure/repositories/radar-image.repository';
import { RadarItemRepository } from './infrastructure/repositories/radar-item.repository';
import { RadarProfileRepository } from './infrastructure/repositories/radar-profile.repository';
import { RadarSourceRepository } from './infrastructure/repositories/radar-source.repository';
import { RadarWorkRepository } from './infrastructure/repositories/radar-work.repository';
import { RadarAdminController } from './presentation/radar-admin.controller';
import { RadarWorkerController } from './presentation/radar-worker.controller';

const CommandHandlers = [
  CreateSourceHandler,
  DeleteSourceHandler,
  SetSourceActiveHandler,
  UploadCaptureHandler,
  PersistItemImagesHandler,
  ClaimWorkHandler,
  SubmitResultsHandler,
  UpsertWorkflowProfileHandler,
  RequeueStuckHandler,
];
const QueryHandlers = [
  ListSourcesHandler,
  GetWorkflowProfileHandler,
  ListRadarItemsHandler,
  GetRadarItemHandler,
  GetRadarQueueStatsHandler,
];

@Module({
  imports: [CqrsModule, forwardRef(() => AuthModule), forwardRef(() => UserModule), MediaModule],
  controllers: [RadarAdminController, RadarWorkerController],
  providers: [
    { provide: RADAR_SOURCE_REPOSITORY, useClass: RadarSourceRepository },
    { provide: RADAR_CAPTURE_REPOSITORY, useClass: RadarCaptureRepository },
    { provide: RADAR_IMAGE_REPOSITORY, useClass: RadarImageRepository },
    { provide: RADAR_ITEM_REPOSITORY, useClass: RadarItemRepository },
    { provide: RADAR_WORK_REPOSITORY, useClass: RadarWorkRepository },
    { provide: RADAR_PROFILE_REPOSITORY, useClass: RadarProfileRepository },
    { provide: IMAGE_DOWNLOADER, useClass: FetchImageDownloader },
    {
      provide: RADAR_WORKER_CONFIG,
      useFactory: () => {
        const config = loadRadarWorkerConfig();
        if (!config.tokenHash) {
          new Logger('RadarModule').warn(
            'RADAR_WORKER_TOKEN_HASH is unset or not a SHA-256 hex; worker routes answer 401'
          );
        }
        return config;
      },
    },
    MachineTokenGuard,
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
