import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email';
import { UserController } from './presentation/user.controller';
import { UserRepository } from './infrastructure/repositories/user.repository';
import { USER_REPOSITORY } from './application/user.token';
import {
  CreateUserHandler,
  UpdateUserHandler,
  UpdateLastLoginHandler,
  InviteUserHandler,
  ResendInviteHandler,
  SoftDeleteUserHandler,
} from './application/commands';
import { GetUserByIdHandler, GetUserByEmailHandler, ListUsersHandler } from './application/queries';

const commandHandlers = [
  CreateUserHandler,
  UpdateUserHandler,
  UpdateLastLoginHandler,
  InviteUserHandler,
  ResendInviteHandler,
  SoftDeleteUserHandler,
];

const queryHandlers = [GetUserByIdHandler, GetUserByEmailHandler, ListUsersHandler];

@Module({
  imports: [CqrsModule, forwardRef(() => AuthModule), EmailModule],
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
