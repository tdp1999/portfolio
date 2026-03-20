import { DomainError } from '@portfolio/shared/errors';
import { Media } from './media.entity';
import { IMediaProps } from '../media.types';

describe('Media Entity', () => {
  const userId = '550e8400-e29b-41d4-a716-446655440000';

  const validProps: IMediaProps = {
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
    caption: 'Main dashboard view',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    createdById: userId,
    updatedById: userId,
    deletedAt: null,
    deletedById: null,
  };

  describe('create()', () => {
    it('should create a media entity with all fields', () => {
      const media = Media.create(
        {
          originalFilename: 'photo.jpg',
          mimeType: 'image/jpeg',
          publicId: 'portfolio/avatars/xyz',
          url: 'https://res.cloudinary.com/demo/image/upload/portfolio/avatars/xyz.jpg',
          format: 'jpg',
          bytes: 102400,
          width: 800,
          height: 600,
          altText: 'Profile photo',
          caption: 'My avatar',
        },
        userId
      );

      expect(media.id).toBeDefined();
      expect(media.originalFilename).toBe('photo.jpg');
      expect(media.mimeType).toBe('image/jpeg');
      expect(media.publicId).toBe('portfolio/avatars/xyz');
      expect(media.format).toBe('jpg');
      expect(media.bytes).toBe(102400);
      expect(media.width).toBe(800);
      expect(media.height).toBe(600);
      expect(media.altText).toBe('Profile photo');
      expect(media.caption).toBe('My avatar');
      expect(media.isDeleted).toBe(false);
    });

    it('should default nullable fields to null', () => {
      const media = Media.create(
        {
          originalFilename: 'doc.pdf',
          mimeType: 'application/pdf',
          publicId: 'portfolio/docs/abc',
          url: 'https://res.cloudinary.com/demo/raw/upload/portfolio/docs/abc.pdf',
          format: 'pdf',
          bytes: 51200,
        },
        userId
      );

      expect(media.width).toBeNull();
      expect(media.height).toBeNull();
      expect(media.altText).toBeNull();
      expect(media.caption).toBeNull();
    });
  });

  describe('load()', () => {
    it('should reconstitute from persistence', () => {
      const media = Media.load(validProps);

      expect(media.id).toBe(validProps.id);
      expect(media.originalFilename).toBe('screenshot.png');
      expect(media.publicId).toBe(validProps.publicId);
      expect(media.createdAt).toEqual(validProps.createdAt);
    });
  });

  describe('updateMetadata()', () => {
    it('should update altText and caption', () => {
      const media = Media.load(validProps);

      const updated = media.updateMetadata({ altText: 'New alt', caption: 'New caption' }, userId);

      expect(updated.altText).toBe('New alt');
      expect(updated.caption).toBe('New caption');
      expect(updated.updatedAt.getTime()).toBeGreaterThan(media.updatedAt.getTime());
    });

    it('should clear nullable fields when set to null', () => {
      const media = Media.load(validProps);

      const updated = media.updateMetadata({ altText: null, caption: null }, userId);

      expect(updated.altText).toBeNull();
      expect(updated.caption).toBeNull();
    });

    it('should preserve fields not included in update', () => {
      const media = Media.load(validProps);

      const updated = media.updateMetadata({ altText: 'Only alt' }, userId);

      expect(updated.altText).toBe('Only alt');
      expect(updated.caption).toBe(validProps.caption);
    });

    it('should not change immutable file data', () => {
      const media = Media.load(validProps);

      const updated = media.updateMetadata({ altText: 'Changed' }, userId);

      expect(updated.originalFilename).toBe(media.originalFilename);
      expect(updated.mimeType).toBe(media.mimeType);
      expect(updated.publicId).toBe(media.publicId);
      expect(updated.url).toBe(media.url);
      expect(updated.bytes).toBe(media.bytes);
    });
  });

  describe('softDelete()', () => {
    it('should soft delete and preserve immutability', () => {
      const media = Media.load(validProps);

      const deleted = media.softDelete(userId);

      expect(deleted.isDeleted).toBe(true);
      expect(deleted.deletedById).toBe(userId);
      expect(media.isDeleted).toBe(false);
    });

    it('should throw MEDIA_ALREADY_DELETED if already deleted', () => {
      const media = Media.load({ ...validProps, deletedAt: new Date(), deletedById: userId });

      try {
        media.softDelete(userId);
        fail('Expected error');
      } catch (e) {
        expect(e).toBeInstanceOf(DomainError);
        expect((e as DomainError).errorCode).toBe('MEDIA_ALREADY_DELETED');
      }
    });
  });

  describe('restore()', () => {
    it('should restore a deleted media', () => {
      const media = Media.load({ ...validProps, deletedAt: new Date(), deletedById: userId });

      const restored = media.restore(userId);

      expect(restored.isDeleted).toBe(false);
      expect(restored.deletedAt).toBeNull();
      expect(restored.deletedById).toBeNull();
    });

    it('should throw MEDIA_NOT_DELETED if not deleted', () => {
      const media = Media.load(validProps);

      try {
        media.restore(userId);
        fail('Expected error');
      } catch (e) {
        expect(e).toBeInstanceOf(DomainError);
        expect((e as DomainError).errorCode).toBe('MEDIA_NOT_DELETED');
      }
    });
  });
});
