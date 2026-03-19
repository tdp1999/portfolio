import { CreateTagSchema, UpdateTagSchema, TagQuerySchema } from './tag.dto';

describe('Tag DTOs', () => {
  describe('CreateTagSchema', () => {
    it('should accept name and strip HTML', () => {
      const result = CreateTagSchema.safeParse({ name: ' <b>React</b> ' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.name).toBe('React');
    });

    it('should reject empty name', () => {
      expect(CreateTagSchema.safeParse({ name: '' }).success).toBe(false);
    });
  });

  describe('UpdateTagSchema', () => {
    it('should accept partial update', () => {
      expect(UpdateTagSchema.safeParse({ name: 'NestJS' }).success).toBe(true);
    });
  });

  describe('TagQuerySchema', () => {
    it('should apply pagination defaults', () => {
      const result = TagQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });
  });
});
