import {
  TranslatableSchema,
  OptionalTranslatableSchema,
  PartialTranslatableSchema,
  SocialLinkSchema,
  SocialLinksArraySchema,
  CertificationSchema,
  CertificationsArraySchema,
  ResumeUrlsSchema,
  OpenToSchema,
} from './translatable.schema';

describe('TranslatableSchema', () => {
  it('should accept valid both locales', () => {
    const result = TranslatableSchema.safeParse({ en: 'Hello', vi: 'Xin chao' });
    expect(result.success).toBe(true);
  });

  it('should reject when en is missing', () => {
    const result = TranslatableSchema.safeParse({ vi: 'Xin chao' });
    expect(result.success).toBe(false);
  });

  it('should reject when vi is missing', () => {
    const result = TranslatableSchema.safeParse({ en: 'Hello' });
    expect(result.success).toBe(false);
  });

  it('should reject empty strings', () => {
    const result = TranslatableSchema.safeParse({ en: '', vi: '' });
    expect(result.success).toBe(false);
  });

  it('should accept strings containing HTML (validation only, not sanitization)', () => {
    const result = TranslatableSchema.safeParse({
      en: '<b>Bold</b>',
      vi: '<i>Italic</i>',
    });
    expect(result.success).toBe(true);
  });
});

describe('OptionalTranslatableSchema', () => {
  it('should accept null', () => {
    const result = OptionalTranslatableSchema.safeParse(null);
    expect(result.success).toBe(true);
  });

  it('should accept both locales', () => {
    const result = OptionalTranslatableSchema.safeParse({ en: 'Hello', vi: 'Xin chao' });
    expect(result.success).toBe(true);
  });

  it('should accept only en', () => {
    const result = OptionalTranslatableSchema.safeParse({ en: 'Hello' });
    expect(result.success).toBe(true);
  });

  it('should reject empty object (no locales)', () => {
    const result = OptionalTranslatableSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('PartialTranslatableSchema', () => {
  it('should accept only en', () => {
    const result = PartialTranslatableSchema.safeParse({ en: 'Hello' });
    expect(result.success).toBe(true);
  });

  it('should accept only vi', () => {
    const result = PartialTranslatableSchema.safeParse({ vi: 'Xin chao' });
    expect(result.success).toBe(true);
  });

  it('should reject empty object', () => {
    const result = PartialTranslatableSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('SocialLinkSchema', () => {
  it('should accept a valid social link', () => {
    const result = SocialLinkSchema.safeParse({
      platform: 'GITHUB',
      url: 'https://github.com/user',
    });
    expect(result.success).toBe(true);
  });

  it('should accept a social link with handle', () => {
    const result = SocialLinkSchema.safeParse({
      platform: 'TWITTER',
      url: 'https://twitter.com/user',
      handle: '@user',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid URL', () => {
    const result = SocialLinkSchema.safeParse({
      platform: 'GITHUB',
      url: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid platform', () => {
    const result = SocialLinkSchema.safeParse({
      platform: 'FACEBOOK',
      url: 'https://facebook.com/user',
    });
    expect(result.success).toBe(false);
  });
});

describe('SocialLinksArraySchema', () => {
  it('should accept an empty array', () => {
    const result = SocialLinksArraySchema.safeParse([]);
    expect(result.success).toBe(true);
  });

  it('should reject more than 20 items', () => {
    const items = Array.from({ length: 21 }, (_, i) => ({
      platform: 'GITHUB',
      url: `https://github.com/user${i}`,
    }));
    const result = SocialLinksArraySchema.safeParse(items);
    expect(result.success).toBe(false);
  });
});

describe('CertificationSchema', () => {
  it('should accept a valid certification', () => {
    const result = CertificationSchema.safeParse({
      name: 'AWS Solutions Architect',
      issuer: 'Amazon',
      year: 2024,
    });
    expect(result.success).toBe(true);
  });

  it('should accept a certification with url', () => {
    const result = CertificationSchema.safeParse({
      name: 'AWS Solutions Architect',
      issuer: 'Amazon',
      year: 2024,
      url: 'https://aws.amazon.com/cert/123',
    });
    expect(result.success).toBe(true);
  });

  it('should reject missing required fields', () => {
    const result = CertificationSchema.safeParse({ name: 'AWS' });
    expect(result.success).toBe(false);
  });

  it('should reject year below 1990', () => {
    const result = CertificationSchema.safeParse({
      name: 'Cert',
      issuer: 'Issuer',
      year: 1989,
    });
    expect(result.success).toBe(false);
  });

  it('should reject year above 2100', () => {
    const result = CertificationSchema.safeParse({
      name: 'Cert',
      issuer: 'Issuer',
      year: 2101,
    });
    expect(result.success).toBe(false);
  });

  it('should reject name longer than 200 chars', () => {
    const result = CertificationSchema.safeParse({
      name: 'x'.repeat(201),
      issuer: 'Issuer',
      year: 2024,
    });
    expect(result.success).toBe(false);
  });
});

describe('CertificationsArraySchema', () => {
  it('should reject more than 50 items', () => {
    const items = Array.from({ length: 51 }, () => ({
      name: 'Cert',
      issuer: 'Issuer',
      year: 2024,
    }));
    const result = CertificationsArraySchema.safeParse(items);
    expect(result.success).toBe(false);
  });
});

describe('ResumeUrlsSchema', () => {
  it('should accept empty object', () => {
    const result = ResumeUrlsSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept valid URLs', () => {
    const result = ResumeUrlsSchema.safeParse({
      en: 'https://example.com/resume-en.pdf',
      vi: 'https://example.com/resume-vi.pdf',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid URL', () => {
    const result = ResumeUrlsSchema.safeParse({ en: 'not-a-url' });
    expect(result.success).toBe(false);
  });
});

describe('OpenToSchema', () => {
  it('should accept valid values', () => {
    const result = OpenToSchema.safeParse(['FREELANCE', 'CONSULTING']);
    expect(result.success).toBe(true);
  });

  it('should accept empty array', () => {
    const result = OpenToSchema.safeParse([]);
    expect(result.success).toBe(true);
  });

  it('should reject invalid values', () => {
    const result = OpenToSchema.safeParse(['INVALID']);
    expect(result.success).toBe(false);
  });
});
