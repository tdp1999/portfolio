import { ListMediaQuery, ListMediaHandler } from './list-media.query';
import { GetMediaByIdQuery, GetMediaByIdHandler } from './get-media-by-id.query';
import { GetStorageStatsQuery, GetStorageStatsHandler } from './get-storage-stats.query';
import { ListDeletedMediaQuery, ListDeletedMediaHandler } from './list-deleted-media.query';
import { IMediaRepository } from '../ports/media.repository.port';
import { Media } from '../../domain/entities/media.entity';
import { IMediaProps } from '../../domain/media.types';

describe('Media Queries', () => {
  let repo: jest.Mocked<IMediaRepository>;

  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const mediaId = '550e8400-e29b-41d4-a716-446655440001';

  const baseProps: IMediaProps = {
    id: mediaId,
    originalFilename: 'photo.jpg',
    mimeType: 'image/jpeg',
    publicId: 'media/photo',
    url: 'https://cdn.example.com/photo.jpg',
    format: 'jpg',
    bytes: 102400,
    width: 800,
    height: 600,
    altText: 'A photo',
    caption: null,
    folder: 'general',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    createdById: userId,
    updatedById: userId,
    deletedAt: null,
    deletedById: null,
  };

  const loadMedia = (overrides: Partial<IMediaProps> = {}) => Media.load({ ...baseProps, ...overrides });

  beforeEach(() => {
    repo = {
      add: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      hardDelete: jest.fn(),
      findById: jest.fn(),
      findByIdIncludeDeleted: jest.fn(),
      findByPublicId: jest.fn(),
      findByMimeTypePrefix: jest.fn(),
      findOrphans: jest.fn(),
      findExpiredSoftDeleted: jest.fn(),
      findDeleted: jest.fn(),
      findAll: jest.fn(),
      getStorageStats: jest.fn(),
    };
  });

  describe('ListMediaHandler', () => {
    let handler: ListMediaHandler;
    beforeEach(() => (handler = new ListMediaHandler(repo)));

    it('should return paginated media with default params', async () => {
      repo.findAll.mockResolvedValue({ data: [loadMedia()], total: 1 });

      const result = await handler.execute(new ListMediaQuery({}));

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should pass mimeTypePrefix filter to repo', async () => {
      repo.findAll.mockResolvedValue({ data: [], total: 0 });

      await handler.execute(new ListMediaQuery({ mimeTypePrefix: 'image' }));

      expect(repo.findAll).toHaveBeenCalledWith(expect.objectContaining({ mimeTypePrefix: ['image/'] }));
    });

    it('should pass search filter to repo', async () => {
      repo.findAll.mockResolvedValue({ data: [], total: 0 });

      await handler.execute(new ListMediaQuery({ search: 'photo' }));

      expect(repo.findAll).toHaveBeenCalledWith(expect.objectContaining({ search: 'photo' }));
    });

    it('should pass folder filter to repo', async () => {
      repo.findAll.mockResolvedValue({ data: [], total: 0 });

      await handler.execute(new ListMediaQuery({ folder: 'avatars' }));

      expect(repo.findAll).toHaveBeenCalledWith(expect.objectContaining({ folder: 'avatars' }));
    });

    it('should pass sort option to repo', async () => {
      repo.findAll.mockResolvedValue({ data: [], total: 0 });

      await handler.execute(new ListMediaQuery({ sort: 'filename_asc' }));

      expect(repo.findAll).toHaveBeenCalledWith(expect.objectContaining({ sort: 'filename_asc' }));
    });

    it('should compose all filters into a single repo call', async () => {
      repo.findAll.mockResolvedValue({ data: [], total: 0 });

      await handler.execute(
        new ListMediaQuery({
          search: 'hero',
          mimeTypePrefix: 'image',
          folder: 'posts',
          sort: 'bytes_desc',
        })
      );

      expect(repo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'hero',
          mimeTypePrefix: ['image'],
          folder: 'posts',
          sort: 'bytes_desc',
        })
      );
    });

    it('should pass includeDeleted flag to repo', async () => {
      repo.findAll.mockResolvedValue({ data: [], total: 0 });

      await handler.execute(new ListMediaQuery({ includeDeleted: true }));

      expect(repo.findAll).toHaveBeenCalledWith(expect.objectContaining({ includeDeleted: true }));
    });

    it('should throw on invalid pagination params', async () => {
      await expect(handler.execute(new ListMediaQuery({ page: -1 }))).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw on invalid folder value', async () => {
      await expect(handler.execute(new ListMediaQuery({ folder: 'not-a-folder' }))).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it('should throw on invalid sort value', async () => {
      await expect(handler.execute(new ListMediaQuery({ sort: 'weird_sort' }))).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it('should translate mimeGroup=image to exact image MIME types', async () => {
      repo.findAll.mockResolvedValue({ data: [], total: 0 });

      await handler.execute(new ListMediaQuery({ mimeGroup: 'image' }));

      expect(repo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          mimeTypes: expect.arrayContaining(['image/jpeg', 'image/png', 'image/webp']),
          mimeTypePrefix: undefined,
        })
      );
    });

    it('should translate mimeGroup=doc to all doc MIME types', async () => {
      repo.findAll.mockResolvedValue({ data: [], total: 0 });

      await handler.execute(new ListMediaQuery({ mimeGroup: 'doc' }));

      expect(repo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          mimeTypes: expect.arrayContaining([
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain',
            'text/csv',
          ]),
          mimeTypePrefix: undefined,
        })
      );
    });

    it('should translate mimeGroup=archive to all archive MIME types', async () => {
      repo.findAll.mockResolvedValue({ data: [], total: 0 });

      await handler.execute(new ListMediaQuery({ mimeGroup: 'archive' }));

      expect(repo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          mimeTypes: expect.arrayContaining([
            'application/zip',
            'application/x-rar-compressed',
            'application/x-7z-compressed',
            'application/x-tar',
            'application/gzip',
          ]),
          mimeTypePrefix: undefined,
        })
      );
    });

    it('should translate mimeGroup=pdf to application/pdf only', async () => {
      repo.findAll.mockResolvedValue({ data: [], total: 0 });

      await handler.execute(new ListMediaQuery({ mimeGroup: 'pdf' }));

      expect(repo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          mimeTypes: ['application/pdf'],
          mimeTypePrefix: undefined,
        })
      );
    });

    it('should translate mimeGroup=video to exact video MIME types', async () => {
      repo.findAll.mockResolvedValue({ data: [], total: 0 });

      await handler.execute(new ListMediaQuery({ mimeGroup: 'video' }));

      expect(repo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          mimeTypes: expect.arrayContaining(['video/mp4', 'video/webm']),
          mimeTypePrefix: undefined,
        })
      );
    });

    it('should ignore mimeTypePrefix when mimeGroup is present (mimeGroup wins)', async () => {
      repo.findAll.mockResolvedValue({ data: [], total: 0 });

      await handler.execute(new ListMediaQuery({ mimeGroup: 'image', mimeTypePrefix: 'video/' }));

      expect(repo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          mimeTypes: expect.arrayContaining(['image/jpeg']),
          mimeTypePrefix: undefined,
        })
      );
    });

    it('should throw on invalid mimeGroup value', async () => {
      await expect(handler.execute(new ListMediaQuery({ mimeGroup: 'spreadsheet' }))).rejects.toMatchObject({
        statusCode: 400,
      });
    });
  });

  describe('GetMediaByIdHandler', () => {
    let handler: GetMediaByIdHandler;
    beforeEach(() => (handler = new GetMediaByIdHandler(repo)));

    it('should return media response', async () => {
      repo.findById.mockResolvedValue(loadMedia());

      const result = await handler.execute(new GetMediaByIdQuery(mediaId));

      expect(result.id).toBe(mediaId);
      expect(result.originalFilename).toBe('photo.jpg');
    });

    it('should throw NotFound when media does not exist', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(handler.execute(new GetMediaByIdQuery(mediaId))).rejects.toMatchObject({ statusCode: 404 });
    });

    it('should throw on invalid UUID', async () => {
      await expect(handler.execute(new GetMediaByIdQuery('not-a-uuid'))).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('GetStorageStatsHandler', () => {
    let handler: GetStorageStatsHandler;
    beforeEach(() => (handler = new GetStorageStatsHandler(repo)));

    it('should return storage statistics excluding deleted by default', async () => {
      repo.getStorageStats.mockResolvedValue({
        totalFiles: 10,
        totalBytes: 1048576,
        breakdown: [
          { mimeTypePrefix: 'image', count: 8, bytes: 819200 },
          { mimeTypePrefix: 'application', count: 2, bytes: 229376 },
        ],
      });

      const result = await handler.execute(new GetStorageStatsQuery());

      expect(result.totalFiles).toBe(10);
      expect(result.breakdown).toHaveLength(2);
      expect(repo.getStorageStats).toHaveBeenCalledWith({ includeDeleted: false });
    });

    it('should pass includeDeleted flag to repo', async () => {
      repo.getStorageStats.mockResolvedValue({ totalFiles: 0, totalBytes: 0, breakdown: [] });

      await handler.execute(new GetStorageStatsQuery(true));

      expect(repo.getStorageStats).toHaveBeenCalledWith({ includeDeleted: true });
    });
  });

  describe('ListDeletedMediaHandler', () => {
    let handler: ListDeletedMediaHandler;
    beforeEach(() => (handler = new ListDeletedMediaHandler(repo)));

    it('should return paginated deleted media', async () => {
      const deletedMedia = loadMedia({ deletedAt: new Date(), deletedById: userId });
      repo.findDeleted.mockResolvedValue({ data: [deletedMedia], total: 1 });

      const result = await handler.execute(new ListDeletedMediaQuery({}));

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('should pass pagination params to repo', async () => {
      repo.findDeleted.mockResolvedValue({ data: [], total: 0 });

      await handler.execute(new ListDeletedMediaQuery({ page: 2, limit: 10 }));

      expect(repo.findDeleted).toHaveBeenCalledWith(expect.objectContaining({ page: 2, limit: 10 }));
    });

    it('should throw on invalid params', async () => {
      await expect(handler.execute(new ListDeletedMediaQuery({ limit: 999 }))).rejects.toMatchObject({
        statusCode: 400,
      });
    });
  });
});
