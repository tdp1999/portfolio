import {
  CreateExperienceSchema,
  UpdateExperienceSchema,
  ListExperiencesSchema,
  ReorderExperiencesSchema,
} from './experience.dto';
import { ExperiencePresenter } from './experience.presenter';
import { Experience } from '../domain/entities/experience.entity';
import type { IExperienceProps } from '../domain/experience.types';

// --- Test Helpers ---

const validTranslatable = { en: 'English text', vi: 'Vietnamese text' };

function buildValidCreatePayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    companyName: 'Acme Corp',
    position: validTranslatable,
    locationCountry: 'Vietnam',
    startDate: '2023-01-01',
    ...overrides,
  };
}

function buildExperienceProps(overrides: Partial<IExperienceProps> = {}): IExperienceProps {
  return {
    id: '01234567-89ab-cdef-0123-456789abcdef',
    slug: 'acme-corp-software-engineer',
    companyName: 'Acme Corp',
    companyUrl: 'https://acme.com',
    companyLogoId: null,
    position: { en: 'Software Engineer', vi: 'Kỹ sư phần mềm' },
    description: { en: 'Building great things', vi: 'Xây dựng những thứ tuyệt vời' },
    responsibilities: { en: ['Built a feature'], vi: ['Xây dựng tính năng'] },
    highlights: { en: [], vi: [] },
    teamRole: null,
    links: [],
    employmentType: 'FULL_TIME',
    locationType: 'REMOTE',
    locationCountry: 'Vietnam',
    locationCity: 'Ho Chi Minh City',
    locationPostalCode: '70000',
    locationAddress1: '123 Main St',
    locationAddress2: null,
    clientName: 'Big Client',
    domain: 'FinTech',
    teamSizeMin: 5,
    teamSizeMax: 10,
    startDate: new Date('2023-01-01'),
    endDate: null,
    displayOrder: 0,
    skillIds: ['aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'],
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-06-01'),
    createdById: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    updatedById: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    deletedAt: null,
    deletedById: null,
    ...overrides,
  };
}

// --- CreateExperienceSchema ---

