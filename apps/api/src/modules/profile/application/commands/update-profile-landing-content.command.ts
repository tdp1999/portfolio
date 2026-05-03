import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ValidationError, NotFoundError, ErrorLayer, ProfileErrorCode } from '@portfolio/shared/errors';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { IProfileRepository } from '../ports/profile.repository.port';
import { PROFILE_REPOSITORY } from '../profile.token';
import { LandingContentBlocks } from '../../domain/value-objects';
import { UpdateProfileLandingContentSchema } from '../schemas';

export class UpdateProfileLandingContentCommand extends BaseCommand {
  constructor(
    readonly dto: unknown,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(UpdateProfileLandingContentCommand)
export class UpdateProfileLandingContentHandler implements ICommandHandler<UpdateProfileLandingContentCommand> {
  constructor(@Inject(PROFILE_REPOSITORY) private readonly repo: IProfileRepository) {}

  async execute(command: UpdateProfileLandingContentCommand): Promise<void> {
    const { success, data, error } = UpdateProfileLandingContentSchema.safeParse(command.dto);
    if (!success)
      throw ValidationError(error, {
        errorCode: ProfileErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'Update profile landing content validation failed',
      });

    const profile = await this.repo.findByUserId(command.userId);
    if (!profile)
      throw NotFoundError('Profile not found', {
        errorCode: ProfileErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    const newLandingContent = LandingContentBlocks.create({
      tagline: data.tagline,
      stackIntro: data.stackIntro,
      contactIntro: data.contactIntro,
      footerTagline: data.footerTagline,
    });
    const updated = profile.withLandingContent(newLandingContent, command.userId);
    await this.repo.updateLandingContent(command.userId, updated.landingContent, command.userId);
  }
}
