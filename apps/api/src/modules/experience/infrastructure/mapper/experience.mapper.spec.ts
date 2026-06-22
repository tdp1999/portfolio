import { Experience as PrismaExperience, ExperienceSkill } from '@prisma/client';
import { ExperienceMapper } from './experience.mapper';

type PrismaExperienceWithRelations = PrismaExperience & {
  skills: ExperienceSkill[];
};

const RAW_EXPERIENCE: PrismaExperienceWithRelations = {
  id: '00000000-0000-0000-0000-000000000001',
  slug: 'acme-engineer',
  companyName: 'Acme',
  companyUrl: null,
  companyLogoId: null,
  position: { en: 'Engineer', vi: 'Kỹ sư' },
  description: null,
  responsibilities: { en: [], vi: [] },
  highlights: { en: [], vi: [] },
  descriptionJson: null,
  descriptionHtml: null,
  descriptionSchemaVersion: 1,
  responsibilitiesJson: null,
  responsibilitiesHtml: null,
  responsibilitiesSchemaVersion: 1,
  highlightsJson: null,
  highlightsHtml: null,
  highlightsSchemaVersion: 1,
  teamRole: null,
  links: [],
  employmentType: 'FULL_TIME',
  locationType: 'ONSITE',
  locationCountry: 'VN',
  locationCity: null,
  locationPostalCode: null,
  locationAddress1: null,
  locationAddress2: null,
  clientName: null,
  domain: null,
  teamSizeMin: null,
  teamSizeMax: null,
  startDate: new Date('2023-01-01'),
  endDate: null,
  displayOrder: 0,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  createdById: '00000000-0000-0000-0000-000000000099',
  updatedById: '00000000-0000-0000-0000-000000000099',
  deletedAt: null,
  deletedById: null,
  skills: [],
};

describe('ExperienceMapper', () => {
  describe('toDomain — rich-text storage passthrough', () => {
    it('maps each prose sub-field Json/Html/SchemaVersion onto matching fields (no field swap)', () => {
      const json = (k: string) => ({ en: { doc: `${k}-en` }, vi: { doc: `${k}-vi` } });
      const html = (k: string) => ({ en: `<p>${k}-en</p>`, vi: `<p>${k}-vi</p>` });
      const raw: PrismaExperienceWithRelations = {
        ...RAW_EXPERIENCE,
        descriptionJson: json('description'),
        descriptionHtml: html('description'),
        descriptionSchemaVersion: 2,
        responsibilitiesJson: json('responsibilities'),
        responsibilitiesHtml: html('responsibilities'),
        responsibilitiesSchemaVersion: 3,
        highlightsJson: json('highlights'),
        highlightsHtml: html('highlights'),
        highlightsSchemaVersion: 4,
      };

      const exp = ExperienceMapper.toDomain(raw);

      expect(exp.descriptionJson).toEqual(json('description'));
      expect(exp.descriptionHtml).toEqual(html('description'));
      expect(exp.descriptionSchemaVersion).toBe(2);
      expect(exp.responsibilitiesJson).toEqual(json('responsibilities'));
      expect(exp.responsibilitiesHtml).toEqual(html('responsibilities'));
      expect(exp.responsibilitiesSchemaVersion).toBe(3);
      expect(exp.highlightsJson).toEqual(json('highlights'));
      expect(exp.highlightsHtml).toEqual(html('highlights'));
      expect(exp.highlightsSchemaVersion).toBe(4);
    });
  });
});
