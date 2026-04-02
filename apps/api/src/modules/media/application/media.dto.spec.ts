import { CreateMediaSchema, UpdateMediaMetadataSchema, ListMediaSchema, BulkDeleteSchema } from './media.dto';

describe('Media DTOs', () => {
  describe('CreateMediaSchema', () => {
    it('should accept valid input with defaults', () => {
      const result = CreateMediaSchema.safeParse({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.folder).toBe('general');
      }
    });

    it('should accept all optional fields', () => {
      const result = CreateMediaSchema.safeParse({
        altText: 'My image',
        caption: 'A great photo',
        folder: 'avatars',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.altText).toBe('My image');
        expect(result.data.folder).toBe('avatars');
      }
    });

    it('should strip HTML from altText', () => {
      const result = CreateMediaSchema.safeParse({
        altText: '<script>alert("xss")</script>Photo',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.altText).not.toContain('<script>');
      }
    });

    it('should reject invalid folder', () => {
      const result = CreateMediaSchema.safeParse({ folder: 'invalid' });

      expect(result.success).toBe(false);
    });
  });

  describe('UpdateMediaMetadataSchema', () => {
    it('should accept partial update with altText', () => {
      const result = UpdateMediaMetadataSchema.safeParse({ altText: 'New alt' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.altText).toBe('New alt');
      }
    });

    it('should accept nullable fields', () => {
      const result = UpdateMediaMetadataSchema.safeParse({ altText: null, caption: null });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.altText).toBeNull();
        expect(result.data.caption).toBeNull();
      }
    });

    it('should reject empty object', () => {
      const result = UpdateMediaMetadataSchema.safeParse({});

      expect(result.success).toBe(false);
    });

    it('should strip HTML from caption', () => {
      const result = UpdateMediaMetadataSchema.safeParse({
        caption: '<b>Bold</b> text',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.caption).not.toContain('<b>');
      }
    });
  });

  describe('ListMediaSchema', () => {
    it('should apply pagination defaults', () => {
      const result = ListMediaSchema.safeParse({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it('should accept mimeTypePrefix filter', () => {
      const result = ListMediaSchema.safeParse({ mimeTypePrefix: 'image/' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.mimeTypePrefix).toBe('image/');
      }
    });

    it('should accept search and pagination', () => {
      const result = ListMediaSchema.safeParse({ search: 'photo', page: 2, limit: 10 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.search).toBe('photo');
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(10);
      }
    });
  });

  describe('BulkDeleteSchema', () => {
    it('should accept array of UUIDs', () => {
      const result = BulkDeleteSchema.safeParse({
        ids: ['550e8400-e29b-41d4-a716-446655440000'],
      });

      expect(result.success).toBe(true);
    });

    it('should reject empty array', () => {
      const result = BulkDeleteSchema.safeParse({ ids: [] });

      expect(result.success).toBe(false);
    });

    it('should reject invalid UUIDs', () => {
      const result = BulkDeleteSchema.safeParse({ ids: ['not-a-uuid'] });

      expect(result.success).toBe(false);
    });

    it('should reject more than 50 IDs', () => {
      const ids = Array.from(
        { length: 51 },
        (_, i) => `550e8400-e29b-41d4-a716-4466554400${String(i).padStart(2, '0')}`
      );
      const result = BulkDeleteSchema.safeParse({ ids });

      expect(result.success).toBe(false);
    });
  });
});
