import { CreateExperienceCommand, CreateExperienceHandler } from './create-experience.handler';
import { UpdateExperienceCommand, UpdateExperienceHandler } from './update-experience.handler';
import { DeleteExperienceCommand, DeleteExperienceHandler } from './delete-experience.handler';
import { RestoreExperienceCommand, RestoreExperienceHandler } from './restore-experience.handler';
import { ReorderExperiencesCommand, ReorderExperiencesHandler } from './reorder-experiences.handler';
import { IExperienceRepository } from '../ports/experience.repository.port';
import { ISkillRepository } from '../../../skill/application/ports/skill.repository.port';
import { IMediaRepository } from '../../../media/application/ports/media.repository.port';
import { Experience } from '../../domain/entities/experience.entity';
import { Skill } from '../../../skill/domain/entities/skill.entity';
import { Media } from '../../../media/domain/entities/media.entity';
import { IExperienceProps } from '../../domain/experience.types';

describe('Experience Commands', () => {
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
    teamSizeMin: null,
    teamSizeMax: null,
    startDate: new Date('2022-01-01'),
    endDate: null,
    displayOrder: 0,
    skillIds: [],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    createdById: userId,
    updatedById: userId,
    deletedAt: null,
    deletedById: null,
  };

  const loadExperience = (overrides: Partial<IExperienceProps> = {}) => Experience.load({ ...baseProps, ...overrides });

  const validCreateDto = {
    companyName: 'FPT Software',
    position: { en: 'Senior Frontend Engineer', vi: 'Kỹ sư Frontend cấp cao' },
    locationCountry: 'VN',
    startDate: '2022-01-01',
    employmentType: 'FULL_TIME',
    locationType: 'ONSITE',
  };

  beforeEach(() => {
    repo = {
      add: jest.fn().mockResolvedValue(experienceId),
      update: jest.fn(),
      remove: jest.fn(),
      restore: jest.fn(),
      findById: jest.fn(),
      findByIdIncludeDeleted: jest.fn(),
      findBySlug: jest.fn(),
      findAll: jest.fn(),
      findAllPublic: jest.fn(),
      slugExists: jest.fn().mockResolvedValue(false),
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

  // --- Create ---

  describe('CreateExperienceHandler', () => {
    let handler: CreateExperienceHandler;
    beforeEach(() => (handler = new CreateExperienceHandler(repo, skillRepo, mediaRepo)));

    it('should create experience and return ID', async () => {
      const result = await handler.execute(new CreateExperienceCommand(validCreateDto, userId));

      expect(result).toBe(experienceId);
      expect(repo.add).toHaveBeenCalled();
    });

    it('should append numeric suffix when base slug is taken', async () => {
      repo.slugExists
        .mockResolvedValueOnce(true) // base slug taken
        .mockResolvedValueOnce(false); // slug-2 is free

      await handler.execute(new CreateExperienceCommand(validCreateDto, userId));

      const [addedEntity] = (repo.add as jest.Mock).mock.calls[0];
      expect(addedEntity.slug).toMatch(/-2$/);
    });

    it('should throw ValidationError for invalid skillIds', async () => {
      skillRepo.findById.mockResolvedValue(null);

      await expect(
        handler.execute(new CreateExperienceCommand({ ...validCreateDto, skillIds: [skillId] }, userId))
      ).rejects.toMatchObject({ statusCode: 400, errorCode: 'EXPERIENCE_INVALID_INPUT' });
    });

    it('should throw NotFoundError for invalid companyLogoId', async () => {
      mediaRepo.findById.mockResolvedValue(null);

      await expect(
        handler.execute(new CreateExperienceCommand({ ...validCreateDto, companyLogoId: mediaId }, userId))
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // --- Update ---

  describe('UpdateExperienceHandler', () => {
    let handler: UpdateExperienceHandler;
    beforeEach(() => (handler = new UpdateExperienceHandler(repo, skillRepo, mediaRepo)));

    it('should update experience without changing slug', async () => {
      const experience = loadExperience();
      repo.findById.mockResolvedValue(experience);

      await handler.execute(new UpdateExperienceCommand(experienceId, { companyName: 'New Corp' }, userId));

      const [, updatedEntity] = (repo.update as jest.Mock).mock.calls[0];
      expect(updatedEntity.slug).toBe(experience.slug);
      expect(updatedEntity.companyName).toBe('New Corp');
    });

    it('should throw NotFoundError when experience does not exist', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(
        handler.execute(new UpdateExperienceCommand(experienceId, { companyName: 'X' }, userId))
      ).rejects.toMatchObject({ statusCode: 404, errorCode: 'EXPERIENCE_NOT_FOUND' });
    });
  });

  // --- Delete ---

  describe('DeleteExperienceHandler', () => {
    let handler: DeleteExperienceHandler;
    beforeEach(() => (handler = new DeleteExperienceHandler(repo)));

    it('should soft delete experience', async () => {
      repo.findById.mockResolvedValue(loadExperience());

      await handler.execute(new DeleteExperienceCommand(experienceId, userId));

      const [, deletedEntity] = (repo.remove as jest.Mock).mock.calls[0];
      expect(deletedEntity.isDeleted).toBe(true);
    });

    it('should throw NotFoundError when experience does not exist', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(handler.execute(new DeleteExperienceCommand(experienceId, userId))).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  // --- Restore ---

  describe('RestoreExperienceHandler', () => {
    let handler: RestoreExperienceHandler;
    beforeEach(() => (handler = new RestoreExperienceHandler(repo)));

    it('should restore a deleted experience', async () => {
      repo.findByIdIncludeDeleted.mockResolvedValue(loadExperience({ deletedAt: new Date(), deletedById: userId }));

      await handler.execute(new RestoreExperienceCommand(experienceId, userId));

      const [, restoredEntity] = (repo.restore as jest.Mock).mock.calls[0];
      expect(restoredEntity.deletedAt).toBeNull();
    });

    it('should throw NotFoundError when experience does not exist', async () => {
      repo.findByIdIncludeDeleted.mockResolvedValue(null);

      await expect(handler.execute(new RestoreExperienceCommand(experienceId, userId))).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('should throw BadRequestError when experience is not deleted', async () => {
      repo.findByIdIncludeDeleted.mockResolvedValue(loadExperience());

      await expect(handler.execute(new RestoreExperienceCommand(experienceId, userId))).rejects.toMatchObject({
        statusCode: 400,
      });
    });
  });

  // --- Reorder ---

  describe('ReorderExperiencesHandler', () => {
    let handler: ReorderExperiencesHandler;
    beforeEach(() => (handler = new ReorderExperiencesHandler(repo)));

    it('should call reorder with validated items', async () => {
      const items = [
        { id: experienceId, displayOrder: 0 },
        { id: '550e8400-e29b-41d4-a716-446655440099', displayOrder: 1 },
      ];

      await handler.execute(new ReorderExperiencesCommand(items, userId));

      expect(repo.reorder).toHaveBeenCalledWith(items);
    });
  });
});
