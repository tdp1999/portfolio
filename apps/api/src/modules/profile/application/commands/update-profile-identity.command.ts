import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ValidationError, NotFoundError, ErrorLayer, ProfileErrorCode } from '@portfolio/shared/errors';
import type { EditorDocument } from '@portfolio/shared/features/rte-core';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { RichTextService } from '../../../shared/rich-text';
import { IProfileRepository } from '../ports/profile.repository.port';
import { PROFILE_REPOSITORY } from '../profile.token';
import { Identity } from '../../domain/value-objects';
import { UpdateProfileIdentitySchema } from '../schemas';

export class UpdateProfileIdentityCommand extends BaseCommand {
  constructor(
    readonly dto: unknown,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(UpdateProfileIdentityCommand)
export class UpdateProfileIdentityHandler implements ICommandHandler<UpdateProfileIdentityCommand> {
  constructor(
    @Inject(PROFILE_REPOSITORY) private readonly repo: IProfileRepository,
    private readonly richText: RichTextService
  ) {}

  async execute(command: UpdateProfileIdentityCommand): Promise<void> {
    const { success, data, error } = UpdateProfileIdentitySchema.safeParse(command.dto);
    if (!success)
      throw ValidationError(error, {
        errorCode: ProfileErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'Update profile identity validation failed',
      });

    const profile = await this.repo.findByUserId(command.userId);
    if (!profile)
      throw NotFoundError('Profile not found', {
        errorCode: ProfileErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    // bioLong schema allows partial bilingual; coerce missing locales to empty strings
    // so the domain receives the full TranslatableJson shape it expects.
    const newIdentity = Identity.create({
      fullName: data.fullName,
      title: data.title,
      bioShort: data.bioShort,
      bioLong: data.bioLong ? { en: data.bioLong.en ?? '', vi: data.bioLong.vi ?? '' } : null,
      avatarId: profile.avatarId,
    });
    const updated = profile.withIdentity(newIdentity, command.userId);

    // Rich-text bioLong: when the console sends the bilingual editor document, run it
    // through the canonical pipeline (migrate → headless HTML → sanitize) BEFORE the
    // write, so a bad document throws (shaped 400) without leaving a half-applied
    // identity. The triple is then persisted in the SAME update as identity (atomic).
    // Additive — absent bioLongJson means an identity-only update, exactly as before.
    const bioLongRichText = data.bioLongJson
      ? await this.richText.toCanonicalFormTranslatable(
          data.bioLongJson as { en: EditorDocument; vi: EditorDocument },
          'profile.bioLong'
        )
      : null;

    await this.repo.updateIdentity(command.userId, updated.identity, command.userId, bioLongRichText);
  }
}
