import { randomUUID } from 'crypto';
import { mkdir, rm, writeFile } from 'fs/promises';
import { dirname, join, resolve, sep } from 'path';
import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
import { BadRequestError, InternalServerError, MediaErrorCode } from '@portfolio/shared/errors';
import { MIME_TYPE_EXTENSIONS } from '../../application/media.constants';
import {
  IStorageService,
  UploadOptions,
  SingleUploadOptions,
  StorageResult,
  FileInput,
  BulkUploadResult,
} from '../../application/ports/storage.service.port';

const MAX_BULK_FILES = 10;
const MAX_BASENAME_LEN = 64;

/**
 * Public path prefix for stored files, served by `MediaFileController`.
 *
 * The trailing `-files` matters: `CloudinaryThumbPipe` and `CloudinaryPdfThumbPipe` decide
 * whether a URL is transformable by looking for the literal `/upload/` segment. A prefix like
 * `/api/uploads/` would not match either (the segment needs a slash straight after `upload`),
 * but it reads as if it might, so the unambiguous name is the one to keep.
 */
export const MEDIA_FILE_ROUTE = 'media-files';

/**
 * Filesystem-backed {@link IStorageService}, used when Cloudinary credentials are absent.
 *
 * This exists so the media pipeline works on a bare checkout: CI, a fresh clone, or a fork
 * with no secrets. Without it the whole picker surface is untestable off a configured machine
 * (this was `Cloudinary upload failed: Must supply api_key` on every CI e2e shard), and every
 * CI run would otherwise write throwaway assets into a real Cloudinary account.
 *
 * It is deliberately not a Cloudinary substitute in production:
 *
 * - **No transformation engine.** {@link generateUrl} ignores `transforms` and returns the
 *   original file. The two thumbnail pipes already degrade for non-Cloudinary URLs — one
 *   passes the URL through, the other returns `''` so the caller falls back to an icon — so
 *   the console renders full-size images instead of thumbnails, which is correct but heavier.
 * - **Local disk only.** Files live under {@link rootDir} and do not survive a fresh container.
 * - **The persisted URL is absolute and environment-bound.** `Media.url` keeps whatever
 *   `publicBaseUrl` was at upload time (`http://localhost:3000/...` by default), and consumer
 *   columns copy it. Configuring Cloudinary later does not rewrite those rows, and `publicId`
 *   shapes differ between backends, so a cross-backend `delete` is a silent no-op. A database
 *   that ever ran on this adapter is a throwaway one — which is why `MediaModule` refuses to
 *   select it in production at all.
 *
 * `externalId` is the file's path relative to {@link rootDir}, extension included, so
 * `<rootDir>/<externalId>` locates it and `<publicBaseUrl>/api/<MEDIA_FILE_ROUTE>/<externalId>`
 * serves it.
 */
@Injectable()
export class LocalStorageService implements IStorageService {
  private readonly logger = new Logger(LocalStorageService.name);
  private readonly rootDir: string;
  private readonly publicBaseUrl: string;

  constructor() {
    this.rootDir = resolve(process.env['LOCAL_STORAGE_DIR'] ?? join(process.cwd(), '.local-media'));
    const port = process.env['PORT'] ?? '3000';
    this.publicBaseUrl = (process.env['LOCAL_STORAGE_PUBLIC_URL'] ?? `http://localhost:${port}`).replace(/\/+$/, '');
  }

  /** Where files land and how they are addressed, for the startup log in `MediaModule`. */
  describe(): string {
    return `${this.rootDir} served from ${this.publicBaseUrl}/api/${MEDIA_FILE_ROUTE}`;
  }

  async upload(file: Buffer, options: SingleUploadOptions): Promise<StorageResult> {
    return this.writeOne(file, options, {
      originalFilename: options.originalFilename,
      mimeType: options.mimeType,
    });
  }

