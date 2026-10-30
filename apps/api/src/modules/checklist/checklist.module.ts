import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AuthModule } from '../auth';
import { UserModule } from '../user';

import {
  CreateChecklistRunHandler,
  DeleteChecklistRunHandler,
  RefreshChecklistDocsHandler,
  SaveChecklistRunBodyHandler,
  UpdateChecklistRunHandler,
} from './application/commands';
import { CHECKLIST_DOC_REPOSITORY, CHECKLIST_RUN_REPOSITORY, CHECKLIST_SOURCE } from './application/checklist.token';
import {
  GetChecklistDocHandler,
  GetChecklistRunHandler,
  ListChecklistDocsHandler,
  ListChecklistRunsHandler,
} from './application/queries';
import { ChecklistDocRepository } from './infrastructure/repositories/checklist-doc.repository';
import { ChecklistRunRepository } from './infrastructure/repositories/checklist-run.repository';
import { createChecklistSource } from './infrastructure/sources/checklist-source.factory';
import { ChecklistController } from './presentation/checklist.controller';

const commandHandlers = [
  RefreshChecklistDocsHandler,
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
  controllers: [ChecklistController],
  providers: [
    { provide: CHECKLIST_DOC_REPOSITORY, useClass: ChecklistDocRepository },
    { provide: CHECKLIST_RUN_REPOSITORY, useClass: ChecklistRunRepository },
    { provide: CHECKLIST_SOURCE, useFactory: () => createChecklistSource() },
    ...commandHandlers,
    ...queryHandlers,
  ],
})
export class ChecklistModule {}
