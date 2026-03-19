import { CreateSkillCommand, CreateSkillHandler } from './create-skill.command';
import { UpdateSkillCommand, UpdateSkillHandler } from './update-skill.command';
import { DeleteSkillCommand, DeleteSkillHandler } from './delete-skill.command';
import { RestoreSkillCommand, RestoreSkillHandler } from './restore-skill.command';
import { ISkillRepository } from '../ports/skill.repository.port';
import { Skill } from '../../domain/entities/skill.entity';
import { ISkillProps } from '../../domain/skill.types';

describe('Skill Commands', () => {
  let repo: jest.Mocked<ISkillRepository>;

  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const skillId = '550e8400-e29b-41d4-a716-446655440001';
  const parentId = '550e8400-e29b-41d4-a716-446655440099';

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
      add: jest.fn().mockResolvedValue('new-id'),
      update: jest.fn(),
      remove: jest.fn(),
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findByName: jest.fn(),
      findByCategory: jest.fn(),
      findChildren: jest.fn(),
      hasChildren: jest.fn(),
      findAll: jest.fn(),
    };
  });

  // --- Create ---

  describe('CreateSkillHandler', () => {
    let handler: CreateSkillHandler;
    beforeEach(() => (handler = new CreateSkillHandler(repo)));

    it('should create a skill', async () => {
      repo.findByName.mockResolvedValue(null);

      const result = await handler.execute(new CreateSkillCommand({ name: 'React', category: 'TECHNICAL' }, userId));

      expect(result).toBe('new-id');
      expect(repo.add).toHaveBeenCalled();
    });

    it('should reject duplicate name', async () => {
      repo.findByName.mockResolvedValue(loadSkill());

      await expect(
        handler.execute(new CreateSkillCommand({ name: 'TypeScript', category: 'TECHNICAL' }, userId))
      ).rejects.toMatchObject({ statusCode: 409, errorCode: 'SKILL_NAME_TAKEN' });
    });

    it('should validate parent hierarchy on create', async () => {
      repo.findByName.mockResolvedValue(null);
      repo.findById.mockResolvedValue(loadSkill({ id: parentId, parentSkillId: 'grandparent' }));

      await expect(
        handler.execute(
          new CreateSkillCommand({ name: 'Hooks', category: 'TECHNICAL', parentSkillId: parentId }, userId)
        )
      ).rejects.toMatchObject({ errorCode: 'SKILL_MAX_DEPTH_EXCEEDED' });
    });

    it('should reject deleted parent', async () => {
      repo.findByName.mockResolvedValue(null);
      repo.findById.mockResolvedValue(loadSkill({ id: parentId, deletedAt: new Date(), deletedById: userId }));

      await expect(
        handler.execute(
          new CreateSkillCommand({ name: 'Hooks', category: 'TECHNICAL', parentSkillId: parentId }, userId)
        )
      ).rejects.toMatchObject({ errorCode: 'SKILL_PARENT_DELETED' });
    });
  });

  // --- Update ---

  describe('UpdateSkillHandler', () => {
    let handler: UpdateSkillHandler;
    beforeEach(() => (handler = new UpdateSkillHandler(repo)));

    it('should update a skill', async () => {
      repo.findById.mockResolvedValue(loadSkill());
      repo.findByName.mockResolvedValue(null);

      await handler.execute(new UpdateSkillCommand(skillId, { name: 'JavaScript' }, userId));

      expect(repo.update).toHaveBeenCalled();
    });

    it('should reject name taken by another skill', async () => {
      repo.findById.mockResolvedValue(loadSkill());
      repo.findByName.mockResolvedValue(loadSkill({ id: 'other-id' }));

      await expect(handler.execute(new UpdateSkillCommand(skillId, { name: 'React' }, userId))).rejects.toMatchObject({
        statusCode: 409,
        errorCode: 'SKILL_NAME_TAKEN',
      });
    });

    it('should allow keeping same name', async () => {
      const skill = loadSkill();
      repo.findById.mockResolvedValue(skill);
      repo.findByName.mockResolvedValue(skill);

      await handler.execute(new UpdateSkillCommand(skillId, { name: 'TypeScript' }, userId));

      expect(repo.update).toHaveBeenCalled();
    });

    it('should handle parent reassignment and removal', async () => {
      repo.findById.mockImplementation(async (id) => {
        if (id === skillId) return loadSkill();
        if (id === parentId) return loadSkill({ id: parentId, name: 'Frontend', parentSkillId: null });
        return null;
      });

      await handler.execute(new UpdateSkillCommand(skillId, { parentSkillId: parentId }, userId));
      expect(repo.update).toHaveBeenCalledWith(
        skillId,
        expect.objectContaining({ props: expect.objectContaining({ parentSkillId: parentId }) })
      );

      repo.findById.mockResolvedValue(loadSkill({ parentSkillId: 'old-parent' }));
      await handler.execute(new UpdateSkillCommand(skillId, { parentSkillId: null }, userId));
      expect(repo.update).toHaveBeenCalledWith(
        skillId,
        expect.objectContaining({ props: expect.objectContaining({ parentSkillId: null }) })
      );
    });
  });

  // --- Delete ---

  describe('DeleteSkillHandler', () => {
    let handler: DeleteSkillHandler;
    beforeEach(() => (handler = new DeleteSkillHandler(repo)));

    it('should soft delete a skill', async () => {
      repo.findById.mockResolvedValue(loadSkill());
      repo.hasChildren.mockResolvedValue(false);

      await handler.execute(new DeleteSkillCommand(skillId, userId));

      expect(repo.remove).toHaveBeenCalled();
    });

    it('should reject when skill has children', async () => {
      repo.findById.mockResolvedValue(loadSkill());
      repo.hasChildren.mockResolvedValue(true);

      await expect(handler.execute(new DeleteSkillCommand(skillId, userId))).rejects.toMatchObject({
        statusCode: 400,
        errorCode: 'SKILL_HAS_CHILDREN',
      });
    });

    it('should reject when not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(handler.execute(new DeleteSkillCommand(skillId, userId))).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  // --- Restore ---

  describe('RestoreSkillHandler', () => {
    let handler: RestoreSkillHandler;
    beforeEach(() => (handler = new RestoreSkillHandler(repo)));

    it('should restore a deleted skill', async () => {
      repo.findById.mockResolvedValue(loadSkill({ deletedAt: new Date(), deletedById: userId }));

      await handler.execute(new RestoreSkillCommand(skillId, userId));

      expect(repo.update).toHaveBeenCalledWith(
        skillId,
        expect.objectContaining({ props: expect.objectContaining({ deletedAt: null }) })
      );
    });

    it('should reject restore if parent is deleted', async () => {
      repo.findById.mockImplementation(async (id) => {
        if (id === skillId) return loadSkill({ deletedAt: new Date(), deletedById: userId, parentSkillId: parentId });
        if (id === parentId) return loadSkill({ id: parentId, deletedAt: new Date(), deletedById: userId });
        return null;
      });

      await expect(handler.execute(new RestoreSkillCommand(skillId, userId))).rejects.toMatchObject({
        errorCode: 'SKILL_PARENT_DELETED',
      });
    });
  });
});
