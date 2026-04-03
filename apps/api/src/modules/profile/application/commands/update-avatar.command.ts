import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ValidationError, NotFoundError, ErrorLayer, ProfileErrorCode } from '@portfolio/shared/errors';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { IProfileRepository } from '../ports/profile.repository.port';
import { PROFILE_REPOSITORY } from '../profile.token';
import { IMediaRepository } from '../../../media/application/ports/media.repository.port';
import { MEDIA_REPOSITORY } from '../../../media/application/media.token';
import { UpdateAvatarSchema } from '../profile.dto';

export class UpdateAvatarCommand extends BaseCommand {
  constructor(
    readonly dto: unknown,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(UpdateAvatarCommand)
export class UpdateAvatarHandler implements ICommandHandler<UpdateAvatarCommand> {
  constructor(
    @Inject(PROFILE_REPOSITORY) private readonly repo: IProfileRepository,
    @Inject(MEDIA_REPOSITORY) private readonly mediaRepo: IMediaRepository
  ) {}

  async execute(command: UpdateAvatarCommand): Promise<void> {
    const { success, data, error } = UpdateAvatarSchema.safeParse(command.dto);
    if (!success)
      throw ValidationError(error, {
        errorCode: ProfileErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'Update avatar validation failed',
      });

    if (data.avatarId) {
      const media = await this.mediaRepo.findById(data.avatarId);
      if (!media)
        throw NotFoundError('Avatar media not found', {
          errorCode: ProfileErrorCode.MEDIA_NOT_FOUND,
          layer: ErrorLayer.APPLICATION,
        });
    }

    await this.repo.updateAvatar(command.userId, data.avatarId);
  }
}
