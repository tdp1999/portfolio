import { Tag } from './tag.entity';
import { ITagProps } from '../tag.types';

describe('Tag Entity', () => {
  const userId = '550e8400-e29b-41d4-a716-446655440000';

  const validProps: ITagProps = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'TypeScript',
    slug: 'typescript',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    createdById: userId,
    updatedById: userId,
    deletedAt: null,
    deletedById: null,
  };

  describe('create()', () => {
    it('should generate slug from name', () => {
      const tag = Tag.create({ name: 'C++ Programming' }, userId);

      expect(tag.id).toBeDefined();
      expect(tag.slug).toBe('c-programming');
      expect(tag.isDeleted).toBe(false);
    });
  });

  describe('update()', () => {
    it('should regenerate slug when name changes', () => {
      const tag = Tag.load(validProps);

      const updated = tag.update({ name: 'JavaScript' }, userId);

      expect(updated.slug).toBe('javascript');
      expect(updated.updatedAt.getTime()).toBeGreaterThan(tag.updatedAt.getTime());
    });
  });

  describe('softDelete() / restore()', () => {
    it('should soft delete and preserve immutability', () => {
      const tag = Tag.load(validProps);

      const deleted = tag.softDelete(userId);

      expect(deleted.isDeleted).toBe(true);
      expect(tag.isDeleted).toBe(false);
    });

    it('should restore a deleted tag', () => {
      const tag = Tag.load({ ...validProps, deletedAt: new Date(), deletedById: userId });

      expect(tag.restore(userId).isDeleted).toBe(false);
    });
  });
});
