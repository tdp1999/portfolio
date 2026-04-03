import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '../auth';
import { UserModule } from '../user';
import { MediaModule } from '../media/media.module';
import { PROFILE_REPOSITORY } from './application/profile.token';
import { UpsertProfileHandler, UpdateAvatarHandler, UpdateOgImageHandler } from './application/commands';
import { GetProfileHandler, GetPublicProfileHandler, GetJsonLdHandler } from './application/queries';
import { ProfileRepository } from './infrastructure/repositories/profile.repository';
import { ProfileController, AdminProfileController } from './presentation/profile.controller';

const CommandHandlers = [UpsertProfileHandler, UpdateAvatarHandler, UpdateOgImageHandler];
const QueryHandlers = [GetProfileHandler, GetPublicProfileHandler, GetJsonLdHandler];

@Module({
  imports: [CqrsModule, forwardRef(() => AuthModule), forwardRef(() => UserModule), forwardRef(() => MediaModule)],
  controllers: [ProfileController, AdminProfileController],
  providers: [
    {
      provide: PROFILE_REPOSITORY,
      useClass: ProfileRepository,
    },
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [PROFILE_REPOSITORY],
})
export class ProfileModule {}
