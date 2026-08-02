import { Project } from '../domain/entities/project.entity';
import { ProjectPresenter } from './project.presenter';
import type { ProjectRelations } from '../infrastructure/mapper/project.mapper';

const USER_ID = '00000000-0000-0000-0000-000000000001';

function createTestProject() {
  return Project.create(
    {
      title: 'My Portfolio',
      oneLiner: { en: 'A showcase site', vi: 'Trang gioi thieu' },
      description: { en: 'Full description', vi: 'Mo ta day du' },
      motivation: { en: 'To learn new tech', vi: 'De hoc cong nghe moi' },
      role: { en: 'Full-stack dev', vi: 'Lap trinh vien' },
      startDate: new Date('2025-01-01'),
      links: [{ label: 'Source', url: 'https://github.com/example', type: 'repo' }],
    },
    USER_ID
  );
}

const TEST_RELATIONS: ProjectRelations = {
  highlights: [
    {
      id: '00000000-0000-0000-0000-000000000010',
      title: null,
      challengeJson: null,
      challengeHtml: null,
      challengeSchemaVersion: 1,
      challengeCanonical: null,
      approachJson: null,
      approachHtml: null,
      approachSchemaVersion: 1,
      approachCanonical: null,
      outcomeJson: null,
      outcomeHtml: null,
      outcomeSchemaVersion: 1,
      outcomeCanonical: null,
      codeUrl: 'https://github.com/pr/1',
      displayOrder: 0,
    },
  ],
  images: [
    {
      id: '00000000-0000-0000-0000-000000000020',
      mediaId: '00000000-0000-0000-0000-000000000030',
      url: 'https://cdn.example.com/screenshot.png',
      filename: 'screenshot.png',
      caption: 'The permissions matrix',
      altText: 'Screenshot',
      displayOrder: 0,
    },
  ],
  skills: [
    { id: '00000000-0000-0000-0000-000000000040', name: 'TypeScript', slug: 'typescript', category: 'TECHNICAL' },
  ],
};

describe('ProjectPresenter', () => {
  describe('toListItem', () => {
    it('should select only list-relevant fields', () => {
      const entity = createTestProject();
      const result = ProjectPresenter.toListItem({
        entity,
        relations: TEST_RELATIONS,
        thumbnailUrl: 'https://cdn.example.com/thumb.png',
      });

      expect(result.slug).toBe(entity.slug);
      expect(result.title).toBe('My Portfolio');
      expect(result.thumbnailUrl).toBe('https://cdn.example.com/thumb.png');
      expect(result.skills).toEqual([{ name: 'TypeScript', slug: 'typescript', category: 'TECHNICAL' }]);
      expect(result.lifecycleStatus).toBe('LIVE');
      expect(result).not.toHaveProperty('description');
      expect(result).not.toHaveProperty('highlights');
    });
  });

  describe('toDetail', () => {
    it('should map nested highlights and images to response shapes', () => {
      const entity = createTestProject();
      const result = ProjectPresenter.toDetail({
        entity,
        relations: TEST_RELATIONS,
        thumbnailUrl: 'https://cdn.example.com/thumb.png',
      });

      expect(result.highlights[0].challengeJson).toBeNull();
      expect(result.highlights[0].challengeCanonical).toBeNull();
      expect(result.highlights[0].codeUrl).toBe('https://github.com/pr/1');
      // The PUBLIC detail DTO deliberately exposes url + alt only — the filename is
      // console-only metadata and must not reach the landing payload.
      expect(result.images[0]).toEqual({ url: 'https://cdn.example.com/screenshot.png', alt: 'Screenshot' });
      expect(result.skills).toEqual([{ name: 'TypeScript', slug: 'typescript', category: 'TECHNICAL' }]);
      expect(result.lifecycleStatus).toBe('LIVE');
    });

    it('should expose the highlight title (null and non-null)', () => {
      const entity = createTestProject();
      const base = { entity, thumbnailUrl: null };

      expect(ProjectPresenter.toDetail({ ...base, relations: TEST_RELATIONS }).highlights[0].title).toBeNull();

      const titled: ProjectRelations = {
        ...TEST_RELATIONS,
        highlights: [{ ...TEST_RELATIONS.highlights[0], title: { en: 'Editor foundation', vi: 'Nền tảng editor' } }],
      };
      expect(ProjectPresenter.toDetail({ ...base, relations: titled }).highlights[0].title).toEqual({
        en: 'Editor foundation',
        vi: 'Nền tảng editor',
      });
    });

    it('should expose body rich fields and links', () => {
      const entity = createTestProject();
      const result = ProjectPresenter.toDetail({
        entity,
        relations: TEST_RELATIONS,
        thumbnailUrl: null,
      });

      expect(result.bodyJson).toBeNull();
      expect(result.bodyCanonical).toBeNull();
      expect(result.links).toEqual([{ label: 'Source', url: 'https://github.com/example', type: 'repo' }]);
    });

    it('should handle empty relations', () => {
      const entity = createTestProject();
      const result = ProjectPresenter.toDetail({
        entity,
        relations: { highlights: [], images: [], skills: [] },
        thumbnailUrl: null,
      });

      expect(result.highlights).toEqual([]);
      expect(result.images).toEqual([]);
      expect(result.skills).toEqual([]);
      expect(result.thumbnailUrl).toBeNull();
    });
  });

  describe('toAdminResponse', () => {
    it('should include audit fields, IDs, and full child objects', () => {
      const entity = createTestProject();
      const result = ProjectPresenter.toAdminResponse({
        entity,
        relations: TEST_RELATIONS,
        thumbnailUrl: null,
      });

      expect(result.id).toBe(entity.id);
      expect(result.status).toBe('DRAFT');
      expect(result.createdById).toBe(USER_ID);
      expect(result.highlights[0].id).toBeDefined();
      expect(result.images[0].mediaId).toBeDefined();
      expect(result.skills[0].id).toBeDefined();
    });

    // The console renders the picked assets by name; without these it can only show
    // the raw media uuid. The media rows are already joined for the url, so carrying
    // the filename through costs no extra query.
    it('names the gallery images and the thumbnail', () => {
      const result = ProjectPresenter.toAdminResponse({
        entity: createTestProject(),
        relations: TEST_RELATIONS,
        thumbnailUrl: 'https://cdn.example.com/thumb.png',
        thumbnailFilename: 'thumb.png',
        thumbnailCaption: 'Cover frame',
        thumbnailAltText: 'Permissions console cover',
      });

      expect(result.thumbnailFilename).toBe('thumb.png');
      expect(result.images[0].filename).toBe('screenshot.png');
    });

    // The console labels a picture with its caption first, so the caption has to
    // survive the admin mapping. It must NOT reach the public DTO — `toDetail`
    // above pins that shape to `{ url, alt }`.
    it('carries the caption and alt text for the console label', () => {
      const result = ProjectPresenter.toAdminResponse({
        entity: createTestProject(),
        relations: TEST_RELATIONS,
        thumbnailUrl: 'https://cdn.example.com/thumb.png',
        thumbnailFilename: 'thumb.png',
        thumbnailCaption: 'Cover frame',
        thumbnailAltText: 'Permissions console cover',
      });

      expect(result.thumbnailCaption).toBe('Cover frame');
      expect(result.thumbnailAltText).toBe('Permissions console cover');
      expect(result.images[0].caption).toBe('The permissions matrix');
    });
  });
});
