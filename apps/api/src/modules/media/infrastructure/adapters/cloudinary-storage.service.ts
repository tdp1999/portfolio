import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { BadRequestError, InternalServerError } from '@portfolio/shared/errors';
import { MediaErrorCode } from '@portfolio/shared/errors';
import {
  IStorageService,
  UploadOptions,
  StorageResult,
  FileInput,
  BulkUploadResult,
} from '../../application/ports/storage.service.port';

const MAX_BULK_FILES = 10;

@Injectable()
export class CloudinaryStorageService implements IStorageService, OnModuleInit {
  private readonly logger = new Logger(CloudinaryStorageService.name);
  private folderPrefix = 'portfolio';

  onModuleInit(): void {
    const cloudName = process.env['CLOUDINARY_CLOUD_NAME'];
    const apiKey = process.env['CLOUDINARY_API_KEY'];
    const apiSecret = process.env['CLOUDINARY_API_SECRET'];

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error(
        'Missing Cloudinary environment variables: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET'
      );
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

  async upload(file: Buffer, options: UploadOptions): Promise<StorageResult> {
    try {
      const result = await this.uploadBuffer(file, options);
      return this.toStorageResult(result);
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
        const result = await this.uploadBuffer(file.buffer, options);
        return { ...this.toStorageResult(result), originalFilename: file.originalFilename };
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

  private uploadBuffer(buffer: Buffer, options: UploadOptions): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `${this.folderPrefix}/${options.folder}`,
          resource_type: options.resourceType ?? 'auto',
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error('Upload returned no result'));
          } else {
            resolve(result);
          }
        }
      );

      uploadStream.end(buffer);
    });
  }

  private toStorageResult(result: UploadApiResponse): StorageResult {
    return {
      externalId: result.public_id,
      url: result.secure_url,
      format: result.format,
      bytes: result.bytes,
      ...(result.width ? { width: result.width } : {}),
      ...(result.height ? { height: result.height } : {}),
    };
  }
}
