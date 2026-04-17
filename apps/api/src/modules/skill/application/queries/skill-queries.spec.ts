import { ListSkillsQuery, ListSkillsHandler } from './list-skills.query';
import { GetSkillByIdQuery, GetSkillByIdHandler } from './get-skill-by-id.query';
import { GetSkillBySlugQuery, GetSkillBySlugHandler } from './get-skill-by-slug.query';
import { GetSkillChildrenQuery, GetSkillChildrenHandler } from './get-skill-children.query';
import { ISkillRepository } from '../ports/skill.repository.port';
import { Skill } from '../../domain/entities/skill.entity';
import { ISkillProps } from '../../domain/skill.types';

describe('Skill Queries', () => {
  let repo: jest.Mocked<ISkillRepository>;

  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const skillId = '550e8400-e29b-41d4-a716-446655440001';

  const baseProps: ISkillProps = {
    id: skillId,
    name: 'TypeScript',
    slug: 'typescript',
    description: null,
    category: 'TECHNICAL',
    isLibrary: false,
    parentSkillId: null,
    yearsOfExperience: null,
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

  const loadSkill = (overrides: Partial<ISkillProps> = {}) => Skill.load({ ...baseProps, ...overrides });

  beforeEach(() => {
    repo = {
      add: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findByName: jest.fn(),
      findByCategory: jest.fn(),
      findChildren: jest.fn(),
      findAllNoLimit: jest.fn(),
      hasChildren: jest.fn(),
      findAll: jest.fn(),
    };
  });

  describe('ListSkillsHandler', () => {
    let handler: ListSkillsHandler;
    beforeEach(() => (handler = new ListSkillsHandler(repo)));

    it('should return paginated skills with filters passed through', async () => {
      repo.findAll.mockResolvedValue({ data: [loadSkill()], total: 1 });

      const result = await handler.execute(new ListSkillsQuery({ category: 'TECHNICAL', isLibrary: false }));

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(repo.findAll).toHaveBeenCalledWith(expect.objectContaining({ category: 'TECHNICAL', isLibrary: false }));
    });
  });

  describe('GetSkillByIdHandler', () => {
    let handler: GetSkillByIdHandler;
    beforeEach(() => (handler = new GetSkillByIdHandler(repo)));

    it('should return skill response', async () => {
      repo.findById.mockResolvedValue(loadSkill());

      const result = await handler.execute(new GetSkillByIdQuery(skillId));

      expect(result.id).toBe(skillId);
      expect(result.name).toBe('TypeScript');
    });

    it('should throw NotFound when skill does not exist', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(handler.execute(new GetSkillByIdQuery(skillId))).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('GetSkillBySlugHandler', () => {
    let handler: GetSkillBySlugHandler;
    beforeEach(() => (handler = new GetSkillBySlugHandler(repo)));

    it('should return skill by slug', async () => {
      repo.findBySlug.mockResolvedValue(loadSkill());

      const result = await handler.execute(new GetSkillBySlugQuery('typescript'));

      expect(result.slug).toBe('typescript');
    });

    it('should throw NotFound when slug not found', async () => {
      repo.findBySlug.mockResolvedValue(null);

      await expect(handler.execute(new GetSkillBySlugQuery('nonexistent'))).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('GetSkillChildrenHandler', () => {
    let handler: GetSkillChildrenHandler;
    beforeEach(() => (handler = new GetSkillChildrenHandler(repo)));

    it('should return children of a parent skill', async () => {
      repo.findById.mockResolvedValue(loadSkill());
      repo.findChildren.mockResolvedValue([loadSkill({ id: 'child-1', name: 'React', parentSkillId: skillId })]);

      const result = await handler.execute(new GetSkillChildrenQuery(skillId));

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('React');
    });

    it('should throw NotFound when parent does not exist', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(handler.execute(new GetSkillChildrenQuery(skillId))).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});
