import { Experience } from './experience.entity';
import { IExperienceProps } from '../experience.types';

describe('Experience Entity', () => {
  const userId = '550e8400-e29b-41d4-a716-446655440000';

  const validProps: IExperienceProps = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    slug: 'fpt-software-senior-frontend-engineer',
    companyName: 'FPT Software',
    companyUrl: 'https://fpt-software.com',
    companyLogoId: null,
    position: { en: 'Senior Frontend Engineer', vi: 'Kỹ sư Frontend cấp cao' },
    description: { en: 'Built enterprise apps', vi: 'Xây dựng ứng dụng doanh nghiệp' },
    responsibilities: { en: ['Reduced load time by 40%'], vi: ['Giảm thời gian tải 40%'] },
    highlights: { en: [], vi: [] },
    teamRole: null,
    links: [],
    employmentType: 'FULL_TIME',
    locationType: 'ONSITE',
    locationCountry: 'VN',
    locationCity: 'Ho Chi Minh',
    locationPostalCode: null,
    locationAddress1: null,
    locationAddress2: null,
    clientName: null,
    domain: null,
    teamSize: null,
    startDate: new Date('2022-01-01'),
    endDate: new Date('2024-01-01'),
    displayOrder: 0,
    skillIds: ['550e8400-e29b-41d4-a716-446655440010'],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    createdById: userId,
    updatedById: userId,
    deletedAt: null,
    deletedById: null,
  };

  describe('create()', () => {
    it('should generate UUID v7, audit fields, and apply defaults', () => {
      const exp = Experience.create(
        {
          companyName: 'Acme Corp',
          position: { en: 'Backend Engineer', vi: 'Kỹ sư Backend' },
          locationCountry: 'VN',
          startDate: new Date('2023-01-01'),
        },
        userId
      );

      expect(exp.id).toBeDefined();
      expect(exp.createdById).toBe(userId);
      expect(exp.updatedById).toBe(userId);
      expect(exp.createdAt).toBeInstanceOf(Date);
      expect(exp.isDeleted).toBe(false);
      expect(exp.displayOrder).toBe(0);
      expect(exp.employmentType).toBe('FULL_TIME');
      expect(exp.locationType).toBe('ONSITE');
      expect(exp.endDate).toBeNull();
    });

    it('should generate slug from companyName + position.en', () => {
      const exp = Experience.create(
        {
          companyName: 'FPT Software',
          position: { en: 'Senior Frontend Engineer', vi: 'Kỹ sư Frontend cấp cao' },
          locationCountry: 'VN',
          startDate: new Date('2022-01-01'),
        },
        userId
      );

      expect(exp.slug).toBe('fpt-software-senior-frontend-engineer');
    });

    it('should default responsibilities to { en: [], vi: [] }', () => {
      const exp = Experience.create(
        {
          companyName: 'Acme',
          position: { en: 'Dev', vi: 'Dev' },
          locationCountry: 'VN',
          startDate: new Date('2023-01-01'),
        },
        userId
      );

      expect(exp.responsibilities).toEqual({ en: [], vi: [] });
    });
  });

  describe('update()', () => {
    it('should preserve slug even when companyName or position changes', () => {
      const exp = Experience.load(validProps);

      const updated = exp.update(
        {
          companyName: 'New Company',
          position: { en: 'CTO', vi: 'Giám đốc công nghệ' },
        },
        userId
      );

      expect(updated.slug).toBe(validProps.slug);
    });

    it('should set updatedAt and updatedById', () => {
      const exp = Experience.load(validProps);

      const updated = exp.update({ companyName: 'New Name' }, userId);

      expect(updated.updatedById).toBe(userId);
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(exp.updatedAt.getTime());
    });

    it('should clear nullable fields when set to null', () => {
      const exp = Experience.load({
        ...validProps,
        description: { en: 'desc', vi: 'mô tả' },
        teamRole: { en: 'lead', vi: 'trưởng nhóm' },
        endDate: new Date('2024-01-01'),
        clientName: 'Client X',
        teamSize: 10,
      });

      const updated = exp.update(
        { description: null, teamRole: null, endDate: null, clientName: null, teamSize: null },
        userId
      );

      expect(updated.description).toBeNull();
      expect(updated.teamRole).toBeNull();
      expect(updated.endDate).toBeNull();
      expect(updated.clientName).toBeNull();
      expect(updated.teamSize).toBeNull();
    });
  });

  describe('softDelete()', () => {
    it('should set deletedAt and deletedById without mutating original', () => {
      const exp = Experience.load(validProps);

      const deleted = exp.softDelete(userId);

      expect(deleted.isDeleted).toBe(true);
      expect(deleted.deletedAt).toBeInstanceOf(Date);
      expect(deleted.deletedById).toBe(userId);
      expect(exp.isDeleted).toBe(false);
    });
  });

  describe('restore()', () => {
    it('should clear deletedAt and deletedById', () => {
      const exp = Experience.load({ ...validProps, deletedAt: new Date(), deletedById: userId });

      const restored = exp.restore(userId);

      expect(restored.isDeleted).toBe(false);
      expect(restored.deletedAt).toBeNull();
      expect(restored.deletedById).toBeNull();
    });
  });

  describe('isCurrent', () => {
    it('should return true when endDate is null', () => {
      const exp = Experience.load({ ...validProps, endDate: null });

      expect(exp.isCurrent).toBe(true);
    });

    it('should return false when endDate is set', () => {
      const exp = Experience.load({ ...validProps, endDate: new Date('2024-01-01') });

      expect(exp.isCurrent).toBe(false);
    });
  });
});
