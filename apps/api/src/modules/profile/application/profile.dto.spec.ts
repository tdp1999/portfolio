import { UpdateAvatarSchema, UpdateOgImageSchema } from './profile.dto';
import { ProfilePresenter } from './profile.presenter';
import { Profile } from '../domain/entities/profile.entity';
import type { IProfileProps } from '../domain/profile.types';

// --- Test Helpers ---

function buildProfileProps(overrides: Partial<IProfileProps> = {}): IProfileProps {
  return {
    id: '01234567-89ab-cdef-0123-456789abcdef',
    userId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    fullName: { en: 'John Doe', vi: 'Nguyễn Văn A' },
    title: { en: 'Software Engineer', vi: 'Kỹ sư phần mềm' },
    bioShort: { en: 'Short bio', vi: 'Tiểu sử ngắn' },
    bioLongJson: null,
    bioLongHtml: null,
    bioLongSchemaVersion: 1,
    bioLongCanonical: null,
    yearsOfExperience: 10,
    availability: 'EMPLOYED',
    openTo: ['FREELANCE'],
    email: 'john@example.com',
    phone: '+84123456789',
    phoneZalo: null,
    preferredContactPlatform: 'LINKEDIN',
    preferredContactValue: 'linkedin.com/in/john',
    locationCountry: 'Vietnam',
    locationCity: 'Ho Chi Minh City',
    locationPostalCode: '70000',
    locationAddress1: '123 Main St',
    locationAddress2: 'Apt 4B',
    socialLinks: [{ platform: 'GITHUB', url: 'https://github.com/john', handle: 'john' }],
    resumeUrls: { en: { url: 'https://example.com/resume.pdf', name: 'Resume' } },
    certifications: [{ name: 'AWS SA', issuer: 'Amazon', year: 2024 }],
    metaTitle: 'John Doe Portfolio',
    metaDescription: 'John Doe is a software engineer',
    ogImageId: 'ffffffff-0000-1111-2222-333333333333',
    timezones: ['Asia/Ho_Chi_Minh'],
    workingHours: null,
    canonicalUrl: 'https://johndoe.com',
    avatarId: 'eeeeeeee-0000-1111-2222-333333333333',
    tagline: null,
    stackIntro: null,
    selectedWorkIntro: null,
    contactIntro: null,
    footerTagline: null,
    aboutHeading: null,
    aboutLede: null,
    ctaHeading: null,
    ctaLede: null,
    coreStack: [],
    contentUpdatedAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-06-01'),
    createdById: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    updatedById: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    ...overrides,
  };
}

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

    it('should expose phoneZalo on the public surface (null when unset)', () => {
      expect(Object.keys(result)).toContain('phoneZalo');
      expect(result.phoneZalo).toBeNull();
    });

    it('should pass a non-null phoneZalo through to the public surface', () => {
      const profileWithZalo = Profile.load(buildProfileProps({ phoneZalo: '+84901234567' }));
      const withZalo = ProfilePresenter.toPublicResponse(profileWithZalo, avatarUrl, ogImageUrl);
      expect(withZalo.phoneZalo).toBe('+84901234567');
    });

    it('should expose the /about narrative copy fields (null when unset)', () => {
      expect(result.aboutHeading).toBeNull();
      expect(result.aboutLede).toBeNull();
      expect(result.ctaHeading).toBeNull();
      expect(result.ctaLede).toBeNull();
    });

    it('should serialize contentUpdatedAt as an ISO string when set', () => {
      const stamped = Profile.load(buildProfileProps({ contentUpdatedAt: new Date('2026-05-23T10:00:00.000Z') }));
      const dto = ProfilePresenter.toPublicResponse(stamped, avatarUrl, ogImageUrl);
      expect(dto.contentUpdatedAt).toBe('2026-05-23T10:00:00.000Z');
    });

    it('should expose contentUpdatedAt as null on a fresh profile', () => {
      expect(result.contentUpdatedAt).toBeNull();
    });

    it('should pass aboutHeading/aboutLede/ctaHeading/ctaLede through when set', () => {
      const aboutHeading = { en: 'Hello', vi: 'Xin chao' };
      const aboutLede = { en: 'Lede', vi: 'Mo dau' };
      const ctaHeading = { en: 'CTA', vi: 'Hanh dong' };
      const ctaLede = { en: 'Pick the door', vi: 'Chon cua' };
      const populated = Profile.load(buildProfileProps({ aboutHeading, aboutLede, ctaHeading, ctaLede }));
      const dto = ProfilePresenter.toPublicResponse(populated, avatarUrl, ogImageUrl);
      expect(dto.aboutHeading).toEqual(aboutHeading);
      expect(dto.aboutLede).toEqual(aboutLede);
      expect(dto.ctaHeading).toEqual(ctaHeading);
      expect(dto.ctaLede).toEqual(ctaLede);
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
