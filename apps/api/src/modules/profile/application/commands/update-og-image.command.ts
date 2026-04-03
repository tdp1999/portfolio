import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ValidationError, NotFoundError, ErrorLayer, ProfileErrorCode } from '@portfolio/shared/errors';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { IProfileRepository } from '../ports/profile.repository.port';
import { PROFILE_REPOSITORY } from '../profile.token';
import { IMediaRepository } from '../../../media/application/ports/media.repository.port';
import { MEDIA_REPOSITORY } from '../../../media/application/media.token';
import { UpdateOgImageSchema } from '../profile.dto';

export class UpdateOgImageCommand extends BaseCommand {
  constructor(
    readonly dto: unknown,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(UpdateOgImageCommand)
export class UpdateOgImageHandler implements ICommandHandler<UpdateOgImageCommand> {
  constructor(
    @Inject(PROFILE_REPOSITORY) private readonly repo: IProfileRepository,
    @Inject(MEDIA_REPOSITORY) private readonly mediaRepo: IMediaRepository
  ) {}

  async execute(command: UpdateOgImageCommand): Promise<void> {
    const { success, data, error } = UpdateOgImageSchema.safeParse(command.dto);
    if (!success)
      throw ValidationError(error, {
        errorCode: ProfileErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'Update OG image validation failed',
      });

    if (data.ogImageId) {
      const media = await this.mediaRepo.findById(data.ogImageId);
      if (!media)
        throw NotFoundError('OG image media not found', {
          errorCode: ProfileErrorCode.MEDIA_NOT_FOUND,
          layer: ErrorLayer.APPLICATION,
        });
    }

    await this.repo.updateOgImage(command.userId, data.ogImageId);
  }
}
