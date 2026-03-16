import { Tag as PrismaTag } from '@prisma/client';
import { TagMapper } from './tag.mapper';
import { Tag } from '../../domain/entities/tag.entity';

describe('TagMapper', () => {
  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const now = new Date('2026-01-01');

  const prismaTag: PrismaTag = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'TypeScript',
    slug: 'typescript',
    createdAt: now,
    updatedAt: now,
    createdById: userId,
    updatedById: userId,
    deletedAt: null,
    deletedById: null,
  };

  describe('toDomain()', () => {
    it('should map Prisma record to domain entity', () => {
      const tag = TagMapper.toDomain(prismaTag);

      expect(tag).toBeInstanceOf(Tag);
      expect(tag.id).toBe(prismaTag.id);
      expect(tag.name).toBe('TypeScript');
      expect(tag.slug).toBe('typescript');
      expect(tag.createdById).toBe(userId);
      expect(tag.deletedAt).toBeNull();
    });
  });

  describe('toPrisma()', () => {
    it('should map domain entity to Prisma data', () => {
      const tag = Tag.create({ name: 'NestJS' }, userId);
      const data = TagMapper.toPrisma(tag);

      expect(data.id).toBe(tag.id);
      expect(data.name).toBe('NestJS');
      expect(data.slug).toBe('nestjs');
      expect(data.createdById).toBe(userId);
      expect(data.updatedById).toBe(userId);
      expect(data.deletedAt).toBeNull();
    });
  });
});
