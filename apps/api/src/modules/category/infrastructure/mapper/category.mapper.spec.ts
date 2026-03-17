import { Category as PrismaCategory } from '@prisma/client';
import { CategoryMapper } from './category.mapper';
import { Category } from '../../domain/entities/category.entity';

describe('CategoryMapper', () => {
  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const now = new Date('2026-01-01');

  const prismaCategory: PrismaCategory = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Tutorial',
    slug: 'tutorial',
    description: 'Step-by-step guides',
    displayOrder: 1,
    createdAt: now,
    updatedAt: now,
    createdById: userId,
    updatedById: userId,
    deletedAt: null,
    deletedById: null,
  };

  describe('toDomain()', () => {
    it('should map Prisma record to domain entity', () => {
      const category = CategoryMapper.toDomain(prismaCategory);

      expect(category).toBeInstanceOf(Category);
      expect(category.id).toBe(prismaCategory.id);
      expect(category.name).toBe('Tutorial');
      expect(category.slug).toBe('tutorial');
      expect(category.description).toBe('Step-by-step guides');
      expect(category.displayOrder).toBe(1);
      expect(category.createdById).toBe(userId);
      expect(category.deletedAt).toBeNull();
    });

    it('should handle null description', () => {
      const withNullDesc: PrismaCategory = { ...prismaCategory, description: null };
      const category = CategoryMapper.toDomain(withNullDesc);

      expect(category.description).toBeNull();
    });
  });

  describe('toPrisma()', () => {
    it('should map domain entity to Prisma data', () => {
      const category = Category.create({ name: 'Guide', description: 'Detailed guides', displayOrder: 3 }, userId);
      const data = CategoryMapper.toPrisma(category);

      expect(data.id).toBe(category.id);
      expect(data.name).toBe('Guide');
      expect(data.slug).toBe('guide');
      expect(data.description).toBe('Detailed guides');
      expect(data.displayOrder).toBe(3);
      expect(data.createdById).toBe(userId);
      expect(data.updatedById).toBe(userId);
      expect(data.deletedAt).toBeNull();
    });

    it('should map entity with null description', () => {
      const category = Category.create({ name: 'Tips' }, userId);
      const data = CategoryMapper.toPrisma(category);

      expect(data.description).toBeNull();
      expect(data.displayOrder).toBe(0);
    });
  });
});
