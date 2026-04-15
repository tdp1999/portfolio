import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ValidationError, NotFoundError, ErrorLayer, ProfileErrorCode } from '@portfolio/shared/errors';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { IProfileRepository } from '../ports/profile.repository.port';
import { PROFILE_REPOSITORY } from '../profile.token';
import type { SocialLink } from '@portfolio/shared/types';
import { SocialLinks } from '../../domain/value-objects';
import { UpdateProfileSocialLinksSchema } from '../schemas';

export class UpdateProfileSocialLinksCommand extends BaseCommand {
  constructor(
    readonly dto: unknown,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(UpdateProfileSocialLinksCommand)
export class UpdateProfileSocialLinksHandler implements ICommandHandler<UpdateProfileSocialLinksCommand> {
  constructor(@Inject(PROFILE_REPOSITORY) private readonly repo: IProfileRepository) {}

  async execute(command: UpdateProfileSocialLinksCommand): Promise<void> {
    const { success, data, error } = UpdateProfileSocialLinksSchema.safeParse(command.dto);
    if (!success)
      throw ValidationError(error, {
        errorCode: ProfileErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'Update profile social links validation failed',
      });

    const profile = await this.repo.findByUserId(command.userId);
    if (!profile)
      throw NotFoundError('Profile not found', {
        errorCode: ProfileErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    const newSocialLinks = SocialLinks.create({
      socialLinks: data.socialLinks as SocialLink[],
      resumeUrls: data.resumeUrls,
      certifications: data.certifications,
    });
    const updated = profile.withSocialLinks(newSocialLinks, command.userId);
    await this.repo.updateSocialLinks(command.userId, updated.socialLinksSection, command.userId);
  }
}
