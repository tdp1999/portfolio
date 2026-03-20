import { Media as PrismaMedia } from '@prisma/client';
import { MediaMapper } from './media.mapper';
import { Media } from '../../domain/entities/media.entity';

describe('MediaMapper', () => {
  const userId = '550e8400-e29b-41d4-a716-446655440000';

  const prismaMedia: PrismaMedia = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    originalFilename: 'screenshot.png',
    mimeType: 'image/png',
    publicId: 'portfolio/projects/abc123',
    url: 'https://res.cloudinary.com/demo/image/upload/portfolio/projects/abc123.png',
    format: 'png',
    bytes: 204800,
    width: 1920,
    height: 1080,
    altText: 'Project screenshot',
    caption: 'Main dashboard',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    createdById: userId,
    updatedById: userId,
    deletedAt: null,
    deletedById: null,
  };

  describe('toDomain()', () => {
    it('should map Prisma record to domain entity', () => {
      const entity = MediaMapper.toDomain(prismaMedia);

      expect(entity).toBeInstanceOf(Media);
      expect(entity.id).toBe(prismaMedia.id);
      expect(entity.originalFilename).toBe('screenshot.png');
      expect(entity.mimeType).toBe('image/png');
      expect(entity.publicId).toBe(prismaMedia.publicId);
      expect(entity.url).toBe(prismaMedia.url);
      expect(entity.format).toBe('png');
      expect(entity.bytes).toBe(204800);
      expect(entity.width).toBe(1920);
      expect(entity.height).toBe(1080);
      expect(entity.altText).toBe('Project screenshot');
      expect(entity.caption).toBe('Main dashboard');
      expect(entity.isDeleted).toBe(false);
    });

    it('should handle nullable fields', () => {
      const noImage: PrismaMedia = {
        ...prismaMedia,
        width: null,
        height: null,
        altText: null,
        caption: null,
      };

      const entity = MediaMapper.toDomain(noImage);

      expect(entity.width).toBeNull();
      expect(entity.height).toBeNull();
      expect(entity.altText).toBeNull();
      expect(entity.caption).toBeNull();
    });

    it('should handle soft-deleted record', () => {
      const deleted: PrismaMedia = {
        ...prismaMedia,
        deletedAt: new Date('2026-02-01'),
        deletedById: userId,
      };

      const entity = MediaMapper.toDomain(deleted);

      expect(entity.isDeleted).toBe(true);
      expect(entity.deletedById).toBe(userId);
    });
  });

  describe('toPrisma()', () => {
    it('should map domain entity to Prisma data', () => {
      const entity = Media.create(
        {
          originalFilename: 'photo.jpg',
          mimeType: 'image/jpeg',
          publicId: 'portfolio/avatars/xyz',
          url: 'https://res.cloudinary.com/demo/image/upload/portfolio/avatars/xyz.jpg',
          format: 'jpg',
          bytes: 102400,
          width: 800,
          height: 600,
        },
        userId
      );

      const data = MediaMapper.toPrisma(entity);

      expect(data.id).toBe(entity.id);
      expect(data.originalFilename).toBe('photo.jpg');
      expect(data.mimeType).toBe('image/jpeg');
      expect(data.publicId).toBe('portfolio/avatars/xyz');
      expect(data.bytes).toBe(102400);
      expect(data.width).toBe(800);
      expect(data.deletedAt).toBeNull();
    });

    it('should not include createdAt/updatedAt (managed by Prisma)', () => {
      const entity = MediaMapper.toDomain(prismaMedia);
      const data = MediaMapper.toPrisma(entity);

      expect(data).not.toHaveProperty('createdAt');
      expect(data).not.toHaveProperty('updatedAt');
    });
  });
});
