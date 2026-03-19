import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user';
import { SkillController } from './presentation/skill.controller';
import { SkillRepository } from './infrastructure/repositories/skill.repository';
import { SKILL_REPOSITORY } from './application/skill.token';
import {
  CreateSkillHandler,
  UpdateSkillHandler,
  DeleteSkillHandler,
  RestoreSkillHandler,
} from './application/commands';
import {
  ListSkillsHandler,
  GetSkillByIdHandler,
  GetSkillBySlugHandler,
  GetSkillChildrenHandler,
} from './application/queries';

const commandHandlers = [CreateSkillHandler, UpdateSkillHandler, DeleteSkillHandler, RestoreSkillHandler];
const queryHandlers = [ListSkillsHandler, GetSkillByIdHandler, GetSkillBySlugHandler, GetSkillChildrenHandler];

@Module({
  imports: [CqrsModule, forwardRef(() => AuthModule), forwardRef(() => UserModule)],
  controllers: [SkillController],
  providers: [
    {
      provide: SKILL_REPOSITORY,
      useClass: SkillRepository,
    },
    ...commandHandlers,
    ...queryHandlers,
  ],
  exports: [SKILL_REPOSITORY],
})
export class SkillModule {}
