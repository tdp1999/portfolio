import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { ValidationError, ExternalServiceError, ErrorLayer, MediaErrorCode } from '@portfolio/shared/errors';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { MulterFile } from '../../../../shared/types';
import { IMediaRepository } from '../ports/media.repository.port';
import { IStorageService, FileInput } from '../ports/storage.service.port';
import { ISecurityScanner } from '../ports/security-scanner.port';
import { MEDIA_REPOSITORY, STORAGE_SERVICE, SECURITY_SCANNER } from '../media.token';
import { CreateMediaSchema } from '../media.dto';
import { Media } from '../../domain/entities/media.entity';
import { validateFileSize, validateMimeType, validateSecurity } from '../media-file.validator';

export interface BulkUploadResult {
  succeeded: string[];
  failed: { filename: string; error: string }[];
}

export class BulkUploadMediaCommand extends BaseCommand {
  constructor(
    readonly files: MulterFile[],
    readonly dto: unknown,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(BulkUploadMediaCommand)
export class BulkUploadMediaHandler implements ICommandHandler<BulkUploadMediaCommand> {
  private readonly logger = new Logger(BulkUploadMediaHandler.name);

  constructor(
    @Inject(MEDIA_REPOSITORY) private readonly repo: IMediaRepository,
    @Inject(STORAGE_SERVICE) private readonly storage: IStorageService,
    @Inject(SECURITY_SCANNER) private readonly scanner: ISecurityScanner
  ) {}

  async execute(command: BulkUploadMediaCommand): Promise<BulkUploadResult> {
    const { success, data, error } = CreateMediaSchema.safeParse(command.dto);
    if (!success)
      throw ValidationError(error, {
        errorCode: MediaErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'Bulk upload validation failed',
      });

    const validFiles: FileInput[] = [];
    const failed: { filename: string; error: string }[] = [];

    for (const file of command.files) {
      const sanitizedName = this.scanner.sanitizeFilename(file.originalname);
      try {
        validateFileSize(file.buffer, file.mimetype);
        validateMimeType(file.mimetype);
        const scanResult = await validateSecurity(this.scanner, file.buffer, file.mimetype);
        validFiles.push({
          buffer: scanResult.sanitizedBuffer,
          originalFilename: sanitizedName,
          mimeType: scanResult.detectedMimeType,
        });
      } catch (err) {
        failed.push({ filename: sanitizedName, error: err instanceof Error ? err.message : 'Validation failed' });
      }
    }

    if (validFiles.length === 0) {
      return { succeeded: [], failed };
    }

    let bulkResult;
    try {
      bulkResult = await this.storage.uploadBulk(validFiles, {
        folder: data.folder,
        uploadedByUserId: command.userId,
      });
    } catch (err) {
      throw ExternalServiceError('Bulk upload to storage failed', err instanceof Error ? err : undefined, {
        errorCode: MediaErrorCode.UPLOAD_FAILED,
      });
    }

    const succeededIds: string[] = [];
    for (const item of bulkResult.succeeded) {
      const matchingFile = validFiles.find((f) => f.originalFilename === item.originalFilename);
      if (!matchingFile) {
        this.logger.warn(`Storage returned unknown filename "${item.originalFilename}" — skipping`);
        continue;
      }
      const media = Media.create(
        {
          originalFilename: item.originalFilename,
          mimeType: matchingFile.mimeType,
          publicId: item.externalId,
          url: item.url,
          format: item.format,
          bytes: item.bytes,
          width: item.width,
          height: item.height,
          altText: data.altText,
          caption: data.caption,
        },
        command.userId
      );
      const id = await this.repo.add(media);
      succeededIds.push(id);
    }

    for (const item of bulkResult.failed) {
      failed.push({ filename: item.filename, error: item.error });
    }

    return { succeeded: succeededIds, failed };
  }
}
