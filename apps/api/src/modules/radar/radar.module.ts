import { Logger, Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AuthModule } from '../auth';
import { UserModule } from '../user';
import { MediaModule } from '../media/media.module';

import {
  AdvanceRunHandler,
  ClaimBriefHandler,
  CreateBriefHandler,
  SubmitBriefHandler,
  CollectItemCommentsHandler,
  FetchItemCommentsHandler,
  UploadCommentsHandler,
  CancelRunHandler,
  ClaimWorkHandler,
  CreateRunHandler,
  CreateSourceHandler,
  DeleteSourceHandler,
  PersistItemImagesHandler,
  RequeueStuckHandler,
  TriageItemsHandler,
  SetSourceActiveHandler,
  SubmitResultsHandler,
  UploadCaptureHandler,
  UpsertWorkflowProfileHandler,
} from './application/commands';
import { MachineTokenGuard } from './application/guards/machine-token.guard';
import { RadarTickJob } from './application/jobs/radar-tick.job';
import { RADAR_CAPTURE_CONFIG, loadRadarCaptureConfig, RadarCaptureConfig } from './application/radar-capture.config';
import { RADAR_WORKER_CONFIG, loadRadarWorkerConfig } from './application/radar-worker.config';
import {
  GetBriefHandler,
  GetCommentsSettingsHandler,
  GetRadarItemHandler,
  ListBriefItemsHandler,
  ListBriefsHandler,
  GetRadarQueueStatsHandler,
  GetRunHandler,
  GetWorkflowProfileHandler,
  ListRunsHandler,
  ListRadarItemsHandler,
  ListSourcesHandler,
} from './application/queries';
import {
  CAPTURE_NORMALIZERS,
  CAPTURE_PROVIDERS,
  LLM_PROVIDERS,
  IMAGE_DOWNLOADER,
  RADAR_CAPTURE_REPOSITORY,
  RADAR_COMMENTS_REPOSITORY,
  COMMENTS_PROVIDER,
  RADAR_IMAGE_REPOSITORY,
  RADAR_ITEM_REPOSITORY,
  RADAR_PROFILE_REPOSITORY,
  RADAR_RUN_REPOSITORY,
  RADAR_BRIEF_REPOSITORY,
  RADAR_SOURCE_REPOSITORY,
  RADAR_WORK_REPOSITORY,
} from './application/radar.token';
import { ApifyCaptureAdapter } from './infrastructure/capture/apify-capture.adapter';
import { ApifyCommentsAdapter } from './infrastructure/capture/apify-comments.adapter';
import { RunCommentsPhase } from './application/commands/run.comments.phase';
import { ApifyFacebookNormalizer } from './infrastructure/capture/apify-facebook.normalizer';
import { FetchImageDownloader } from './infrastructure/capture/fetch-image.downloader';
import { RadarBriefRepository } from './infrastructure/repositories/radar-brief.repository';
import { RadarCaptureRepository } from './infrastructure/repositories/radar-capture.repository';
import { RadarCommentsRepository } from './infrastructure/repositories/radar-comments.repository';
import { RadarImageRepository } from './infrastructure/repositories/radar-image.repository';
import { RadarItemRepository } from './infrastructure/repositories/radar-item.repository';
import { ExternalWorkerAdapter } from './infrastructure/llm/external-worker.adapter';
import { RadarProfileRepository } from './infrastructure/repositories/radar-profile.repository';
import { RadarRunRepository } from './infrastructure/repositories/radar-run.repository';
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
  TriageItemsHandler,
  CreateRunHandler,
  AdvanceRunHandler,
  CancelRunHandler,
  FetchItemCommentsHandler,
  CollectItemCommentsHandler,
  UploadCommentsHandler,
  CreateBriefHandler,
  ClaimBriefHandler,
  SubmitBriefHandler,
];
const QueryHandlers = [
  ListSourcesHandler,
  GetWorkflowProfileHandler,
  ListRadarItemsHandler,
  GetRadarItemHandler,
  GetCommentsSettingsHandler,
  GetRadarQueueStatsHandler,
  ListRunsHandler,
  GetRunHandler,
  ListBriefsHandler,
  GetBriefHandler,
  ListBriefItemsHandler,
];

@Module({
  imports: [CqrsModule, forwardRef(() => AuthModule), forwardRef(() => UserModule), MediaModule],
  controllers: [RadarAdminController, RadarWorkerController],
  providers: [
    { provide: RADAR_SOURCE_REPOSITORY, useClass: RadarSourceRepository },
    { provide: RADAR_CAPTURE_REPOSITORY, useClass: RadarCaptureRepository },
    { provide: RADAR_COMMENTS_REPOSITORY, useClass: RadarCommentsRepository },
    { provide: RADAR_IMAGE_REPOSITORY, useClass: RadarImageRepository },
    { provide: RADAR_ITEM_REPOSITORY, useClass: RadarItemRepository },
    { provide: RADAR_WORK_REPOSITORY, useClass: RadarWorkRepository },
    { provide: RADAR_PROFILE_REPOSITORY, useClass: RadarProfileRepository },
    { provide: RADAR_RUN_REPOSITORY, useClass: RadarRunRepository },
    { provide: RADAR_BRIEF_REPOSITORY, useClass: RadarBriefRepository },
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
    {
      provide: RADAR_CAPTURE_CONFIG,
      useFactory: () => {
        const config = loadRadarCaptureConfig();
        if (!config.apifyToken) {
          new Logger('RadarModule').warn('APIFY_TOKEN is unset; Hybrid runs are refused, Manual runs still work');
        }
        return config;
      },
    },
    {
      // Resolved per run by the run's captureAdapter name, not once per process.
      provide: CAPTURE_PROVIDERS,
      inject: [RADAR_CAPTURE_CONFIG],
      useFactory: (config: RadarCaptureConfig) => [new ApifyCaptureAdapter(config)],
    },
    {
      provide: COMMENTS_PROVIDER,
      inject: [RADAR_CAPTURE_CONFIG],
      useFactory: (config: RadarCaptureConfig) => new ApifyCommentsAdapter(config),
    },
    RunCommentsPhase,
    {
      // Resolved per run by the run's llmAdapter name.
      provide: LLM_PROVIDERS,
      useFactory: () => [new ExternalWorkerAdapter()],
    },
    RadarTickJob,
    ...CommandHandlers,
    ...QueryHandlers,
  ],
})
export class RadarModule {}