describe('CreateExperienceSchema', () => {
  it('should accept a valid complete payload', () => {
    const result = CreateExperienceSchema.safeParse(
      buildValidCreatePayload({
        companyUrl: 'https://acme.com',
        companyLogoId: '550e8400-e29b-41d4-a716-446655440000',
        description: { en: 'Great company', vi: 'Công ty tuyệt vời' },
        responsibilities: { en: ['Led team'], vi: ['Dẫn dắt nhóm'] },
        teamRole: { en: 'Tech Lead', vi: 'Trưởng nhóm kỹ thuật' },
        employmentType: 'CONTRACT',
        locationType: 'HYBRID',
        locationCountry: 'Vietnam',
        locationCity: 'Hanoi',
        teamSizeMin: 5,
        teamSizeMax: 5,
        endDate: '2024-01-01',
        skillIds: ['550e8400-e29b-41d4-a716-446655440000'],
        displayOrder: 1,
      })
    );
    expect(result.success).toBe(true);
  });

  it('should reject missing required fields', () => {
    expect(CreateExperienceSchema.safeParse({}).success).toBe(false);
    expect(CreateExperienceSchema.safeParse({ companyName: 'Acme' }).success).toBe(false);
    expect(CreateExperienceSchema.safeParse({ companyName: 'Acme', position: validTranslatable }).success).toBe(false);
  });

  it('should reject missing locale in position', () => {
    const result = CreateExperienceSchema.safeParse(buildValidCreatePayload({ position: { en: 'Only English' } }));
    expect(result.success).toBe(false);
  });

  it('should validate translatable fields structure requiring both en and vi', () => {
    const result = CreateExperienceSchema.safeParse(buildValidCreatePayload({ position: { en: '', vi: '' } }));
    expect(result.success).toBe(false);
  });

  it('should default responsibilities to { en: [], vi: [] } when omitted', () => {
    const result = CreateExperienceSchema.safeParse(buildValidCreatePayload());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.responsibilities).toEqual({ en: [], vi: [] });
    }
  });

  it('should default highlights to { en: [], vi: [] } when omitted', () => {
    const result = CreateExperienceSchema.safeParse(buildValidCreatePayload());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.highlights).toEqual({ en: [], vi: [] });
    }
  });

  it('should default links to [] when omitted', () => {
    const result = CreateExperienceSchema.safeParse(buildValidCreatePayload());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.links).toEqual([]);
    }
  });

  it('should accept valid links array', () => {
    const result = CreateExperienceSchema.safeParse(
      buildValidCreatePayload({ links: [{ label: 'Case Study', url: 'https://example.com/case' }] })
    );
    expect(result.success).toBe(true);
  });

  it('should reject link with invalid url', () => {
    const result = CreateExperienceSchema.safeParse(
      buildValidCreatePayload({ links: [{ label: 'Bad', url: 'not-a-url' }] })
    );
    expect(result.success).toBe(false);
  });

  it('should default employmentType to FULL_TIME when omitted', () => {
    const result = CreateExperienceSchema.safeParse(buildValidCreatePayload());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.employmentType).toBe('FULL_TIME');
    }
  });

  it('should default locationType to ONSITE when omitted', () => {
    const result = CreateExperienceSchema.safeParse(buildValidCreatePayload());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.locationType).toBe('ONSITE');
    }
  });

  it('should default skillIds to [] and displayOrder to 0 when omitted', () => {
    const result = CreateExperienceSchema.safeParse(buildValidCreatePayload());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.skillIds).toEqual([]);
      expect(result.data.displayOrder).toBe(0);
    }
  });

  it('should coerce ISO string startDate to Date', () => {
    const result = CreateExperienceSchema.safeParse(buildValidCreatePayload({ startDate: '2023-01-15' }));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.startDate).toBeInstanceOf(Date);
    }
  });

  it('should reject invalid employmentType', () => {
    const result = CreateExperienceSchema.safeParse(buildValidCreatePayload({ employmentType: 'INVALID' }));
    expect(result.success).toBe(false);
  });

  it('should reject teamSizeMin less than 1', () => {
    const result = CreateExperienceSchema.safeParse(buildValidCreatePayload({ teamSizeMin: 0 }));
    expect(result.success).toBe(false);
  });

  it('should reject teamSizeMin greater than teamSizeMax', () => {
    const result = CreateExperienceSchema.safeParse(buildValidCreatePayload({ teamSizeMin: 10, teamSizeMax: 5 }));
    expect(result.success).toBe(false);
  });

  it('should accept teamSizeMin equal to teamSizeMax (single team size)', () => {
    const result = CreateExperienceSchema.safeParse(buildValidCreatePayload({ teamSizeMin: 8, teamSizeMax: 8 }));
    expect(result.success).toBe(true);
  });

  it('should reject companyName exceeding max length', () => {
    const result = CreateExperienceSchema.safeParse(buildValidCreatePayload({ companyName: 'a'.repeat(201) }));
    expect(result.success).toBe(false);
  });

  it('should accept null description', () => {
    const result = CreateExperienceSchema.safeParse(buildValidCreatePayload({ description: null }));
    expect(result.success).toBe(true);
  });
});

// --- UpdateExperienceSchema ---

