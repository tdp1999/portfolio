import { DomainError } from '@portfolio/shared/errors';
import { Skill } from './skill.entity';
import { ISkillProps } from '../skill.types';

describe('Skill Entity', () => {
  const userId = '550e8400-e29b-41d4-a716-446655440000';

  const validProps: ISkillProps = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'TypeScript',
    slug: 'typescript',
    description: 'Typed JavaScript',
    category: 'TECHNICAL',
    isLibrary: false,
    parentSkillId: null,
    yearsOfExperience: 5,
    iconId: '550e8400-e29b-41d4-a716-446655440099',
    iconUrl: 'https://cdn.example.com/ts.svg',
    proficiencyNote: 'Advanced',
    isFeatured: true,
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
      const skill = Skill.create({ name: 'C++ Programming', category: 'TECHNICAL' }, userId);

      expect(skill.id).toBeDefined();
      expect(skill.slug).toBe('c-programming');
      expect(skill.isLibrary).toBe(false);
      expect(skill.isFeatured).toBe(false);
      expect(skill.displayOrder).toBe(0);
      expect(skill.parentSkillId).toBeNull();
      expect(skill.isDeleted).toBe(false);
    });
  });

  describe('update()', () => {
    it('should regenerate slug when name changes', () => {
      const skill = Skill.load(validProps);

      const updated = skill.update({ name: 'JavaScript' }, userId);

      expect(updated.slug).toBe('javascript');
      expect(updated.updatedAt.getTime()).toBeGreaterThan(skill.updatedAt.getTime());
    });

    it('should clear nullable fields when set to null', () => {
      const skill = Skill.load(validProps);

      const updated = skill.update(
        { description: null, yearsOfExperience: null, iconId: null, proficiencyNote: null },
        userId
      );

      expect(updated.description).toBeNull();
      expect(updated.yearsOfExperience).toBeNull();
      expect(updated.iconId).toBeNull();
      expect(updated.proficiencyNote).toBeNull();
    });
  });

  describe('assignParent()', () => {
    it('should assign a parent skill', () => {
      const skill = Skill.load(validProps);
      const parentId = '550e8400-e29b-41d4-a716-446655440099';

      const updated = skill.assignParent(parentId, false);

      expect(updated.parentSkillId).toBe(parentId);
    });

    it('should reject self as parent (SKILL_CIRCULAR_REFERENCE)', () => {
      const skill = Skill.load(validProps);

      try {
        skill.assignParent(skill.id, false);
        fail('Expected error');
      } catch (e) {
        expect(e).toBeInstanceOf(DomainError);
        expect((e as DomainError).errorCode).toBe('SKILL_CIRCULAR_REFERENCE');
      }
    });

    it('should reject parent that already has a parent (SKILL_MAX_DEPTH_EXCEEDED)', () => {
      const skill = Skill.load(validProps);

      try {
        skill.assignParent('550e8400-e29b-41d4-a716-446655440099', true);
        fail('Expected error');
      } catch (e) {
        expect(e).toBeInstanceOf(DomainError);
        expect((e as DomainError).errorCode).toBe('SKILL_MAX_DEPTH_EXCEEDED');
      }
    });
  });

  describe('removeParent()', () => {
    it('should clear parentSkillId', () => {
      const skill = Skill.load({ ...validProps, parentSkillId: '550e8400-e29b-41d4-a716-446655440099' });

      expect(skill.removeParent().parentSkillId).toBeNull();
    });
  });

  describe('softDelete() / restore()', () => {
    it('should soft delete and preserve immutability', () => {
      const skill = Skill.load(validProps);

      const deleted = skill.softDelete(userId);

      expect(deleted.isDeleted).toBe(true);
      expect(deleted.deletedById).toBe(userId);
      expect(skill.isDeleted).toBe(false);
    });

    it('should restore a deleted skill', () => {
      const skill = Skill.load({ ...validProps, deletedAt: new Date(), deletedById: userId });

      const restored = skill.restore(userId);

      expect(restored.isDeleted).toBe(false);
      expect(restored.deletedAt).toBeNull();
    });
  });
});
