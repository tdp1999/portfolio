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
    it('should create a category with generated id, slug, and timestamps', () => {
      const category = Category.create({ name: 'Tutorial' }, userId);

      expect(category.id).toBeDefined();
      expect(category.name).toBe('Tutorial');
      expect(category.slug).toBe('tutorial');
      expect(category.description).toBeNull();
      expect(category.displayOrder).toBe(0);
      expect(category.createdAt).toBeInstanceOf(Date);
      expect(category.updatedAt).toBeInstanceOf(Date);
      expect(category.createdById).toBe(userId);
      expect(category.updatedById).toBe(userId);
      expect(category.deletedAt).toBeNull();
      expect(category.deletedById).toBeNull();
      expect(category.isDeleted).toBe(false);
    });

    it('should create with optional description and displayOrder', () => {
      const category = Category.create({ name: 'Guide', description: 'Detailed guides', displayOrder: 5 }, userId);

      expect(category.name).toBe('Guide');
      expect(category.description).toBe('Detailed guides');
      expect(category.displayOrder).toBe(5);
    });

    it('should generate slug from name with special characters', () => {
      const category = Category.create({ name: 'C++ Programming' }, userId);

      expect(category.slug).toBe('c-programming');
    });

    it('should throw when name is empty', () => {
      expect(() => Category.create({ name: '' }, userId)).toThrow('Cannot create slug from empty text');
    });
  });

  describe('load()', () => {
    it('should load a category from existing props', () => {
      const category = Category.load(validProps);

      expect(category.id).toBe(validProps.id);
      expect(category.name).toBe('Tutorial');
      expect(category.slug).toBe('tutorial');
      expect(category.description).toBe('Step-by-step guides');
      expect(category.displayOrder).toBe(1);
      expect(category.createdById).toBe(userId);
    });
  });

  describe('update()', () => {
    it('should update name and regenerate slug', () => {
      const category = Category.load(validProps);
      const updaterId = '550e8400-e29b-41d4-a716-446655440002';

      const updated = category.update({ name: 'How-To' }, updaterId);

      expect(updated.name).toBe('How-To');
      expect(updated.slug).toBe('how-to');
      expect(updated.updatedById).toBe(updaterId);
      expect(updated.updatedAt.getTime()).toBeGreaterThan(category.updatedAt.getTime());
      // Unchanged fields preserved
      expect(updated.description).toBe('Step-by-step guides');
      expect(updated.displayOrder).toBe(1);
      // Original unchanged
      expect(category.name).toBe('Tutorial');
    });

    it('should update description only', () => {
      const category = Category.load(validProps);

      const updated = category.update({ description: 'New description' }, userId);

      expect(updated.name).toBe('Tutorial');
      expect(updated.slug).toBe('tutorial');
      expect(updated.description).toBe('New description');
    });

    it('should clear description when set to null', () => {
      const category = Category.load(validProps);

      const updated = category.update({ description: null }, userId);

      expect(updated.description).toBeNull();
    });

    it('should update displayOrder only', () => {
      const category = Category.load(validProps);

      const updated = category.update({ displayOrder: 10 }, userId);

      expect(updated.displayOrder).toBe(10);
      expect(updated.name).toBe('Tutorial');
    });

    it('should preserve id and createdAt on update', () => {
      const category = Category.load(validProps);
      const updated = category.update({ name: 'New Name' }, userId);

      expect(updated.id).toBe(category.id);
      expect(updated.createdAt).toBe(category.createdAt);
      expect(updated.createdById).toBe(category.createdById);
    });
  });

  describe('softDelete()', () => {
    it('should set deletedAt and deletedById', () => {
      const category = Category.load(validProps);
      const deleterId = '550e8400-e29b-41d4-a716-446655440002';

      const deleted = category.softDelete(deleterId);

      expect(deleted.isDeleted).toBe(true);
      expect(deleted.deletedAt).toBeInstanceOf(Date);
      expect(deleted.deletedById).toBe(deleterId);
      // Original unchanged
      expect(category.isDeleted).toBe(false);
    });
  });

  describe('restore()', () => {
    it('should clear deletedAt and deletedById', () => {
      const deletedProps: ICategoryProps = {
        ...validProps,
        deletedAt: new Date(),
        deletedById: userId,
      };
      const category = Category.load(deletedProps);

      const restored = category.restore(userId);

      expect(restored.isDeleted).toBe(false);
      expect(restored.deletedAt).toBeNull();
      expect(restored.deletedById).toBeNull();
    });
  });

  describe('toProps()', () => {
    it('should return a copy of props', () => {
      const category = Category.load(validProps);
      const props = category.toProps();

      expect(props).toEqual(validProps);
      expect(props).not.toBe(category.props);
    });
  });
});
