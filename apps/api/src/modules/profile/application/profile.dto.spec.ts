import { UpsertProfileSchema, UpdateAvatarSchema, UpdateOgImageSchema } from './profile.dto';
import { ProfilePresenter } from './profile.presenter';
import { Profile } from '../domain/entities/profile.entity';
import type { IProfileProps } from '../domain/profile.types';

// --- Test Helpers ---

const validTranslatable = { en: 'English text', vi: 'Vietnamese text' };

const validSocialLink = {
  platform: 'GITHUB',
  url: 'https://github.com/user',
};

const validCertification = {
  name: 'AWS Solutions Architect',
  issuer: 'Amazon',
  year: 2024,
};

function buildValidUpsertPayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    fullName: validTranslatable,
    title: validTranslatable,
    bioShort: validTranslatable,
    bioLong: null,
    yearsOfExperience: 5,
    availability: 'EMPLOYED',
    openTo: ['FREELANCE'],
    email: 'test@example.com',
    preferredContactPlatform: 'LINKEDIN',
    preferredContactValue: 'linkedin.com/in/test',
    locationCountry: 'Vietnam',
    locationCity: 'Ho Chi Minh City',
    socialLinks: [validSocialLink],
    resumeUrls: { en: 'https://example.com/resume-en.pdf' },
    certifications: [validCertification],
    ...overrides,
  };
}

function buildProfileProps(overrides: Partial<IProfileProps> = {}): IProfileProps {
  return {
    id: '01234567-89ab-cdef-0123-456789abcdef',
    userId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    fullName: { en: 'John Doe', vi: 'Nguyễn Văn A' },
    title: { en: 'Software Engineer', vi: 'Kỹ sư phần mềm' },
    bioShort: { en: 'Short bio', vi: 'Tiểu sử ngắn' },
    bioLong: { en: 'Long bio', vi: 'Tiểu sử dài' },
    yearsOfExperience: 10,
    availability: 'EMPLOYED',
    openTo: ['FREELANCE'],
    email: 'john@example.com',
    phone: '+84123456789',
    preferredContactPlatform: 'LINKEDIN',
    preferredContactValue: 'linkedin.com/in/john',
    locationCountry: 'Vietnam',
    locationCity: 'Ho Chi Minh City',
    locationPostalCode: '70000',
    locationAddress1: '123 Main St',
    locationAddress2: 'Apt 4B',
    socialLinks: [{ platform: 'GITHUB', url: 'https://github.com/john', handle: 'john' }],
    resumeUrls: { en: 'https://example.com/resume.pdf' },
    certifications: [{ name: 'AWS SA', issuer: 'Amazon', year: 2024 }],
    metaTitle: 'John Doe Portfolio',
    metaDescription: 'John Doe is a software engineer',
    ogImageId: 'ffffffff-0000-1111-2222-333333333333',
    timezone: 'Asia/Ho_Chi_Minh',
    canonicalUrl: 'https://johndoe.com',
    avatarId: 'eeeeeeee-0000-1111-2222-333333333333',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-06-01'),
    createdById: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    updatedById: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    ...overrides,
  };
}

// --- UpsertProfileSchema ---

