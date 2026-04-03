import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ValidationError, NotFoundError, ErrorLayer, ProfileErrorCode } from '@portfolio/shared/errors';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { Profile } from '../../domain/entities/profile.entity';
import { IProfileRepository } from '../ports/profile.repository.port';
import { PROFILE_REPOSITORY } from '../profile.token';
import { IMediaRepository } from '../../../media/application/ports/media.repository.port';
import { MEDIA_REPOSITORY } from '../../../media/application/media.token';
import { UpsertProfileSchema } from '../profile.dto';
import { ICreateProfilePayload, IUpdateProfilePayload } from '../../domain/profile.types';

export class UpsertProfileCommand extends BaseCommand {
  constructor(
    readonly dto: unknown,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(UpsertProfileCommand)
export class UpsertProfileHandler implements ICommandHandler<UpsertProfileCommand> {
  constructor(
    @Inject(PROFILE_REPOSITORY) private readonly repo: IProfileRepository,
    @Inject(MEDIA_REPOSITORY) private readonly mediaRepo: IMediaRepository
  ) {}

  async execute(command: UpsertProfileCommand): Promise<{ id: string }> {
    const { success, data, error } = UpsertProfileSchema.safeParse(command.dto);
    if (!success)
      throw ValidationError(error, {
        errorCode: ProfileErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'Profile upsert validation failed',
      });

    if (data.avatarId) {
      const avatar = await this.mediaRepo.findById(data.avatarId);
      if (!avatar)
        throw NotFoundError('Avatar media not found', {
          errorCode: ProfileErrorCode.MEDIA_NOT_FOUND,
          layer: ErrorLayer.APPLICATION,
        });
    }

    if (data.ogImageId) {
      const ogImage = await this.mediaRepo.findById(data.ogImageId);
      if (!ogImage)
        throw NotFoundError('OG image media not found', {
          errorCode: ProfileErrorCode.MEDIA_NOT_FOUND,
          layer: ErrorLayer.APPLICATION,
        });
    }

    const existing = await this.repo.findByUserId(command.userId);

    let entity: Profile;
    if (existing) {
      entity = existing.update(data as IUpdateProfilePayload, command.userId);
    } else {
      entity = Profile.create({ ...data, userId: command.userId } as ICreateProfilePayload, command.userId);
    }

    const id = await this.repo.upsert(entity);
    return { id };
  }
}
