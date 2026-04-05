import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user';
import { ExperienceController } from './presentation/experience.controller';
import { ExperienceRepository } from './infrastructure/repositories/experience.repository';
import { EXPERIENCE_REPOSITORY } from './application/experience.token';
import {
  CreateExperienceHandler,
  UpdateExperienceHandler,
  DeleteExperienceHandler,
  RestoreExperienceHandler,
  ReorderExperiencesHandler,
} from './application/commands';
import {
  ListExperiencesHandler,
  GetExperienceByIdHandler,
  GetExperienceBySlugHandler,
  ListPublicExperiencesHandler,
} from './application/queries';
import { SkillModule } from '../skill/skill.module';
import { MediaModule } from '../media/media.module';

const commandHandlers = [
  CreateExperienceHandler,
  UpdateExperienceHandler,
  DeleteExperienceHandler,
  RestoreExperienceHandler,
  ReorderExperiencesHandler,
];

const queryHandlers = [
  ListExperiencesHandler,
  GetExperienceByIdHandler,
  GetExperienceBySlugHandler,
  ListPublicExperiencesHandler,
];

@Module({
  imports: [CqrsModule, forwardRef(() => AuthModule), forwardRef(() => UserModule), SkillModule, MediaModule],
  controllers: [ExperienceController],
  providers: [
    {
      provide: EXPERIENCE_REPOSITORY,
      useClass: ExperienceRepository,
    },
    ...commandHandlers,
    ...queryHandlers,
  ],
  exports: [EXPERIENCE_REPOSITORY],
})
export class ExperienceModule {}
