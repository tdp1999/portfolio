import { CreateCategorySchema, UpdateCategorySchema, CategoryQuerySchema } from './category.dto';

describe('Category DTOs', () => {
  describe('CreateCategorySchema', () => {
    it('should accept name with correct defaults', () => {
      const result = CreateCategorySchema.safeParse({ name: 'Tutorial' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Tutorial');
        expect(result.data.displayOrder).toBe(0);
        expect(result.data.description).toBeUndefined();
      }
    });

    it('should strip HTML and trim', () => {
      const result = CreateCategorySchema.safeParse({
        name: ' <b>Tutorial</b> ',
        description: '<script>x</script>Desc',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Tutorial');
        expect(result.data.description).toBe('xDesc');
      }
    });

    it('should reject empty name', () => {
      expect(CreateCategorySchema.safeParse({ name: '' }).success).toBe(false);
    });
  });

  describe('UpdateCategorySchema', () => {
    it('should accept partial update and null clearing', () => {
      expect(UpdateCategorySchema.safeParse({ name: 'New' }).success).toBe(true);
      const result = UpdateCategorySchema.safeParse({ description: null });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.description).toBeNull();
    });

    it('should reject empty object', () => {
      expect(UpdateCategorySchema.safeParse({}).success).toBe(false);
    });
  });

  describe('CategoryQuerySchema', () => {
    it('should apply pagination defaults', () => {
      const result = CategoryQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });
  });
});
