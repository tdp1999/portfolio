import {
  LoginSchema,
  ChangePasswordSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  GoogleCallbackSchema,
} from './auth.dto';

const VALID_PASSWORD = 'Strong#Pass1';

describe('LoginSchema', () => {
  it('should accept valid credentials', () => {
    const result = LoginSchema.safeParse({ email: 'test@example.com', password: 'any' });
    expect(result.success).toBe(true);
  });

  it('should default rememberMe to false', () => {
    const result = LoginSchema.safeParse({ email: 'test@example.com', password: 'any' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.rememberMe).toBe(false);
  });

  it('should accept rememberMe true', () => {
    const result = LoginSchema.safeParse({
      email: 'test@example.com',
      password: 'any',
      rememberMe: true,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.rememberMe).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = LoginSchema.safeParse({ email: 'not-email', password: 'any' });
    expect(result.success).toBe(false);
  });

  it('should reject empty password', () => {
    const result = LoginSchema.safeParse({ email: 'test@example.com', password: '' });
    expect(result.success).toBe(false);
  });

  it('should reject missing fields', () => {
    expect(LoginSchema.safeParse({}).success).toBe(false);
    expect(LoginSchema.safeParse({ email: 'test@example.com' }).success).toBe(false);
  });
});

describe('ChangePasswordSchema', () => {
  it('should accept valid data', () => {
    const result = ChangePasswordSchema.safeParse({
      currentPassword: 'old-password',
      newPassword: VALID_PASSWORD,
    });
    expect(result.success).toBe(true);
  });

  it('should reject weak new password', () => {
    const result = ChangePasswordSchema.safeParse({
      currentPassword: 'old-password',
      newPassword: 'weak',
    });
    expect(result.success).toBe(false);
  });

  it('should reject missing currentPassword', () => {
    const result = ChangePasswordSchema.safeParse({ newPassword: VALID_PASSWORD });
    expect(result.success).toBe(false);
  });
});

describe('ForgotPasswordSchema', () => {
  it('should accept valid email', () => {
    const result = ForgotPasswordSchema.safeParse({ email: 'test@example.com' });
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = ForgotPasswordSchema.safeParse({ email: 'bad' });
    expect(result.success).toBe(false);
  });

  it('should reject missing email', () => {
    const result = ForgotPasswordSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('ResetPasswordSchema', () => {
  it('should accept valid data', () => {
    const result = ResetPasswordSchema.safeParse({
      token: 'reset-token',
      userId: 'user-123',
      newPassword: VALID_PASSWORD,
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty token', () => {
    const result = ResetPasswordSchema.safeParse({
      token: '',
      userId: 'user-123',
      newPassword: VALID_PASSWORD,
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty userId', () => {
    const result = ResetPasswordSchema.safeParse({
      token: 'reset-token',
      userId: '',
      newPassword: VALID_PASSWORD,
    });
    expect(result.success).toBe(false);
  });

  it('should reject weak password', () => {
    const result = ResetPasswordSchema.safeParse({
      token: 'reset-token',
      userId: 'user-123',
      newPassword: 'weak',
    });
    expect(result.success).toBe(false);
  });
});

describe('GoogleCallbackSchema', () => {
  it('should accept valid Google profile', () => {
    const result = GoogleCallbackSchema.safeParse({
      email: 'user@gmail.com',
      name: 'John Doe',
      googleId: '123456789',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = GoogleCallbackSchema.safeParse({
      email: 'not-email',
      name: 'John',
      googleId: '123',
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty name', () => {
    const result = GoogleCallbackSchema.safeParse({
      email: 'user@gmail.com',
      name: '',
      googleId: '123',
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty googleId', () => {
    const result = GoogleCallbackSchema.safeParse({
      email: 'user@gmail.com',
      name: 'John',
      googleId: '',
    });
    expect(result.success).toBe(false);
  });

  it('should reject missing fields', () => {
    expect(GoogleCallbackSchema.safeParse({}).success).toBe(false);
    expect(GoogleCallbackSchema.safeParse({ email: 'user@gmail.com' }).success).toBe(false);
  });
});
