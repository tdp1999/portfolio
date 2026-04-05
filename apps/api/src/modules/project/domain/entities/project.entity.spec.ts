import { Project } from './project.entity';
import { ICreateProjectPayload } from '../project.types';

const VALID_PAYLOAD: ICreateProjectPayload = {
  title: 'My Portfolio',
  oneLiner: { en: 'A showcase site', vi: 'Trang gioi thieu' },
  description: { en: 'Full description', vi: 'Mo ta day du' },
  motivation: { en: 'To learn new tech', vi: 'De hoc cong nghe moi' },
  role: { en: 'Full-stack developer', vi: 'Lap trinh vien full-stack' },
  startDate: new Date('2025-01-01'),
};

const USER_ID = '00000000-0000-0000-0000-000000000001';

describe('Project Entity', () => {
  describe('create', () => {
    it('should generate ID, audit fields, slug, and apply business defaults', () => {
      const project = Project.create(VALID_PAYLOAD, USER_ID);

      expect(project.id).toBeDefined();
      expect(project.slug).toBe('my-portfolio');
      expect(project.status).toBe('DRAFT');
      expect(project.featured).toBe(false);
      expect(project.displayOrder).toBe(0);
      expect(project.createdById).toBe(USER_ID);
      expect(project.updatedById).toBe(USER_ID);
      expect(project.deletedAt).toBeNull();
    });
  });

  describe('update', () => {
    it('should regenerate slug when title changes', () => {
      const project = Project.create(VALID_PAYLOAD, USER_ID);
      const updateUserId = '00000000-0000-0000-0000-000000000099';

      const updated = project.update({ title: 'New Title' }, updateUserId);

      expect(updated.title).toBe('New Title');
      expect(updated.slug).toBe('new-title');
      expect(updated.updatedById).toBe(updateUserId);
    });

    it('should preserve slug when title is not changed', () => {
      const project = Project.create(VALID_PAYLOAD, USER_ID);
      const originalSlug = project.slug;

      const updated = project.update({ featured: true }, USER_ID);

      expect(updated.slug).toBe(originalSlug);
    });

    it('should clear nullable fields via !== undefined pattern', () => {
      const project = Project.create(
        { ...VALID_PAYLOAD, sourceUrl: 'https://github.com/example', projectUrl: 'https://example.com' },
        USER_ID
      );

      const updated = project.update({ sourceUrl: null, projectUrl: null }, USER_ID);

      expect(updated.sourceUrl).toBeNull();
      expect(updated.projectUrl).toBeNull();
    });
  });

  describe('softDelete / restore', () => {
    it('should soft delete a project', () => {
      const project = Project.create(VALID_PAYLOAD, USER_ID);
      const deleteUserId = '00000000-0000-0000-0000-000000000099';

      const deleted = project.softDelete(deleteUserId);

      expect(deleted.deletedAt).toBeInstanceOf(Date);
      expect(deleted.deletedById).toBe(deleteUserId);
      expect(deleted.isDeleted).toBe(true);
    });

    it('should restore a soft-deleted project', () => {
      const project = Project.create(VALID_PAYLOAD, USER_ID);
      const deleted = project.softDelete(USER_ID);

      const restored = deleted.restore(USER_ID);

      expect(restored.deletedAt).toBeNull();
      expect(restored.isDeleted).toBe(false);
    });
  });

  describe('toggleFeatured', () => {
    it('should flip featured flag and update audit fields', () => {
      const project = Project.create(VALID_PAYLOAD, USER_ID);
      expect(project.featured).toBe(false);

      const toggled = project.toggleFeatured(USER_ID);
      expect(toggled.featured).toBe(true);
      expect(toggled.updatedById).toBe(USER_ID);
      expect(toggled.updatedAt).toBeInstanceOf(Date);

      const toggledBack = toggled.toggleFeatured(USER_ID);
      expect(toggledBack.featured).toBe(false);
    });
  });

  describe('isPublished', () => {
    it('should return true when PUBLISHED and not deleted', () => {
      const project = Project.create(VALID_PAYLOAD, USER_ID);
      const published = project.update({ status: 'PUBLISHED' }, USER_ID);

      expect(published.isPublished).toBe(true);
    });

    it('should return false when DRAFT', () => {
      const project = Project.create(VALID_PAYLOAD, USER_ID);

      expect(project.isPublished).toBe(false);
    });

    it('should return false when deleted even if PUBLISHED', () => {
      const project = Project.create(VALID_PAYLOAD, USER_ID);
      const published = project.update({ status: 'PUBLISHED' }, USER_ID);
      const deleted = published.softDelete(USER_ID);

      expect(deleted.isPublished).toBe(false);
    });
  });
});
