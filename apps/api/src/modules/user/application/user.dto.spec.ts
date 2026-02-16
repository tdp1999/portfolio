import { CreateUserSchema, UpdateUserSchema, LoginSchema } from './user.dto';

describe('CreateUserSchema', () => {
  it('should accept valid data', () => {
    const result = CreateUserSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
      name: 'John',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = CreateUserSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
      name: 'John',
    });
    expect(result.success).toBe(false);
  });

  it('should reject short password', () => {
    const result = CreateUserSchema.safeParse({
      email: 'test@example.com',
      password: 'short',
      name: 'John',
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty name', () => {
    const result = CreateUserSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
      name: '',
    });
    expect(result.success).toBe(false);
  });

  it('should reject name exceeding 100 characters', () => {
    const result = CreateUserSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
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

  it('should accept empty object', () => {
    const result = UpdateUserSchema.safeParse({});
    expect(result.success).toBe(true);
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

describe('LoginSchema', () => {
  it('should accept valid credentials', () => {
    const result = LoginSchema.safeParse({
      email: 'test@example.com',
      password: 'any',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = LoginSchema.safeParse({
      email: 'bad',
      password: 'any',
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty password', () => {
    const result = LoginSchema.safeParse({
      email: 'test@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
  });
});