  async uploadBulk(files: FileInput[], options: UploadOptions): Promise<BulkUploadResult> {
    if (files.length > MAX_BULK_FILES) {
      throw BadRequestError(`Bulk upload limited to ${MAX_BULK_FILES} files per request`, {
        errorCode: MediaErrorCode.INVALID_INPUT,
      });
    }

    const results = await Promise.allSettled(
      files.map(async (file) => {
        const stored = await this.writeOne(file.buffer, options, {
          originalFilename: file.originalFilename,
          mimeType: file.mimeType,
        });
        return { ...stored, originalFilename: file.originalFilename };
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
    const absolute = this.resolveWithinRoot(externalId);
    if (!absolute) {
      // Nothing addressable to remove. Callers treat delete as best-effort cleanup, so a bad
      // id is not worth failing the surrounding hard-delete over.
      this.logger.warn(`Refusing to delete out-of-root external id: ${externalId}`);
      return;
    }

    try {
      await rm(absolute, { force: true });
    } catch (error) {
      this.logger.error(`Local delete failed for ${externalId}: ${(error as Error).message}`);
      throw InternalServerError('File deletion failed', {
        errorCode: MediaErrorCode.DELETE_FAILED,
      });
    }
  }

  /**
   * `transforms` is accepted to satisfy the port and ignored: there is no local transformation
   * engine, so every caller gets the original file.
   */
  generateUrl(externalId: string): string {
    return `${this.publicBaseUrl}/api/${MEDIA_FILE_ROUTE}/${externalId}`;
  }

  /**
   * Absolute path of a stored file, or `null` when the id does not name one inside the root.
   *
   * The root itself is rejected, not just paths above it: `''` and `'.'` both resolve to
   * `rootDir`, and returning it would point `delete()` at the whole storage directory.
   */
  resolveWithinRoot(externalId: string): string | null {
    const absolute = resolve(this.rootDir, externalId);
    if (!absolute.startsWith(this.rootDir + sep)) return null;
    return absolute;
  }

  private async writeOne(
    buffer: Buffer,
    options: UploadOptions,
    perFile: { originalFilename: string; mimeType: string }
  ): Promise<StorageResult> {
    const format = this.deriveFormat(perFile.mimeType);
    const externalId = `${options.folder}/${this.slugify(perFile.originalFilename)}-${randomUUID()}.${format}`;
    const absolute = this.resolveWithinRoot(externalId);
    if (!absolute) {
      throw InternalServerError('File upload failed', { errorCode: MediaErrorCode.UPLOAD_FAILED });
    }

    try {
      await mkdir(dirname(absolute), { recursive: true });
      await writeFile(absolute, buffer);
    } catch (error) {
      this.logger.error(`Local upload failed: ${(error as Error).message}`);
      throw InternalServerError('File upload failed', {
        errorCode: MediaErrorCode.UPLOAD_FAILED,
      });
    }

    const dimensions = await this.readDimensions(buffer, perFile.mimeType);

    return {
      externalId,
      url: this.generateUrl(externalId),
      format,
      bytes: buffer.length,
      ...dimensions,
    };
  }

  /**
   * Width/height for raster images only, and never fatal. Cloudinary reports these as part of
   * the upload response; locally they are optional metadata, and a PDF or a format this build
   * of sharp cannot decode simply has none.
   */
  private async readDimensions(buffer: Buffer, mimeType: string): Promise<{ width?: number; height?: number }> {
    if (!mimeType.startsWith('image/')) return {};
    try {
      const { width, height } = await sharp(buffer).metadata();
      return {
        ...(width ? { width } : {}),
        ...(height ? { height } : {}),
      };
    } catch {
      return {};
    }
  }

  /** Filename stem reduced to a path-safe slug; the extension is appended by the caller. */
  private slugify(filename: string): string {
    const dot = filename.lastIndexOf('.');
    const stem = dot > 0 ? filename.slice(0, dot) : filename;
    const slug = stem
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, MAX_BASENAME_LEN);
    return slug || 'file';
  }

  /**
   * Extension from the scanner-validated MIME type, never from the uploaded filename.
   *
   * `detectMimeType` waves `text/plain` and `text/markdown` through unverified — neither has
   * magic bytes — so `poc.html` declared as `text/plain` reaches storage with its extension
   * intact. Naming the stored file `poc.html` would make `sendFile` serve it as `text/html` from
   * the API's own origin; the same trick with `.svg` or `.js` is worse. `bin` is the fallback so
   * an unmapped type can never inherit an executable extension.
   */
  private deriveFormat(mimeType: string): string {
    return MIME_TYPE_EXTENSIONS[mimeType] ?? 'bin';
  }
}
