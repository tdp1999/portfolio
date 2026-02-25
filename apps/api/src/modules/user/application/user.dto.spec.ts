import { CreateUserSchema, UpdateUserSchema } from './user.dto';

const VALID_PASSWORD = 'Strong#Pass1';

describe('CreateUserSchema', () => {
  it('should accept valid data', () => {
    const result = CreateUserSchema.safeParse({
      email: 'test@example.com',
      password: VALID_PASSWORD,
      name: 'John',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = CreateUserSchema.safeParse({
      email: 'not-an-email',
      password: VALID_PASSWORD,
      name: 'John',
    });
    expect(result.success).toBe(false);
  });

  it('should reject short password', () => {
    const result = CreateUserSchema.safeParse({
      email: 'test@example.com',
      password: 'Ab1#',
      name: 'John',
    });
    expect(result.success).toBe(false);
  });

  it('should reject password without uppercase', () => {
    const result = CreateUserSchema.safeParse({
      email: 'test@example.com',
      password: 'lowercase#1',
      name: 'John',
    });
    expect(result.success).toBe(false);
  });

  it('should reject password without lowercase', () => {
    const result = CreateUserSchema.safeParse({
      email: 'test@example.com',
      password: 'UPPERCASE#1',
      name: 'John',
    });
    expect(result.success).toBe(false);
  });

  it('should reject password without number', () => {
    const result = CreateUserSchema.safeParse({
      email: 'test@example.com',
      password: 'NoNumber#here',
      name: 'John',
    });
    expect(result.success).toBe(false);
  });

  it('should reject password without special character', () => {
    const result = CreateUserSchema.safeParse({
      email: 'test@example.com',
      password: 'NoSpecial1',
      name: 'John',
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty name', () => {
    const result = CreateUserSchema.safeParse({
      email: 'test@example.com',
      password: VALID_PASSWORD,
      name: '',
    });
    expect(result.success).toBe(false);
  });

  it('should reject name exceeding 100 characters', () => {
    const result = CreateUserSchema.safeParse({
      email: 'test@example.com',
      password: VALID_PASSWORD,
      name: 'a'.repeat(101),
    });
    expect(result.success).toBe(false);
  });
});

describe('UpdateUserSchema', () => {
  it('should accept partial update with name only', () => {
    const result = UpdateUserSchema.safeParse({ name: 'Jane' });
    expect(result.success).toBe(true);
  });

  it('should accept partial update with email only', () => {
    const result = UpdateUserSchema.safeParse({ email: 'new@example.com' });
    expect(result.success).toBe(true);
  });

  it('should reject empty object', () => {
    const result = UpdateUserSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should reject invalid email', () => {
    const result = UpdateUserSchema.safeParse({ email: 'bad' });
    expect(result.success).toBe(false);
  });

  it('should reject empty name string', () => {
    const result = UpdateUserSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });
});
