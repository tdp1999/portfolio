import { CreateCategorySchema, UpdateCategorySchema, CategoryQuerySchema } from './category.dto';

describe('Category DTOs', () => {
  describe('CreateCategorySchema', () => {
    it('should accept valid name only', () => {
      const result = CreateCategorySchema.safeParse({ name: 'Tutorial' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Tutorial');
        expect(result.data.displayOrder).toBe(0);
        expect(result.data.description).toBeUndefined();
      }
    });

    it('should accept all fields', () => {
      const result = CreateCategorySchema.safeParse({
        name: 'Guide',
        description: 'Detailed guides',
        displayOrder: 5,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Guide');
        expect(result.data.description).toBe('Detailed guides');
        expect(result.data.displayOrder).toBe(5);
      }
    });

    it('should trim whitespace', () => {
      const result = CreateCategorySchema.safeParse({ name: '  Tutorial  ' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.name).toBe('Tutorial');
    });

    it('should strip HTML tags', () => {
      const result = CreateCategorySchema.safeParse({ name: '<b>Tutorial</b>' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.name).toBe('Tutorial');
    });

    it('should strip HTML from description', () => {
      const result = CreateCategorySchema.safeParse({ name: 'Test', description: '<script>alert(1)</script>Desc' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.description).toBe('alert(1)Desc');
    });

    it('should reject empty name', () => {
      const result = CreateCategorySchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });

    it('should reject name over 100 chars', () => {
      const result = CreateCategorySchema.safeParse({ name: 'a'.repeat(101) });
      expect(result.success).toBe(false);
    });

    it('should reject description over 500 chars', () => {
      const result = CreateCategorySchema.safeParse({ name: 'Test', description: 'a'.repeat(501) });
      expect(result.success).toBe(false);
    });

    it('should default displayOrder to 0', () => {
      const result = CreateCategorySchema.safeParse({ name: 'Test' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.displayOrder).toBe(0);
    });
  });

  describe('UpdateCategorySchema', () => {
    it('should accept partial update with name only', () => {
      const result = UpdateCategorySchema.safeParse({ name: 'New Name' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.name).toBe('New Name');
    });

    it('should accept partial update with description only', () => {
      const result = UpdateCategorySchema.safeParse({ description: 'New desc' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.description).toBe('New desc');
    });

    it('should accept null description to clear it', () => {
      const result = UpdateCategorySchema.safeParse({ description: null });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.description).toBeNull();
    });

    it('should accept partial update with displayOrder only', () => {
      const result = UpdateCategorySchema.safeParse({ displayOrder: 10 });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.displayOrder).toBe(10);
    });

    it('should reject empty object', () => {
      const result = UpdateCategorySchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject empty description string', () => {
      const result = UpdateCategorySchema.safeParse({ description: '' });
      expect(result.success).toBe(false);
    });

    it('should reject empty name', () => {
      const result = UpdateCategorySchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('CategoryQuerySchema', () => {
    it('should apply defaults', () => {
      const result = CategoryQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it('should coerce string numbers', () => {
      const result = CategoryQuerySchema.safeParse({ page: '2', limit: '10' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(10);
      }
    });

    it('should reject limit over 100', () => {
      const result = CategoryQuerySchema.safeParse({ limit: 101 });
      expect(result.success).toBe(false);
    });

    it('should accept search param', () => {
      const result = CategoryQuerySchema.safeParse({ search: 'tutorial' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.search).toBe('tutorial');
    });
  });
});
