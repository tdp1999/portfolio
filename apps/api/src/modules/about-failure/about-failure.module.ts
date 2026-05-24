import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '../auth/auth.module';
import { ProfileModule } from '../profile';
import { UserModule } from '../user';
import { AboutFailureController, AdminAboutFailureController } from './presentation/about-failure.controller';
import { AboutFailureRepository } from './infrastructure/repositories/about-failure.repository';
import { ABOUT_FAILURE_REPOSITORY } from './application/about-failure.token';
import {
  CreateAboutFailureHandler,
  UpdateAboutFailureHandler,
  DeleteAboutFailureHandler,
  ReorderAboutFailuresHandler,
} from './application/commands';
import { ListAboutFailuresHandler, GetAboutFailureByIdHandler } from './application/queries';

const commandHandlers = [
  CreateAboutFailureHandler,
  UpdateAboutFailureHandler,
  DeleteAboutFailureHandler,
  ReorderAboutFailuresHandler,
];
const queryHandlers = [ListAboutFailuresHandler, GetAboutFailureByIdHandler];

@Module({
  imports: [
    CqrsModule,
    forwardRef(() => AuthModule),
    forwardRef(() => UserModule),
    // ProfileModule provides MarkProfileContentUpdatedHandler — invoked as a
    // side-effect after every AboutFailure write to bump the /about hero
    // "Last updated" timestamp.
    forwardRef(() => ProfileModule),
  ],
  controllers: [AboutFailureController, AdminAboutFailureController],
  providers: [
    { provide: ABOUT_FAILURE_REPOSITORY, useClass: AboutFailureRepository },
    ...commandHandlers,
    ...queryHandlers,
  ],
  exports: [ABOUT_FAILURE_REPOSITORY],
})
export class AboutFailureModule {}
