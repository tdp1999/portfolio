import { UploadMediaCommand, UploadMediaHandler } from './upload-media.command';
import { BulkUploadMediaCommand, BulkUploadMediaHandler } from './bulk-upload-media.command';
import { UpdateMediaMetadataCommand, UpdateMediaMetadataHandler } from './update-media-metadata.command';
import { SoftDeleteMediaCommand, SoftDeleteMediaHandler } from './soft-delete-media.command';
import { RestoreMediaCommand, RestoreMediaHandler } from './restore-media.command';
import { HardDeleteMediaCommand, HardDeleteMediaHandler } from './hard-delete-media.command';
import { IMediaRepository } from '../ports/media.repository.port';
import { IStorageService } from '../ports/storage.service.port';
import { ISecurityScanner } from '../ports/security-scanner.port';
import { Media } from '../../domain/entities/media.entity';
import { IMediaProps } from '../../domain/media.types';

describe('Media Commands', () => {
  let repo: jest.Mocked<IMediaRepository>;
  let storage: jest.Mocked<IStorageService>;
  let scanner: jest.Mocked<ISecurityScanner>;

  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const mediaId = '550e8400-e29b-41d4-a716-446655440001';

  const baseProps: IMediaProps = {
    id: mediaId,
    originalFilename: 'photo.jpg',
    mimeType: 'image/jpeg',
    publicId: 'avatars/abc123',
    url: 'https://res.cloudinary.com/demo/image/upload/avatars/abc123.jpg',
    format: 'jpg',
    bytes: 1024 * 100,
    width: 800,
    height: 600,
    altText: null,
    caption: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    createdById: userId,
    updatedById: userId,
    deletedAt: null,
    deletedById: null,
  };

  const loadMedia = (overrides: Partial<IMediaProps> = {}) => Media.load({ ...baseProps, ...overrides });

  const mockFile = Buffer.from('fake-file-data');

  beforeEach(() => {
    repo = {
      add: jest.fn().mockResolvedValue(mediaId),
      update: jest.fn(),
      remove: jest.fn(),
      hardDelete: jest.fn(),
      findById: jest.fn(),
      findByPublicId: jest.fn(),
      findByMimeTypePrefix: jest.fn(),
      findOrphans: jest.fn(),
      findExpiredSoftDeleted: jest.fn(),
      findDeleted: jest.fn(),
      findAll: jest.fn(),
    };

    storage = {
      upload: jest.fn().mockResolvedValue({
        externalId: 'avatars/abc123',
        url: 'https://res.cloudinary.com/demo/image/upload/avatars/abc123.jpg',
        format: 'jpg',
        bytes: 1024 * 100,
        width: 800,
        height: 600,
      }),
      uploadBulk: jest.fn(),
      delete: jest.fn(),
      generateUrl: jest.fn(),
    };

    scanner = {
      validate: jest.fn().mockResolvedValue({
        safe: true,
        detectedMimeType: 'image/jpeg',
        threats: [],
        sanitizedBuffer: mockFile,
      }),
      sanitizeFilename: jest.fn().mockReturnValue('photo.jpg'),
    };
  });

  // --- Upload ---

  describe('UploadMediaHandler', () => {
    let handler: UploadMediaHandler;
    beforeEach(() => (handler = new UploadMediaHandler(repo, storage, scanner)));

    it('should upload a file through the full pipeline', async () => {
      const result = await handler.execute(
        new UploadMediaCommand(mockFile, 'photo.jpg', 'image/jpeg', { folder: 'avatars' }, userId)
      );

      expect(result).toBe(mediaId);
      expect(scanner.validate).toHaveBeenCalledWith(mockFile, 'image/jpeg');
      expect(storage.upload).toHaveBeenCalledWith(mockFile, { folder: 'avatars', resourceType: 'image' });
      expect(repo.add).toHaveBeenCalled();
    });

    it('should validate DTO and reject invalid folder', async () => {
      await expect(
        handler.execute(new UploadMediaCommand(mockFile, 'photo.jpg', 'image/jpeg', { folder: 'invalid' }, userId))
      ).rejects.toMatchObject({ errorCode: 'MEDIA_INVALID_INPUT' });
    });

    it('should reject file exceeding size limit', async () => {
      const largeFile = Buffer.alloc(6 * 1024 * 1024); // 6MB, limit is 5MB for jpeg

      await expect(
        handler.execute(new UploadMediaCommand(largeFile, 'big.jpg', 'image/jpeg', { folder: 'general' }, userId))
      ).rejects.toMatchObject({ errorCode: 'MEDIA_FILE_TOO_LARGE' });
    });

    it('should reject unsupported MIME type', async () => {
      await expect(
        handler.execute(
          new UploadMediaCommand(mockFile, 'script.exe', 'application/x-msdownload', { folder: 'general' }, userId)
        )
      ).rejects.toMatchObject({ errorCode: 'MEDIA_UNSUPPORTED_TYPE' });
    });

    it('should reject file flagged as security threat', async () => {
      scanner.validate.mockResolvedValue({
        safe: false,
        detectedMimeType: 'image/jpeg',
        threats: ['malware-detected'],
        sanitizedBuffer: mockFile,
      });

      await expect(
        handler.execute(new UploadMediaCommand(mockFile, 'virus.jpg', 'image/jpeg', { folder: 'general' }, userId))
      ).rejects.toMatchObject({ errorCode: 'MEDIA_SECURITY_THREAT' });
    });

    it('should wrap storage upload failure', async () => {
      storage.upload.mockRejectedValue(new Error('Cloudinary down'));

      await expect(
        handler.execute(new UploadMediaCommand(mockFile, 'photo.jpg', 'image/jpeg', { folder: 'general' }, userId))
      ).rejects.toMatchObject({ errorCode: 'MEDIA_UPLOAD_FAILED' });
    });
  });

  // --- Bulk Upload ---

  describe('BulkUploadMediaHandler', () => {
    let handler: BulkUploadMediaHandler;
    beforeEach(() => (handler = new BulkUploadMediaHandler(repo, storage, scanner)));

    it('should upload multiple files and return results', async () => {
      const files = [
        { buffer: mockFile, originalFilename: 'a.jpg', mimeType: 'image/jpeg' },
        { buffer: mockFile, originalFilename: 'b.png', mimeType: 'image/png' },
      ];

      scanner.sanitizeFilename.mockImplementation((name) => name);

      storage.uploadBulk.mockResolvedValue({
        succeeded: [
          {
            externalId: 'general/a',
            url: 'https://cdn.example.com/a.jpg',
            format: 'jpg',
            bytes: 100,
            width: 100,
            height: 100,
            originalFilename: 'a.jpg',
          },
          {
            externalId: 'general/b',
            url: 'https://cdn.example.com/b.png',
            format: 'png',
            bytes: 200,
            width: 200,
            height: 200,
            originalFilename: 'b.png',
          },
        ],
        failed: [],
      });

      const result = await handler.execute(new BulkUploadMediaCommand(files, { folder: 'general' }, userId));

      expect(result.succeeded).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
      expect(repo.add).toHaveBeenCalledTimes(2);
    });

    it('should reject files exceeding size limit in bulk', async () => {
      const files = [
        { buffer: Buffer.alloc(6 * 1024 * 1024), originalFilename: 'big.jpg', mimeType: 'image/jpeg' },
        { buffer: mockFile, originalFilename: 'ok.jpg', mimeType: 'image/jpeg' },
      ];

      scanner.sanitizeFilename.mockImplementation((name) => name);

      storage.uploadBulk.mockResolvedValue({
        succeeded: [
          {
            externalId: 'general/ok',
            url: 'https://cdn.example.com/ok.jpg',
            format: 'jpg',
            bytes: 100,
            width: 100,
            height: 100,
            originalFilename: 'ok.jpg',
          },
        ],
        failed: [],
      });

      const result = await handler.execute(new BulkUploadMediaCommand(files, { folder: 'general' }, userId));

      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].filename).toBe('big.jpg');
    });

    it('should throw when storage bulk upload fails', async () => {
      const files = [{ buffer: mockFile, originalFilename: 'a.jpg', mimeType: 'image/jpeg' }];

      scanner.sanitizeFilename.mockReturnValue('a.jpg');

      storage.uploadBulk.mockRejectedValue(new Error('Storage unavailable'));

      await expect(
        handler.execute(new BulkUploadMediaCommand(files, { folder: 'general' }, userId))
      ).rejects.toMatchObject({ errorCode: 'MEDIA_UPLOAD_FAILED' });
    });

    it('should reject unsafe files in bulk', async () => {
      const files = [{ buffer: mockFile, originalFilename: 'virus.jpg', mimeType: 'image/jpeg' }];

      scanner.sanitizeFilename.mockReturnValue('virus.jpg');
      scanner.validate.mockResolvedValue({
        safe: false,
        detectedMimeType: 'image/jpeg',
        threats: ['malware'],
        sanitizedBuffer: mockFile,
      });

      storage.uploadBulk.mockResolvedValue({ succeeded: [], failed: [] });

      const result = await handler.execute(new BulkUploadMediaCommand(files, { folder: 'general' }, userId));

      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].filename).toBe('virus.jpg');
    });
  });

  // --- Update Metadata ---

  describe('UpdateMediaMetadataHandler', () => {
    let handler: UpdateMediaMetadataHandler;
    beforeEach(() => (handler = new UpdateMediaMetadataHandler(repo)));

    it('should update metadata', async () => {
      repo.findById.mockResolvedValue(loadMedia());

      await handler.execute(new UpdateMediaMetadataCommand(mediaId, { altText: 'New alt' }, userId));

      expect(repo.update).toHaveBeenCalledWith(
        mediaId,
        expect.objectContaining({ props: expect.objectContaining({ altText: 'New alt' }) })
      );
    });

    it('should reject when media not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(
        handler.execute(new UpdateMediaMetadataCommand(mediaId, { altText: 'test' }, userId))
      ).rejects.toMatchObject({ errorCode: 'MEDIA_NOT_FOUND' });
    });

    it('should reject invalid DTO', async () => {
      await expect(handler.execute(new UpdateMediaMetadataCommand(mediaId, {}, userId))).rejects.toMatchObject({
        errorCode: 'MEDIA_INVALID_INPUT',
      });
    });
  });

  // --- Soft Delete ---

  describe('SoftDeleteMediaHandler', () => {
    let handler: SoftDeleteMediaHandler;
    beforeEach(() => (handler = new SoftDeleteMediaHandler(repo)));

    it('should soft delete media', async () => {
      repo.findById.mockResolvedValue(loadMedia());

      await handler.execute(new SoftDeleteMediaCommand(mediaId, userId));

      expect(repo.remove).toHaveBeenCalledWith(
        mediaId,
        expect.objectContaining({ props: expect.objectContaining({ deletedAt: expect.any(Date) }) })
      );
    });

    it('should reject when media not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(handler.execute(new SoftDeleteMediaCommand(mediaId, userId))).rejects.toMatchObject({
        errorCode: 'MEDIA_NOT_FOUND',
      });
    });

    it('should reject when already deleted', async () => {
      repo.findById.mockResolvedValue(loadMedia({ deletedAt: new Date(), deletedById: userId }));

      await expect(handler.execute(new SoftDeleteMediaCommand(mediaId, userId))).rejects.toMatchObject({
        errorCode: 'MEDIA_ALREADY_DELETED',
      });
    });
  });

  // --- Restore ---

  describe('RestoreMediaHandler', () => {
    let handler: RestoreMediaHandler;
    beforeEach(() => (handler = new RestoreMediaHandler(repo)));

    it('should restore deleted media', async () => {
      repo.findById.mockResolvedValue(loadMedia({ deletedAt: new Date(), deletedById: userId }));

      await handler.execute(new RestoreMediaCommand(mediaId, userId));

      expect(repo.update).toHaveBeenCalledWith(
        mediaId,
        expect.objectContaining({ props: expect.objectContaining({ deletedAt: null }) })
      );
    });

    it('should reject when media not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(handler.execute(new RestoreMediaCommand(mediaId, userId))).rejects.toMatchObject({
        errorCode: 'MEDIA_NOT_FOUND',
      });
    });

    it('should reject when media is not deleted', async () => {
      repo.findById.mockResolvedValue(loadMedia());

      await expect(handler.execute(new RestoreMediaCommand(mediaId, userId))).rejects.toMatchObject({
        errorCode: 'MEDIA_NOT_DELETED',
      });
    });
  });

  // --- Hard Delete ---

  describe('HardDeleteMediaHandler', () => {
    let handler: HardDeleteMediaHandler;
    beforeEach(() => (handler = new HardDeleteMediaHandler(repo, storage)));

    it('should delete from storage and database', async () => {
      repo.findById.mockResolvedValue(loadMedia());

      await handler.execute(new HardDeleteMediaCommand(mediaId, userId));

      expect(storage.delete).toHaveBeenCalledWith('avatars/abc123');
      expect(repo.hardDelete).toHaveBeenCalledWith(mediaId);
    });

    it('should reject when media not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(handler.execute(new HardDeleteMediaCommand(mediaId, userId))).rejects.toMatchObject({
        errorCode: 'MEDIA_NOT_FOUND',
      });
    });

    it('should still hard delete from DB if storage delete fails', async () => {
      repo.findById.mockResolvedValue(loadMedia({ deletedAt: new Date(), deletedById: userId }));
      storage.delete.mockRejectedValue(new Error('Cloudinary error'));

      await handler.execute(new HardDeleteMediaCommand(mediaId, userId));

      expect(repo.hardDelete).toHaveBeenCalledWith(mediaId);
    });
  });
});
