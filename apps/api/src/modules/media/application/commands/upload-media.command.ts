import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ValidationError, ExternalServiceError, ErrorLayer, MediaErrorCode } from '@portfolio/shared/errors';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { MulterFile } from '../../../../shared/types';
import { IMediaRepository } from '../ports/media.repository.port';
import { IStorageService } from '../ports/storage.service.port';
import { ISecurityScanner } from '../ports/security-scanner.port';
import { MEDIA_REPOSITORY, STORAGE_SERVICE, SECURITY_SCANNER } from '../media.token';
import { CreateMediaSchema } from '../media.dto';
import { Media } from '../../domain/entities/media.entity';
import { validateFileSize, validateMimeType, validateSecurity, resolveResourceType } from '../media-file.validator';

export class UploadMediaCommand extends BaseCommand {
  constructor(
    readonly file: MulterFile,
    readonly dto: unknown,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(UploadMediaCommand)
export class UploadMediaHandler implements ICommandHandler<UploadMediaCommand> {
  constructor(
    @Inject(MEDIA_REPOSITORY) private readonly repo: IMediaRepository,
    @Inject(STORAGE_SERVICE) private readonly storage: IStorageService,
    @Inject(SECURITY_SCANNER) private readonly scanner: ISecurityScanner
  ) {}

  async execute(command: UploadMediaCommand): Promise<string> {
    const { success, data, error } = CreateMediaSchema.safeParse(command.dto);
    if (!success)
      throw ValidationError(error, {
        errorCode: MediaErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'Media upload validation failed',
      });

    const { buffer, originalname, mimetype } = command.file;

    validateFileSize(buffer, mimetype);
    validateMimeType(mimetype);
    const scanResult = await validateSecurity(this.scanner, buffer, mimetype);

    let storageResult;
    try {
      storageResult = await this.storage.upload(scanResult.sanitizedBuffer, {
        folder: data.folder,
        resourceType: resolveResourceType(mimetype),
      });
    } catch (err) {
      throw ExternalServiceError('Media upload to storage failed', err instanceof Error ? err : undefined, {
        errorCode: MediaErrorCode.UPLOAD_FAILED,
      });
    }

    const sanitizedFilename = this.scanner.sanitizeFilename(originalname);
    const media = Media.create(
      {
        originalFilename: sanitizedFilename,
        mimeType: scanResult.detectedMimeType,
        publicId: storageResult.externalId,
        url: storageResult.url,
        format: storageResult.format,
        bytes: storageResult.bytes,
        width: storageResult.width,
        height: storageResult.height,
        altText: data.altText,
        caption: data.caption,
      },
      command.userId
    );

    return this.repo.add(media);
  }
}
