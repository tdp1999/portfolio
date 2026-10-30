import { formatZodError } from '@portfolio/shared/errors';
import { CreateHealthProfileSchema, RenameHealthProfileSchema } from './health-profile.dto';

// Expected values come from 'P10 Trim' and the BVA table of the medicine cabinet epic (person name 1–50).

const SCHEMAS = { CreateHealthProfileSchema, RenameHealthProfileSchema };

describe.each(Object.entries(SCHEMAS))('%s', (_name, schema) => {
  const errorFields = (input: unknown): string[] => {
    const result = schema.safeParse(input);
    return result.success ? [] : Object.keys(formatZodError(result.error));
  };

  it('P10: rejects the name "   " at field "name"', () => {
    expect(errorFields({ name: '   ' })).toEqual(['name']);
  });

  it('P10: trims "Mẹ " to "Mẹ", so it matches the existing "Mẹ"', () => {
    expect(schema.safeParse({ name: 'Mẹ ' })).toEqual({ success: true, data: { name: 'Mẹ' } });
  });

  it.each([1, 50])('BVA: accepts a name of %i characters', (length) => {
    expect(schema.safeParse({ name: 'a'.repeat(length) }).success).toBe(true);
  });

  it.each([0, 51])('BVA: rejects a name of %i characters at field "name"', (length) => {
    expect(errorFields({ name: 'a'.repeat(length) })).toEqual(['name']);
  });
});
