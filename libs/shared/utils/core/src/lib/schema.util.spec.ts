import { z } from 'zod/v4';
import { nonEmptyPartial, ERR_EMPTY_PAYLOAD } from './schema.util';

const TestSchema = z.object({
  name: z.string(),
  age: z.number(),
});

describe('nonEmptyPartial', () => {
  const PartialSchema = nonEmptyPartial(TestSchema);

  it('should accept a partial object with one field', () => {
    expect(PartialSchema.safeParse({ name: 'John' }).success).toBe(true);
  });

  it('should accept a partial object with all fields', () => {
    expect(PartialSchema.safeParse({ name: 'John', age: 30 }).success).toBe(true);
  });

  it('should reject an empty object', () => {
    const result = PartialSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(ERR_EMPTY_PAYLOAD);
    }
  });

  it('should still validate field types', () => {
    expect(PartialSchema.safeParse({ name: 123 }).success).toBe(false);
  });
});
