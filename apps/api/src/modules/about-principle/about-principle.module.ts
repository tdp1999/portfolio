import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '../auth/auth.module';
import { ProfileModule } from '../profile';
import { UserModule } from '../user';
import { AboutPrincipleController, AdminAboutPrincipleController } from './presentation/about-principle.controller';
import { AboutPrincipleRepository } from './infrastructure/repositories/about-principle.repository';
import { ABOUT_PRINCIPLE_REPOSITORY } from './application/about-principle.token';
import {
  CreateAboutPrincipleHandler,
  UpdateAboutPrincipleHandler,
  DeleteAboutPrincipleHandler,
  ReorderAboutPrinciplesHandler,
} from './application/commands';
import { ListAboutPrinciplesHandler, GetAboutPrincipleByIdHandler } from './application/queries';

const commandHandlers = [
  CreateAboutPrincipleHandler,
  UpdateAboutPrincipleHandler,
  DeleteAboutPrincipleHandler,
  ReorderAboutPrinciplesHandler,
];
const queryHandlers = [ListAboutPrinciplesHandler, GetAboutPrincipleByIdHandler];

@Module({
  imports: [
    CqrsModule,
    forwardRef(() => AuthModule),
    forwardRef(() => UserModule),
    // ProfileModule provides MarkProfileContentUpdatedHandler — invoked as a
    // side-effect after every AboutPrinciple write to bump the /about hero
    // "Last updated" timestamp.
    forwardRef(() => ProfileModule),
  ],
  controllers: [AboutPrincipleController, AdminAboutPrincipleController],
  providers: [
    { provide: ABOUT_PRINCIPLE_REPOSITORY, useClass: AboutPrincipleRepository },
    ...commandHandlers,
    ...queryHandlers,
  ],
  exports: [ABOUT_PRINCIPLE_REPOSITORY],
})
export class AboutPrincipleModule {}
