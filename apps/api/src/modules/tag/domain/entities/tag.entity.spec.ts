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
    it('should create a tag with generated id, slug, and timestamps', () => {
      const tag = Tag.create({ name: 'TypeScript' }, userId);

      expect(tag.id).toBeDefined();
      expect(tag.name).toBe('TypeScript');
      expect(tag.slug).toBe('typescript');
      expect(tag.createdAt).toBeInstanceOf(Date);
      expect(tag.updatedAt).toBeInstanceOf(Date);
      expect(tag.createdById).toBe(userId);
      expect(tag.updatedById).toBe(userId);
      expect(tag.deletedAt).toBeNull();
      expect(tag.deletedById).toBeNull();
      expect(tag.isDeleted).toBe(false);
    });

    it('should generate slug from name with special characters', () => {
      const tag = Tag.create({ name: 'C++ Programming' }, userId);

      expect(tag.slug).toBe('c-programming');
    });

    it('should throw when name is empty', () => {
      expect(() => Tag.create({ name: '' }, userId)).toThrow('Cannot create slug from empty text');
    });
  });

  describe('load()', () => {
    it('should load a tag from existing props', () => {
      const tag = Tag.load(validProps);

      expect(tag.id).toBe(validProps.id);
      expect(tag.name).toBe('TypeScript');
      expect(tag.slug).toBe('typescript');
      expect(tag.createdById).toBe(userId);
    });
  });

  describe('update()', () => {
    it('should return new tag with updated name and regenerated slug', () => {
      const tag = Tag.load(validProps);
      const updaterId = '550e8400-e29b-41d4-a716-446655440002';

      const updated = tag.update({ name: 'JavaScript' }, updaterId);

      expect(updated.name).toBe('JavaScript');
      expect(updated.slug).toBe('javascript');
      expect(updated.updatedById).toBe(updaterId);
      expect(updated.updatedAt.getTime()).toBeGreaterThan(tag.updatedAt.getTime());
      // Original unchanged
      expect(tag.name).toBe('TypeScript');
    });

    it('should preserve id and createdAt on update', () => {
      const tag = Tag.load(validProps);
      const updated = tag.update({ name: 'New Name' }, userId);

      expect(updated.id).toBe(tag.id);
      expect(updated.createdAt).toBe(tag.createdAt);
      expect(updated.createdById).toBe(tag.createdById);
    });
  });

  describe('softDelete()', () => {
    it('should set deletedAt and deletedById', () => {
      const tag = Tag.load(validProps);
      const deleterId = '550e8400-e29b-41d4-a716-446655440002';

      const deleted = tag.softDelete(deleterId);

      expect(deleted.isDeleted).toBe(true);
      expect(deleted.deletedAt).toBeInstanceOf(Date);
      expect(deleted.deletedById).toBe(deleterId);
      // Original unchanged
      expect(tag.isDeleted).toBe(false);
    });
  });

  describe('restore()', () => {
    it('should clear deletedAt and deletedById', () => {
      const deletedProps: ITagProps = {
        ...validProps,
        deletedAt: new Date(),
        deletedById: userId,
      };
      const tag = Tag.load(deletedProps);

      const restored = tag.restore(userId);

      expect(restored.isDeleted).toBe(false);
      expect(restored.deletedAt).toBeNull();
      expect(restored.deletedById).toBeNull();
    });
  });

  describe('toProps()', () => {
    it('should return a copy of props', () => {
      const tag = Tag.load(validProps);
      const props = tag.toProps();

      expect(props).toEqual(validProps);
      expect(props).not.toBe(tag.props);
    });
  });
});
