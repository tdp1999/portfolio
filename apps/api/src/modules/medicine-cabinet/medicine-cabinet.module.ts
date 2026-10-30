import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user';
import {
  CreateHealthProfileHandler,
  CreateMedicalItemHandler,
  DeleteHealthProfileHandler,
  DeleteMedicalItemHandler,
  RenameHealthProfileHandler,
  UpdateMedicalItemHandler,
} from './application/commands';
import { HEALTH_PROFILE_REPOSITORY, MEDICAL_ITEM_REPOSITORY } from './application/medicine-cabinet.token';
import {
  GetMedicalItemHandler,
  ListHealthProfilesHandler,
  ListLookupItemsHandler,
  ListMedicalItemsHandler,
} from './application/queries';
import { HealthProfileRepository } from './infrastructure/repositories/health-profile.repository';
import { MedicalItemRepository } from './infrastructure/repositories/medical-item.repository';
import { MedicineCabinetController } from './presentation/medicine-cabinet.controller';

const commandHandlers = [
  CreateMedicalItemHandler,
  UpdateMedicalItemHandler,
  DeleteMedicalItemHandler,
  CreateHealthProfileHandler,
  RenameHealthProfileHandler,
  DeleteHealthProfileHandler,
];
const queryHandlers = [
  ListMedicalItemsHandler,
  GetMedicalItemHandler,
  ListLookupItemsHandler,
  ListHealthProfilesHandler,
];

@Module({
  imports: [CqrsModule, forwardRef(() => AuthModule), forwardRef(() => UserModule)],
  controllers: [MedicineCabinetController],
  providers: [
    { provide: MEDICAL_ITEM_REPOSITORY, useClass: MedicalItemRepository },
    { provide: HEALTH_PROFILE_REPOSITORY, useClass: HealthProfileRepository },
    ...commandHandlers,
    ...queryHandlers,
  ],
})
export class MedicineCabinetModule {}
