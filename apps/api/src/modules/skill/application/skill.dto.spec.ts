import { CreateSkillSchema, UpdateSkillSchema, SkillQuerySchema, ReorderSkillsSchema } from './skill.dto';

describe('Skill DTOs', () => {
  describe('CreateSkillSchema', () => {
    it('should accept required fields with correct defaults', () => {
      const result = CreateSkillSchema.safeParse({ name: 'TypeScript', category: 'TECHNICAL' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('TypeScript');
        expect(result.data.category).toBe('TECHNICAL');
        expect(result.data.isLibrary).toBe(false);
        expect(result.data.isFeatured).toBe(false);
        expect(result.data.displayOrder).toBe(0);
      }
    });

    it('should strip HTML and trim name', () => {
      const result = CreateSkillSchema.safeParse({ name: ' <b>React</b> ', category: 'TECHNICAL' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.name).toBe('React');
    });

    it('should reject when required fields are missing', () => {
      expect(CreateSkillSchema.safeParse({ name: 'React' }).success).toBe(false);
      expect(CreateSkillSchema.safeParse({ category: 'TECHNICAL' }).success).toBe(false);
    });
  });

  describe('UpdateSkillSchema', () => {
    it('should accept partial update', () => {
      const result = UpdateSkillSchema.safeParse({ name: 'New Name' });
      expect(result.success).toBe(true);
    });

    it('should accept null for nullable fields', () => {
      const result = UpdateSkillSchema.safeParse({ description: null, parentSkillId: null });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBeNull();
        expect(result.data.parentSkillId).toBeNull();
      }
    });

    it('should reject empty object', () => {
      expect(UpdateSkillSchema.safeParse({}).success).toBe(false);
    });
  });

  describe('SkillQuerySchema', () => {
    it('should apply pagination defaults and accept filters', () => {
      const result = SkillQuerySchema.safeParse({ category: 'TECHNICAL', search: 'react' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
        expect(result.data.category).toBe('TECHNICAL');
        expect(result.data.search).toBe('react');
      }
    });
  });

  describe('ReorderSkillsSchema', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';

    it('should accept a non-empty array of {id, displayOrder, tier}', () => {
      const result = ReorderSkillsSchema.safeParse([
        { id, displayOrder: 0, tier: 'FREQUENT' },
        { id: '550e8400-e29b-41d4-a716-446655440001', displayOrder: 1, tier: 'DAILY' },
      ]);
      expect(result.success).toBe(true);
    });

    it('should reject an empty array', () => {
      expect(ReorderSkillsSchema.safeParse([]).success).toBe(false);
    });

    it('should reject a non-uuid id', () => {
      expect(ReorderSkillsSchema.safeParse([{ id: 'not-a-uuid', displayOrder: 0, tier: 'FREQUENT' }]).success).toBe(
        false
      );
    });

    it('should reject a negative displayOrder', () => {
      expect(ReorderSkillsSchema.safeParse([{ id, displayOrder: -1, tier: 'FREQUENT' }]).success).toBe(false);
    });

    it('should reject a missing tier', () => {
      expect(ReorderSkillsSchema.safeParse([{ id, displayOrder: 0 }]).success).toBe(false);
    });
  });
});