describe('UpsertProfileSchema', () => {
  it('should accept a valid full payload', () => {
    const result = UpsertProfileSchema.safeParse(buildValidUpsertPayload());
    expect(result.success).toBe(true);
  });

  it('should reject missing required fields', () => {
    const result = UpsertProfileSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should reject invalid email', () => {
    const result = UpsertProfileSchema.safeParse(buildValidUpsertPayload({ email: 'not-an-email' }));
    expect(result.success).toBe(false);
  });

  it('should reject yearsOfExperience out of range', () => {
    const tooLow = UpsertProfileSchema.safeParse(buildValidUpsertPayload({ yearsOfExperience: -1 }));
    const tooHigh = UpsertProfileSchema.safeParse(buildValidUpsertPayload({ yearsOfExperience: 100 }));
    expect(tooLow.success).toBe(false);
    expect(tooHigh.success).toBe(false);
  });

  it('should accept optional fields when omitted', () => {
    const payload = buildValidUpsertPayload();
    delete (payload as Record<string, unknown>)['phone'];
    delete (payload as Record<string, unknown>)['metaTitle'];
    delete (payload as Record<string, unknown>)['timezone'];
    const result = UpsertProfileSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('should reject metaTitle exceeding max length', () => {
    const result = UpsertProfileSchema.safeParse(buildValidUpsertPayload({ metaTitle: 'a'.repeat(71) }));
    expect(result.success).toBe(false);
  });

  it('should reject metaDescription exceeding max length', () => {
    const result = UpsertProfileSchema.safeParse(buildValidUpsertPayload({ metaDescription: 'a'.repeat(161) }));
    expect(result.success).toBe(false);
  });

  it('should reject invalid availability enum', () => {
    const result = UpsertProfileSchema.safeParse(buildValidUpsertPayload({ availability: 'RETIRED' }));
    expect(result.success).toBe(false);
  });

  it('should reject invalid canonicalUrl', () => {
    const result = UpsertProfileSchema.safeParse(buildValidUpsertPayload({ canonicalUrl: 'not-a-url' }));
    expect(result.success).toBe(false);
  });
});

// --- TranslatableSchema integration ---

describe('UpsertProfileSchema — translatable fields', () => {
  it('should reject missing locale in fullName', () => {
    const result = UpsertProfileSchema.safeParse(buildValidUpsertPayload({ fullName: { en: 'Only English' } }));
    expect(result.success).toBe(false);
  });

  it('should reject empty strings in translatable fields', () => {
    const result = UpsertProfileSchema.safeParse(buildValidUpsertPayload({ title: { en: '', vi: '' } }));
    expect(result.success).toBe(false);
  });
});

// --- SocialLinks validation ---

describe('UpsertProfileSchema — socialLinks', () => {
  it('should reject invalid URL in social link', () => {
    const result = UpsertProfileSchema.safeParse(
      buildValidUpsertPayload({ socialLinks: [{ platform: 'GITHUB', url: 'not-a-url' }] })
    );
    expect(result.success).toBe(false);
  });

  it('should reject invalid platform in social link', () => {
    const result = UpsertProfileSchema.safeParse(
      buildValidUpsertPayload({ socialLinks: [{ platform: 'MYSPACE', url: 'https://example.com' }] })
    );
    expect(result.success).toBe(false);
  });

  it('should reject array exceeding max size', () => {
    const links = Array.from({ length: 21 }, (_, i) => ({
      platform: 'GITHUB',
      url: `https://github.com/user${i}`,
    }));
    const result = UpsertProfileSchema.safeParse(buildValidUpsertPayload({ socialLinks: links }));
    expect(result.success).toBe(false);
  });
});

// --- Certifications validation ---

describe('UpsertProfileSchema — certifications', () => {
  it('should reject certification missing required fields', () => {
    const result = UpsertProfileSchema.safeParse(buildValidUpsertPayload({ certifications: [{ name: 'AWS' }] }));
    expect(result.success).toBe(false);
  });

  it('should reject certification with year out of bounds', () => {
    const result = UpsertProfileSchema.safeParse(
      buildValidUpsertPayload({ certifications: [{ ...validCertification, year: 1800 }] })
    );
    expect(result.success).toBe(false);
  });
});

// --- UpdateAvatarSchema / UpdateOgImageSchema ---

describe('UpdateAvatarSchema', () => {
  it('should accept a valid UUID', () => {
    const result = UpdateAvatarSchema.safeParse({ avatarId: '550e8400-e29b-41d4-a716-446655440000' });
    expect(result.success).toBe(true);
  });

  it('should accept null to remove avatar', () => {
    const result = UpdateAvatarSchema.safeParse({ avatarId: null });
    expect(result.success).toBe(true);
  });

  it('should reject invalid UUID', () => {
    const result = UpdateAvatarSchema.safeParse({ avatarId: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });
});

describe('UpdateOgImageSchema', () => {
  it('should accept a valid UUID', () => {
    const result = UpdateOgImageSchema.safeParse({ ogImageId: '550e8400-e29b-41d4-a716-446655440000' });
    expect(result.success).toBe(true);
  });

  it('should accept null to remove OG image', () => {
    const result = UpdateOgImageSchema.safeParse({ ogImageId: null });
    expect(result.success).toBe(true);
  });
});

// --- ProfilePresenter ---

describe('ProfilePresenter', () => {
  const props = buildProfileProps();
  const profile = Profile.load(props);
  const avatarUrl = 'https://cdn.example.com/avatar.jpg';
  const ogImageUrl = 'https://cdn.example.com/og.jpg';

  describe('toPublicResponse', () => {
    const result = ProfilePresenter.toPublicResponse(profile, avatarUrl, ogImageUrl);

    it('should include public fields', () => {
      expect(result.fullName).toEqual(props.fullName);
      expect(result.email).toBe(props.email);
      expect(result.locationCity).toBe(props.locationCity);
      expect(result.locationCountry).toBe(props.locationCountry);
      expect(result.avatarUrl).toBe(avatarUrl);
      expect(result.ogImageUrl).toBe(ogImageUrl);
    });

    it('should exclude private fields', () => {
      const keys = Object.keys(result);
      expect(keys).not.toContain('phone');
      expect(keys).not.toContain('locationPostalCode');
      expect(keys).not.toContain('locationAddress1');
      expect(keys).not.toContain('locationAddress2');
      expect(keys).not.toContain('createdAt');
      expect(keys).not.toContain('updatedAt');
      expect(keys).not.toContain('createdById');
      expect(keys).not.toContain('updatedById');
      expect(keys).not.toContain('id');
      expect(keys).not.toContain('userId');
    });
  });

  describe('toAdminResponse', () => {
    const result = ProfilePresenter.toAdminResponse(profile, avatarUrl, ogImageUrl);

    it('should include all fields including private ones', () => {
      expect(result.phone).toBe(props.phone);
      expect(result.locationPostalCode).toBe(props.locationPostalCode);
      expect(result.locationAddress1).toBe(props.locationAddress1);
      expect(result.locationAddress2).toBe(props.locationAddress2);
      expect(result.id).toBe(props.id);
      expect(result.userId).toBe(props.userId);
    });

    it('should include audit fields', () => {
      expect(result.createdAt).toEqual(props.createdAt);
      expect(result.updatedAt).toEqual(props.updatedAt);
      expect(result.createdById).toBe(props.createdById);
      expect(result.updatedById).toBe(props.updatedById);
    });
  });

  describe('toJsonLd', () => {
    const result = ProfilePresenter.toJsonLd(profile, 'en', avatarUrl);

    it('should have valid Schema.org structure', () => {
      expect(result['@context']).toBe('https://schema.org');
      expect(result['@type']).toBe('Person');
    });

    it('should use localized fields for requested locale', () => {
      expect(result.name).toBe('John Doe');
      expect(result.jobTitle).toBe('Software Engineer');
      expect(result.description).toBe('Short bio');
    });

    it('should use Vietnamese locale when requested', () => {
      const viResult = ProfilePresenter.toJsonLd(profile, 'vi', avatarUrl);
      expect(viResult.name).toBe('Nguyễn Văn A');
      expect(viResult.jobTitle).toBe('Kỹ sư phần mềm');
    });

    it('should include address with city and country only', () => {
      expect(result.address).toEqual({
        '@type': 'PostalAddress',
        addressLocality: 'Ho Chi Minh City',
        addressCountry: 'Vietnam',
      });
    });

    it('should include social links as sameAs', () => {
      expect(result.sameAs).toEqual(['https://github.com/john']);
    });

    it('should include knowsLanguage', () => {
      expect(result.knowsLanguage).toEqual(['en', 'vi']);
    });
  });
});
