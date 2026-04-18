import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { v2 as cloudinary, UploadApiOptions, UploadApiResponse } from 'cloudinary';
import { BadRequestError, InternalServerError } from '@portfolio/shared/errors';
import { MediaErrorCode } from '@portfolio/shared/errors';
import {
  IStorageService,
  UploadOptions,
  SingleUploadOptions,
  StorageResult,
  FileInput,
  BulkUploadResult,
} from '../../application/ports/storage.service.port';

const MAX_BULK_FILES = 10;
const MAX_DISPLAY_NAME_LEN = 255;

@Injectable()
export class CloudinaryStorageService implements IStorageService, OnModuleInit {
  private readonly logger = new Logger(CloudinaryStorageService.name);
  private folderPrefix = 'portfolio';

  onModuleInit(): void {
    const cloudName = process.env['CLOUDINARY_CLOUD_NAME'];
    const apiKey = process.env['CLOUDINARY_API_KEY'];
    const apiSecret = process.env['CLOUDINARY_API_SECRET'];

    if (!cloudName || !apiKey || !apiSecret) {
      // Boot without Cloudinary when env vars are missing (CI, local-no-upload).
      // Upload/delete calls will surface a clear runtime error via the SDK.
      this.logger.warn('Cloudinary env vars missing; storage will be unavailable until configured.');
      return;
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    const prefix = process.env['CLOUDINARY_FOLDER_PREFIX'];
    this.folderPrefix = prefix ? `${prefix}/portfolio` : 'portfolio';

    this.logger.log(`Cloudinary configured for cloud: ${cloudName}, folder prefix: ${this.folderPrefix}`);
  }

  async upload(file: Buffer, options: SingleUploadOptions): Promise<StorageResult> {
    try {
      const result = await this.uploadBuffer(file, options, {
        originalFilename: options.originalFilename,
        mimeType: options.mimeType,
      });
      return this.toStorageResult(result, options.originalFilename, options.mimeType);
    } catch (error) {
      this.logger.error(`Cloudinary upload failed: ${(error as Error).message}`);
      throw InternalServerError('File upload failed', {
        errorCode: MediaErrorCode.UPLOAD_FAILED,
      });
    }
  }

  async uploadBulk(files: FileInput[], options: UploadOptions): Promise<BulkUploadResult> {
    if (files.length > MAX_BULK_FILES) {
      throw BadRequestError(`Bulk upload limited to ${MAX_BULK_FILES} files per request`, {
        errorCode: MediaErrorCode.INVALID_INPUT,
      });
    }

    const results = await Promise.allSettled(
      files.map(async (file) => {
        const result = await this.uploadBuffer(file.buffer, options, {
          originalFilename: file.originalFilename,
          mimeType: file.mimeType,
        });
        return {
          ...this.toStorageResult(result, file.originalFilename, file.mimeType),
          originalFilename: file.originalFilename,
        };
      })
    );

    const succeeded: BulkUploadResult['succeeded'] = [];
    const failed: BulkUploadResult['failed'] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        succeeded.push(result.value);
      } else {
        failed.push({
          filename: files[index].originalFilename,
          error: result.reason?.message ?? 'Upload failed',
        });
      }
    });

    return { succeeded, failed };
  }

  async delete(externalId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(externalId);
    } catch (error) {
      this.logger.error(`Cloudinary delete failed for ${externalId}: ${(error as Error).message}`);
      throw InternalServerError('File deletion failed', {
        errorCode: MediaErrorCode.DELETE_FAILED,
      });
    }
  }

  generateUrl(externalId: string, transforms?: Record<string, string>): string {
    return cloudinary.url(externalId, {
      secure: true,
      ...(transforms ? { transformation: [transforms] } : {}),
    });
  }

  private uploadBuffer(
    buffer: Buffer,
    options: UploadOptions,
    perFile: { originalFilename: string; mimeType: string }
  ): Promise<UploadApiResponse> {
    const assetFolder = `${this.folderPrefix}/${options.folder}`;
    const displayName = perFile.originalFilename.slice(0, MAX_DISPLAY_NAME_LEN);
    const resourceType = options.resourceType ?? 'auto';

    const uploadParams: UploadApiOptions = {
      asset_folder: assetFolder,
      resource_type: resourceType,
      type: 'upload',
      access_mode: 'public',
      use_filename: true,
      unique_filename: true,
      filename_override: perFile.originalFilename,
      display_name: displayName,
      overwrite: false,
      invalidate: true,
      tags: [options.folder, perFile.mimeType.split('/')[0]],
      context: this.buildContext({
        original_filename: perFile.originalFilename,
        mime_type: perFile.mimeType,
        folder: options.folder,
        ...(options.uploadedByUserId ? { uploaded_by: options.uploadedByUserId } : {}),
      }),
    };

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(uploadParams, (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Upload returned no result'));
        } else {
          resolve(result);
        }
      });

      uploadStream.end(buffer);
    });
  }

  private buildContext(entries: Record<string, string>): Record<string, string> {
    const sanitized: Record<string, string> = {};
    for (const [key, value] of Object.entries(entries)) {
      sanitized[key] = value.replace(/[|=]/g, '_');
    }
    return sanitized;
  }

  private toStorageResult(result: UploadApiResponse, originalFilename: string, mimeType: string): StorageResult {
    const format = result.format ?? this.deriveFormat(originalFilename, mimeType);
    return {
      externalId: result.public_id,
      url: result.secure_url,
      format,
      bytes: result.bytes,
      ...(result.width ? { width: result.width } : {}),
      ...(result.height ? { height: result.height } : {}),
    };
  }

  private deriveFormat(filename: string, mimeType: string): string {
    const dot = filename.lastIndexOf('.');
    if (dot >= 0 && dot < filename.length - 1) {
      return filename.slice(dot + 1).toLowerCase();
    }
    const slash = mimeType.lastIndexOf('/');
    if (slash >= 0 && slash < mimeType.length - 1) {
      return mimeType.slice(slash + 1).toLowerCase();
    }
    return 'bin';
  }
}
