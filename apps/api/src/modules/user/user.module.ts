import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { UserController } from './presentation/user.controller';
import { UserRepository } from './infrastructure/repositories/user.repository';
import { USER_REPOSITORY } from './application/user.token';
import {
  CreateUserHandler,
  UpdateUserHandler,
  UpdateLastLoginHandler,
} from './application/commands';
import { GetUserByIdHandler, GetUserByEmailHandler } from './application/queries';

const commandHandlers = [CreateUserHandler, UpdateUserHandler, UpdateLastLoginHandler];

const queryHandlers = [GetUserByIdHandler, GetUserByEmailHandler];

@Module({
  imports: [CqrsModule],
  controllers: [UserController],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
    ...commandHandlers,
    ...queryHandlers,
  ],
  exports: [USER_REPOSITORY],
})
export class UserModule {}
