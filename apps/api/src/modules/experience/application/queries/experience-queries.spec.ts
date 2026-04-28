import { ListExperiencesQuery, ListExperiencesHandler } from './list-experiences.handler';
import { GetExperienceByIdQuery, GetExperienceByIdHandler } from './get-experience-by-id.handler';
import { GetExperienceBySlugQuery, GetExperienceBySlugHandler } from './get-experience-by-slug.handler';
import { ListPublicExperiencesQuery, ListPublicExperiencesHandler } from './list-public-experiences.handler';
import { IExperienceRepository } from '../ports/experience.repository.port';
import { ISkillRepository } from '../../../skill/application/ports/skill.repository.port';
import { IMediaRepository } from '../../../media/application/ports/media.repository.port';
import { Experience } from '../../domain/entities/experience.entity';
import { Skill } from '../../../skill/domain/entities/skill.entity';
import { IExperienceProps } from '../../domain/experience.types';
import { ISkillProps } from '../../../skill/domain/skill.types';

describe('Experience Queries', () => {
  let repo: jest.Mocked<IExperienceRepository>;
  let skillRepo: jest.Mocked<ISkillRepository>;
  let mediaRepo: jest.Mocked<IMediaRepository>;

  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const experienceId = '550e8400-e29b-41d4-a716-446655440001';
  const skillId = '550e8400-e29b-41d4-a716-446655440002';
  const mediaId = '550e8400-e29b-41d4-a716-446655440003';

  const baseProps: IExperienceProps = {
    id: experienceId,
    slug: 'fpt-software-senior-frontend-engineer',
    companyName: 'FPT Software',
    companyUrl: null,
    companyLogoId: null,
    position: { en: 'Senior Frontend Engineer', vi: 'Kỹ sư Frontend cấp cao' },
    description: null,
    responsibilities: { en: [], vi: [] },
    highlights: { en: [], vi: [] },
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
    teamSize: null,
    startDate: new Date('2022-01-01'),
    endDate: null,
    displayOrder: 1,
    skillIds: [],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    createdById: userId,
    updatedById: userId,
    deletedAt: null,
    deletedById: null,
  };

  const skillProps: ISkillProps = {
    id: skillId,
    name: 'TypeScript',
    slug: 'typescript',
    description: null,
    category: 'TECHNICAL',
    isLibrary: false,
    parentSkillId: null,
    yearsOfExperience: null,
    iconId: null,
    iconUrl: null,
    proficiencyNote: null,
    isFeatured: false,
    displayOrder: 0,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    createdById: userId,
    updatedById: userId,
    deletedAt: null,
    deletedById: null,
  };

  const loadExperience = (overrides: Partial<IExperienceProps> = {}) => Experience.load({ ...baseProps, ...overrides });

  const loadSkill = (overrides: Partial<ISkillProps> = {}) => Skill.load({ ...skillProps, ...overrides });

  beforeEach(() => {
    repo = {
      add: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      restore: jest.fn(),
      findById: jest.fn(),
      findByIdIncludeDeleted: jest.fn(),
      findBySlug: jest.fn(),
      findAll: jest.fn(),
      findAllPublic: jest.fn(),
      slugExists: jest.fn(),
      reorder: jest.fn(),
    };

    skillRepo = {
      add: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findByName: jest.fn(),
      findByCategory: jest.fn(),
      findChildren: jest.fn(),
      hasChildren: jest.fn(),
      findAll: jest.fn(),
      findAllNoLimit: jest.fn(),
    } as jest.Mocked<ISkillRepository>;

    mediaRepo = {
      add: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      hardDelete: jest.fn(),
      findById: jest.fn(),
      findByIdIncludeDeleted: jest.fn(),
      findBySlug: jest.fn(),
      findByPublicId: jest.fn(),
      findByMimeTypePrefix: jest.fn(),
      findOrphans: jest.fn(),
      findExpiredSoftDeleted: jest.fn(),
      findDeleted: jest.fn(),
      findAll: jest.fn(),
      getStorageStats: jest.fn(),
    } as jest.Mocked<IMediaRepository>;
  });

  // --- ListExperiences ---

  describe('ListExperiencesHandler', () => {
    let handler: ListExperiencesHandler;
    beforeEach(() => (handler = new ListExperiencesHandler(repo, skillRepo, mediaRepo)));

    it('should return paginated admin response', async () => {
      repo.findAll.mockResolvedValue({ data: [loadExperience()], total: 1 });

      const result = await handler.execute(new ListExperiencesQuery({}));

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.data[0].id).toBe(experienceId);
      expect(result.data[0].createdAt).toBeDefined();
    });

    it('should pass search filter to repository', async () => {
      repo.findAll.mockResolvedValue({ data: [], total: 0 });

      await handler.execute(new ListExperiencesQuery({ search: 'FPT' }));

      expect(repo.findAll).toHaveBeenCalledWith(expect.objectContaining({ search: 'FPT' }));
    });

    it('should pass employmentType filter to repository', async () => {
      repo.findAll.mockResolvedValue({ data: [], total: 0 });

      await handler.execute(new ListExperiencesQuery({ employmentType: 'FULL_TIME' }));

      expect(repo.findAll).toHaveBeenCalledWith(expect.objectContaining({ employmentType: 'FULL_TIME' }));
    });
  });

  // --- GetExperienceById ---

  describe('GetExperienceByIdHandler', () => {
    let handler: GetExperienceByIdHandler;
    beforeEach(() => (handler = new GetExperienceByIdHandler(repo, skillRepo, mediaRepo)));

    it('should return admin response when found', async () => {
      repo.findById.mockResolvedValue(loadExperience({ skillIds: [skillId] }));
      skillRepo.findById.mockResolvedValue(loadSkill());

      const result = await handler.execute(new GetExperienceByIdQuery(experienceId));

      expect(result.id).toBe(experienceId);
      expect(result.createdAt).toBeDefined();
      expect(result.skills).toHaveLength(1);
      expect(result.skills[0].slug).toBe('typescript');
    });

    it('should throw NotFoundError when experience does not exist', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(handler.execute(new GetExperienceByIdQuery(experienceId))).rejects.toMatchObject({
        statusCode: 404,
        errorCode: 'EXPERIENCE_NOT_FOUND',
      });
    });
  });

  // --- GetExperienceBySlug ---

  describe('GetExperienceBySlugHandler', () => {
    let handler: GetExperienceBySlugHandler;
    beforeEach(() => (handler = new GetExperienceBySlugHandler(repo, skillRepo, mediaRepo)));

    it('should return public response (no audit fields, no private location)', async () => {
      repo.findBySlug.mockResolvedValue(loadExperience());

      const result = await handler.execute(new GetExperienceBySlugQuery('fpt-software-senior-frontend-engineer'));

      expect(result.id).toBe(experienceId);
      expect(result.slug).toBe('fpt-software-senior-frontend-engineer');
      // Admin-only fields must not be present
      expect((result as Record<string, unknown>).createdAt).toBeUndefined();
      expect((result as Record<string, unknown>).clientName).toBeUndefined();
      expect((result as Record<string, unknown>).locationAddress1).toBeUndefined();
    });

    it('should throw NotFoundError when slug does not exist', async () => {
      repo.findBySlug.mockResolvedValue(null);

      await expect(handler.execute(new GetExperienceBySlugQuery('nonexistent'))).rejects.toMatchObject({
        statusCode: 404,
        errorCode: 'EXPERIENCE_NOT_FOUND',
      });
    });
  });

  // --- ListPublicExperiences ---

  describe('ListPublicExperiencesHandler', () => {
    let handler: ListPublicExperiencesHandler;
    beforeEach(() => (handler = new ListPublicExperiencesHandler(repo, skillRepo, mediaRepo)));

    it('should return sorted public array (non-deleted only)', async () => {
      const exp1 = loadExperience({ id: experienceId, displayOrder: 1, startDate: new Date('2022-01-01') });
      const exp2 = loadExperience({
        id: '550e8400-e29b-41d4-a716-446655440099',
        displayOrder: 2,
        startDate: new Date('2020-01-01'),
      });
      repo.findAllPublic.mockResolvedValue([exp1, exp2]);

      const result = await handler.execute(new ListPublicExperiencesQuery());

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(experienceId);
      expect(result[1].id).toBe('550e8400-e29b-41d4-a716-446655440099');
    });

    it('should include skills and companyLogoUrl per entry', async () => {
      const exp = loadExperience({ skillIds: [skillId], companyLogoId: mediaId });
      repo.findAllPublic.mockResolvedValue([exp]);
      skillRepo.findById.mockResolvedValue(loadSkill());
      mediaRepo.findById.mockResolvedValue({ url: 'https://cdn.example.com/logo.png' } as never);

      const result = await handler.execute(new ListPublicExperiencesQuery());

      expect(result[0].skills).toHaveLength(1);
      expect(result[0].skills[0].id).toBe(skillId);
      expect(result[0].companyLogoUrl).toBe('https://cdn.example.com/logo.png');
    });
  });
});
