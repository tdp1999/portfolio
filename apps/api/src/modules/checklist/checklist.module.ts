import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AuthModule } from '../auth';
import { UserModule } from '../user';

import {
  CreateChecklistRunHandler,
  DeleteChecklistRunHandler,
  SaveChecklistRunBodyHandler,
  SyncChecklistDocsHandler,
  UpdateChecklistRunHandler,
} from './application/commands';
import { CHECKLIST_SYNC_CONFIG, loadChecklistSyncConfig } from './application/checklist-sync.config';
import { CHECKLIST_DOC_REPOSITORY, CHECKLIST_RUN_REPOSITORY } from './application/checklist.token';
import { ChecklistSyncTokenGuard } from './application/guards/checklist-sync-token.guard';
import {
  GetChecklistDocHandler,
  GetChecklistRunHandler,
  ListChecklistDocsHandler,
  ListChecklistRunsHandler,
} from './application/queries';
import { ChecklistDocRepository } from './infrastructure/repositories/checklist-doc.repository';
import { ChecklistRunRepository } from './infrastructure/repositories/checklist-run.repository';
import { ChecklistController } from './presentation/checklist.controller';
import { ChecklistSyncController } from './presentation/checklist-sync.controller';

const commandHandlers = [
  SyncChecklistDocsHandler,
  CreateChecklistRunHandler,
  SaveChecklistRunBodyHandler,
  UpdateChecklistRunHandler,
  DeleteChecklistRunHandler,
];
const queryHandlers = [
  ListChecklistDocsHandler,
  GetChecklistDocHandler,
  ListChecklistRunsHandler,
  GetChecklistRunHandler,
];

@Module({
  imports: [CqrsModule, forwardRef(() => AuthModule), forwardRef(() => UserModule)],
  controllers: [ChecklistController, ChecklistSyncController],
  providers: [
    { provide: CHECKLIST_DOC_REPOSITORY, useClass: ChecklistDocRepository },
    { provide: CHECKLIST_RUN_REPOSITORY, useClass: ChecklistRunRepository },
    { provide: CHECKLIST_SYNC_CONFIG, useFactory: () => loadChecklistSyncConfig() },
    ChecklistSyncTokenGuard,
    ...commandHandlers,
    ...queryHandlers,
  ],
})
export class ChecklistModule {}
