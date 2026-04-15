import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ValidationError, NotFoundError, ErrorLayer, ProfileErrorCode } from '@portfolio/shared/errors';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { IProfileRepository } from '../ports/profile.repository.port';
import { PROFILE_REPOSITORY } from '../profile.token';
import { SeoOg } from '../../domain/value-objects';
import { UpdateProfileSeoOgSchema } from '../schemas';

export class UpdateProfileSeoOgCommand extends BaseCommand {
  constructor(
    readonly dto: unknown,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(UpdateProfileSeoOgCommand)
export class UpdateProfileSeoOgHandler implements ICommandHandler<UpdateProfileSeoOgCommand> {
  constructor(@Inject(PROFILE_REPOSITORY) private readonly repo: IProfileRepository) {}

  async execute(command: UpdateProfileSeoOgCommand): Promise<void> {
    const { success, data, error } = UpdateProfileSeoOgSchema.safeParse(command.dto);
    if (!success)
      throw ValidationError(error, {
        errorCode: ProfileErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'Update profile SEO/OG validation failed',
      });

    const profile = await this.repo.findByUserId(command.userId);
    if (!profile)
      throw NotFoundError('Profile not found', {
        errorCode: ProfileErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    const newSeoOg = SeoOg.create({
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      canonicalUrl: data.canonicalUrl,
      ogImageId: profile.ogImageId,
    });
    const updated = profile.withSeoOg(newSeoOg, command.userId);
    await this.repo.updateSeoOg(command.userId, updated.seoOg, command.userId);
  }
}
