import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '../auth/auth.module';
import { ProjectController } from './presentation/project.controller';
import { ProjectRepository } from './infrastructure/repositories/project.repository';
import { PROJECT_REPOSITORY } from './application/project.token';
import {
  CreateProjectHandler,
  UpdateProjectHandler,
  DeleteProjectHandler,
  RestoreProjectHandler,
  ReorderProjectsHandler,
} from './application/commands';
import {
  ListProjectsHandler,
  GetProjectByIdHandler,
  GetProjectBySlugHandler,
  ListPublicProjectsHandler,
  ListFeaturedProjectsHandler,
} from './application/queries';

const commandHandlers = [
  CreateProjectHandler,
  UpdateProjectHandler,
  DeleteProjectHandler,
  RestoreProjectHandler,
  ReorderProjectsHandler,
];

const queryHandlers = [
  ListProjectsHandler,
  GetProjectByIdHandler,
  GetProjectBySlugHandler,
  ListPublicProjectsHandler,
  ListFeaturedProjectsHandler,
];

@Module({
  imports: [CqrsModule, forwardRef(() => AuthModule)],
  controllers: [ProjectController],
  providers: [
    {
      provide: PROJECT_REPOSITORY,
      useClass: ProjectRepository,
    },
    ...commandHandlers,
    ...queryHandlers,
  ],
  exports: [PROJECT_REPOSITORY],
})
export class ProjectModule {}
