import { Category } from './category.entity';
import { ICategoryProps } from '../category.types';

describe('Category Entity', () => {
  const userId = '550e8400-e29b-41d4-a716-446655440000';

  const validProps: ICategoryProps = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Tutorial',
    slug: 'tutorial',
    description: 'Step-by-step guides',
    displayOrder: 1,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    createdById: userId,
    updatedById: userId,
    deletedAt: null,
    deletedById: null,
  };

  describe('create()', () => {
    it('should generate slug from name and apply defaults', () => {
      const category = Category.create({ name: 'C++ Programming' }, userId);

      expect(category.id).toBeDefined();
      expect(category.slug).toBe('c-programming');
      expect(category.description).toBeNull();
      expect(category.displayOrder).toBe(0);
      expect(category.isDeleted).toBe(false);
    });
  });

  describe('update()', () => {
    it('should regenerate slug when name changes', () => {
      const category = Category.load(validProps);

      const updated = category.update({ name: 'How-To' }, userId);

      expect(updated.slug).toBe('how-to');
      expect(updated.updatedAt.getTime()).toBeGreaterThan(category.updatedAt.getTime());
    });

    it('should clear description when set to null', () => {
      const category = Category.load(validProps);

      expect(category.update({ description: null }, userId).description).toBeNull();
    });
  });

  describe('softDelete() / restore()', () => {
    it('should soft delete and preserve immutability', () => {
      const category = Category.load(validProps);

      const deleted = category.softDelete(userId);

      expect(deleted.isDeleted).toBe(true);
      expect(deleted.deletedById).toBe(userId);
      expect(category.isDeleted).toBe(false);
    });

    it('should restore a deleted category', () => {
      const category = Category.load({ ...validProps, deletedAt: new Date(), deletedById: userId });

      const restored = category.restore(userId);

      expect(restored.isDeleted).toBe(false);
      expect(restored.deletedAt).toBeNull();
    });
  });
});
