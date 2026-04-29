import { ZodError } from 'zod';
import { customFlatten, formatZodError } from './zod-formatter';

describe('customFlatten', () => {
  it('should flatten single-level paths', () => {
    const error = new ZodError([
      {
        code: 'invalid_type',
        expected: 'string',
        received: 'number',
        path: ['name'],
        message: 'Expected string',
      },
    ]);
    const result = customFlatten(error);

    expect(result.fieldErrors).toEqual({ name: ['Expected string'] });
  });

  it('should flatten nested paths with dot notation', () => {
    const error = new ZodError([
      {
        code: 'invalid_type',
        expected: 'string',
        received: 'number',
        path: ['address', 'city'],
        message: 'Required',
      },
    ]);
    const result = customFlatten(error);

    expect(result.fieldErrors).toEqual({ 'address.city': ['Required'] });
  });

  it('should group multiple errors for same path', () => {
    const error = new ZodError([
      {
        code: 'too_small',
        minimum: 1,
        type: 'string',
        inclusive: true,
        path: ['name'],
        message: 'Too short',
      },
      {
        code: 'invalid_type',
        expected: 'string',
        received: 'number',
        path: ['name'],
        message: 'Expected string',
      },
    ]);
    const result = customFlatten(error);

    expect(result.fieldErrors['name']).toEqual(['Too short', 'Expected string']);
  });
});

describe('formatZodError', () => {
  it('should return field errors as flat object', () => {
    const error = new ZodError([
      {
        code: 'invalid_type',
        expected: 'string',
        received: 'number',
        path: ['email'],
        message: 'Invalid email',
      },
    ]);
    const result = formatZodError(error);

    expect(result).toEqual({ email: ['Invalid email'] });
  });
});
