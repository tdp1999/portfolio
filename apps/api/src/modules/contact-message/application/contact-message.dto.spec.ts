import { ContactMessageQuerySchema, SubmitContactMessageSchema } from './contact-message.dto';

describe('SubmitContactMessageSchema', () => {
  const validInput = {
    name: 'John Doe',
    email: 'john@example.com',
    purpose: 'JOB_OPPORTUNITY',
    subject: 'Hello',
    message: 'This is a valid message with enough characters.',
    locale: 'en',
    consentGivenAt: '2026-03-29T10:00:00Z',
  };

  it('should parse valid input', () => {
    const result = SubmitContactMessageSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('John Doe');
      expect(result.data.email).toBe('john@example.com');
      expect(result.data.purpose).toBe('JOB_OPPORTUNITY');
    }
  });

  it('should apply defaults for purpose and locale', () => {
    const result = SubmitContactMessageSchema.safeParse({
      name: 'Test',
      email: 'test@example.com',
      message: 'A message that is long enough to pass validation.',
      consentGivenAt: '2026-03-29T10:00:00Z',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.purpose).toBe('GENERAL');
      expect(result.data.locale).toBe('en');
    }
  });

  it('should fail when name is missing', () => {
    const result = SubmitContactMessageSchema.safeParse({ ...validInput, name: undefined });
    expect(result.success).toBe(false);
  });

  it('should fail when email is missing', () => {
    const result = SubmitContactMessageSchema.safeParse({ ...validInput, email: undefined });
    expect(result.success).toBe(false);
  });

  it('should fail when message is missing', () => {
    const result = SubmitContactMessageSchema.safeParse({ ...validInput, message: undefined });
    expect(result.success).toBe(false);
  });

  it('should fail when message is too short', () => {
    const result = SubmitContactMessageSchema.safeParse({ ...validInput, message: 'short' });
    expect(result.success).toBe(false);
  });

  it('should fail when message exceeds 5000 characters', () => {
    const result = SubmitContactMessageSchema.safeParse({ ...validInput, message: 'x'.repeat(5001) });
    expect(result.success).toBe(false);
  });

  it('should fail when consentGivenAt is missing', () => {
    const result = SubmitContactMessageSchema.safeParse({ ...validInput, consentGivenAt: undefined });
    expect(result.success).toBe(false);
  });

  it('should strip HTML tags from name', () => {
    const result = SubmitContactMessageSchema.safeParse({
      ...validInput,
      name: '<b>Bold</b> Name',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Bold Name');
    }
  });

  it('should strip HTML tags from subject', () => {
    const result = SubmitContactMessageSchema.safeParse({
      ...validInput,
      subject: '<script>alert("xss")</script>Hello',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.subject).toBe('alert("xss")Hello');
    }
  });

  it('should trim whitespace from name and message', () => {
    const result = SubmitContactMessageSchema.safeParse({
      ...validInput,
      name: '  John Doe  ',
      message: '  A valid message with enough content here.  ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('John Doe');
      expect(result.data.message).toBe('A valid message with enough content here.');
    }
  });

  it('should accept honeypot website field', () => {
    const result = SubmitContactMessageSchema.safeParse({
      ...validInput,
      website: 'http://spam.com',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.website).toBe('http://spam.com');
    }
  });

  it('should pass when honeypot website is empty', () => {
    const result = SubmitContactMessageSchema.safeParse({
      ...validInput,
      website: '',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.website).toBe('');
    }
  });
});

describe('ContactMessageQuerySchema', () => {
  it('should apply defaults', () => {
    const result = ContactMessageQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
      expect(result.data.includeDeleted).toBe(false);
      expect(result.data.includeSpam).toBe(false);
      expect(result.data.sortBy).toBe('createdAt');
      expect(result.data.sortOrder).toBe('desc');
    }
  });

  it('should accept valid filters', () => {
    const result = ContactMessageQuerySchema.safeParse({
      page: 2,
      limit: 50,
      status: 'UNREAD',
      purpose: 'JOB_OPPORTUNITY',
      search: 'test',
      includeDeleted: true,
      includeSpam: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(50);
      expect(result.data.status).toBe('UNREAD');
      expect(result.data.purpose).toBe('JOB_OPPORTUNITY');
      expect(result.data.search).toBe('test');
      expect(result.data.includeDeleted).toBe(true);
    }
  });

  it('should accept array of statuses', () => {
    const result = ContactMessageQuerySchema.safeParse({
      status: ['UNREAD', 'READ'],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toEqual(['UNREAD', 'READ']);
    }
  });

  it('should fail when page is less than 1', () => {
    const result = ContactMessageQuerySchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });

  it('should fail when limit exceeds 100', () => {
    const result = ContactMessageQuerySchema.safeParse({ limit: 101 });
    expect(result.success).toBe(false);
  });
});
