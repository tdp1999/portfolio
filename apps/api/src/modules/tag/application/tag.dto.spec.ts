import { CreateTagSchema, UpdateTagSchema, TagQuerySchema } from './tag.dto';

describe('Tag DTOs', () => {
  describe('CreateTagSchema', () => {
    it('should accept valid name', () => {
      const result = CreateTagSchema.safeParse({ name: 'TypeScript' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.name).toBe('TypeScript');
    });

    it('should trim whitespace', () => {
      const result = CreateTagSchema.safeParse({ name: '  Angular  ' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.name).toBe('Angular');
    });

    it('should strip HTML tags', () => {
      const result = CreateTagSchema.safeParse({ name: '<b>React</b>' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.name).toBe('React');
    });

    it('should reject empty name', () => {
      const result = CreateTagSchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });

    it('should reject name over 50 chars', () => {
      const result = CreateTagSchema.safeParse({ name: 'a'.repeat(51) });
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateTagSchema', () => {
    it('should accept valid name', () => {
      const result = UpdateTagSchema.safeParse({ name: 'NestJS' });
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const result = UpdateTagSchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('TagQuerySchema', () => {
    it('should apply defaults', () => {
      const result = TagQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it('should coerce string numbers', () => {
      const result = TagQuerySchema.safeParse({ page: '2', limit: '10' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(10);
      }
    });

    it('should reject limit over 100', () => {
      const result = TagQuerySchema.safeParse({ limit: 101 });
      expect(result.success).toBe(false);
    });

    it('should accept search param', () => {
      const result = TagQuerySchema.safeParse({ search: 'type' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.search).toBe('type');
    });
  });
});