describe('UpdateExperienceSchema', () => {
  it('should accept partial updates', () => {
    const result = UpdateExperienceSchema.safeParse({ companyName: 'New Corp' });
    expect(result.success).toBe(true);
  });

  it('should reject an empty object', () => {
    const result = UpdateExperienceSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// --- ListExperiencesSchema ---

describe('ListExperiencesSchema', () => {
  it('should accept empty query (all defaults)', () => {
    const result = ListExperiencesSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
      expect(result.data.includeDeleted).toBe(false);
    }
  });

  it('should accept valid filters', () => {
    const result = ListExperiencesSchema.safeParse({
      employmentType: 'FULL_TIME',
      locationType: 'REMOTE',
      includeDeleted: 'true',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.includeDeleted).toBe(true);
    }
  });

  it('should reject invalid employmentType filter', () => {
    const result = ListExperiencesSchema.safeParse({ employmentType: 'INVALID' });
    expect(result.success).toBe(false);
  });
});

// --- ReorderExperiencesSchema ---

describe('ReorderExperiencesSchema', () => {
  it('should accept a valid reorder array', () => {
    const result = ReorderExperiencesSchema.safeParse([
      { id: '550e8400-e29b-41d4-a716-446655440000', displayOrder: 0 },
      { id: '550e8400-e29b-41d4-a716-446655440001', displayOrder: 1 },
    ]);
    expect(result.success).toBe(true);
  });

  it('should reject an empty array', () => {
    const result = ReorderExperiencesSchema.safeParse([]);
    expect(result.success).toBe(false);
  });

  it('should reject invalid UUID in id field', () => {
    const result = ReorderExperiencesSchema.safeParse([{ id: 'not-a-uuid', displayOrder: 0 }]);
    expect(result.success).toBe(false);
  });

  it('should reject negative displayOrder', () => {
    const result = ReorderExperiencesSchema.safeParse([
      { id: '550e8400-e29b-41d4-a716-446655440000', displayOrder: -1 },
    ]);
    expect(result.success).toBe(false);
  });
});

// --- ExperiencePresenter ---

describe('ExperiencePresenter', () => {
  const props = buildExperienceProps();
  const experience = Experience.load(props);
  const skills = [
    { id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', name: { en: 'TypeScript', vi: 'TypeScript' }, slug: 'typescript' },
  ];
  const companyLogoUrl = 'https://cdn.example.com/logo.png';

  describe('toPublicResponse', () => {
    const result = ExperiencePresenter.toPublicResponse(experience, skills, companyLogoUrl);

    it('should include public fields', () => {
      expect(result.id).toBe(props.id);
      expect(result.slug).toBe(props.slug);
      expect(result.companyName).toBe(props.companyName);
      expect(result.companyLogoUrl).toBe(companyLogoUrl);
      expect(result.position).toEqual(props.position);
      expect(result.employmentType).toBe(props.employmentType);
      expect(result.locationCountry).toBe(props.locationCountry);
      expect(result.domain).toBe(props.domain);
    });

    it('should format skills as { id, name, slug }[]', () => {
      expect(result.skills).toEqual([{ id: skills[0].id, name: skills[0].name, slug: skills[0].slug }]);
    });

    it('should exclude private fields', () => {
      const keys = Object.keys(result);
      expect(keys).not.toContain('clientName');
      expect(keys).not.toContain('locationPostalCode');
      expect(keys).not.toContain('locationAddress1');
      expect(keys).not.toContain('locationAddress2');
      expect(keys).not.toContain('displayOrder');
      expect(keys).not.toContain('createdAt');
      expect(keys).not.toContain('updatedAt');
      expect(keys).not.toContain('createdById');
      expect(keys).not.toContain('updatedById');
    });
  });

  describe('toAdminResponse', () => {
    const result = ExperiencePresenter.toAdminResponse(experience, skills, companyLogoUrl);

    it('should include all public fields plus private ones', () => {
      expect(result.id).toBe(props.id);
      expect(result.clientName).toBe(props.clientName);
      expect(result.locationPostalCode).toBe(props.locationPostalCode);
      expect(result.locationAddress1).toBe(props.locationAddress1);
      expect(result.displayOrder).toBe(props.displayOrder);
      expect(result.companyLogoId).toBe(props.companyLogoId);
    });

    it('should include audit fields', () => {
      expect(result.createdAt).toEqual(props.createdAt);
      expect(result.updatedAt).toEqual(props.updatedAt);
      expect(result.createdById).toBe(props.createdById);
      expect(result.updatedById).toBe(props.updatedById);
      expect(result.deletedAt).toBe(props.deletedAt);
      expect(result.deletedById).toBe(props.deletedById);
    });
  });

  describe('toPublicListResponse', () => {
    it('should map an array of items to public responses', () => {
      const items = [{ experience, skills, companyLogoUrl }];
      const result = ExperiencePresenter.toPublicListResponse(items);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(props.id);
      expect(Object.keys(result[0])).not.toContain('clientName');
    });
  });

  describe('toAdminListResponse', () => {
    it('should return data array with total count', () => {
      const items = [{ experience, skills, companyLogoUrl }];
      const result = ExperiencePresenter.toAdminListResponse(items, 42);
      expect(result.total).toBe(42);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].clientName).toBe(props.clientName);
    });
  });
});
