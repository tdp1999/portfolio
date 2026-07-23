import { ProjectMapper, PrismaProjectWithRelations } from './project.mapper';

const RAW_PROJECT: PrismaProjectWithRelations = {
  id: '00000000-0000-0000-0000-000000000001',
  slug: 'my-portfolio',
  title: 'My Portfolio',
  oneLiner: { en: 'A showcase site', vi: 'Trang gioi thieu' },
  description: { en: 'Full description', vi: 'Mo ta day du' },
  motivation: { en: 'To learn', vi: 'De hoc' },
  role: { en: 'Dev', vi: 'Lap trinh vien' },
  startDate: new Date('2025-01-01'),
  endDate: null,
  status: 'DRAFT',
  lifecycleStatus: 'LIVE',
  featured: false,
  displayOrder: 0,
  bodyJson: null,
  bodyHtml: null,
  bodySchemaVersion: 1,
  bodyCanonical: null,
  links: [{ label: 'Source', url: 'https://github.com/example', type: 'repo' }],
  thumbnailId: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  createdById: '00000000-0000-0000-0000-000000000099',
  updatedById: '00000000-0000-0000-0000-000000000099',
  deletedAt: null,
  deletedById: null,
  thumbnail: {
    id: '00000000-0000-0000-0000-000000000050',
    originalFilename: 'thumb.png',
    mimeType: 'image/png',
    publicId: 'thumb123',
    url: 'https://cdn.example.com/thumb.png',
    format: 'png',
    bytes: 512,
    width: 400,
    height: 300,
    altText: 'Thumbnail',
    caption: null,
    folder: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    createdById: '00000000-0000-0000-0000-000000000099',
    updatedById: '00000000-0000-0000-0000-000000000099',
    deletedAt: null,
    deletedById: null,
  },
  highlights: [
    {
      id: '00000000-0000-0000-0000-000000000011',
      projectId: '00000000-0000-0000-0000-000000000001',
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
      codeUrl: null,
      displayOrder: 1,
    },
    {
      id: '00000000-0000-0000-0000-000000000010',
      projectId: '00000000-0000-0000-0000-000000000001',
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
      projectId: '00000000-0000-0000-0000-000000000001',
      mediaId: '00000000-0000-0000-0000-000000000030',
      displayOrder: 0,
      media: {
        id: '00000000-0000-0000-0000-000000000030',
        originalFilename: 'screenshot.png',
        mimeType: 'image/png',
        publicId: 'abc123',
        url: 'https://cdn.example.com/screenshot.png',
        format: 'png',
        bytes: 1024,
        width: 800,
        height: 600,
        altText: 'Screenshot',
        caption: null,
        folder: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        createdById: '00000000-0000-0000-0000-000000000099',
        updatedById: '00000000-0000-0000-0000-000000000099',
        deletedAt: null,
        deletedById: null,
      },
    },
  ],
  skills: [
    {
      projectId: '00000000-0000-0000-0000-000000000001',
      skillId: '00000000-0000-0000-0000-000000000040',
      skill: {
        id: '00000000-0000-0000-0000-000000000040',
        name: 'TypeScript',
        slug: 'typescript',
        description: null,
        category: 'TECHNICAL',
        tier: 'DAILY',
        isLibrary: false,
        parentSkillId: null,
        yearsOfExperience: 5,
        iconId: null,
        proficiencyNote: null,
        isFeatured: true,
        displayOrder: 0,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        createdById: '00000000-0000-0000-0000-000000000099',
        updatedById: '00000000-0000-0000-0000-000000000099',
        deletedAt: null,
        deletedById: null,
      },
    },
  ],
};

describe('ProjectMapper', () => {
  describe('toDomain', () => {
    it('should map links from raw row', () => {
      const entity = ProjectMapper.toDomain(RAW_PROJECT);

      expect(entity.links).toEqual([{ label: 'Source', url: 'https://github.com/example', type: 'repo' }]);
    });

    it('should default links to [] when raw is not an array', () => {
      const entity = ProjectMapper.toDomain({ ...RAW_PROJECT, links: null as unknown as never });
      expect(entity.links).toEqual([]);
    });

    it('should drop links with unknown type', () => {
      const entity = ProjectMapper.toDomain({
        ...RAW_PROJECT,
        links: [
          { label: 'OK', url: 'https://example.com', type: 'repo' },
          { label: 'Bad', url: 'https://example.com', type: 'unknown' },
        ] as unknown as never,
      });
      expect(entity.links).toHaveLength(1);
      expect(entity.links[0].label).toBe('OK');
    });
  });

  describe('toRelations', () => {
    it('should sort highlights by displayOrder', () => {
      const relations = ProjectMapper.toRelations(RAW_PROJECT);

      expect(relations.highlights).toHaveLength(2);
      expect(relations.highlights[0].codeUrl).toBe('https://github.com/pr/1');
      expect(relations.highlights[1].codeUrl).toBeNull();
    });

    it('should carry the highlight title through unchanged, and null when absent', () => {
      const titled = { ...RAW_PROJECT.highlights[0], title: { en: 'Editor foundation', vi: 'Nền tảng editor' } };
      const raw: PrismaProjectWithRelations = { ...RAW_PROJECT, highlights: [titled] };

      const { highlights } = ProjectMapper.toRelations(raw);

      expect(highlights[0].title).toEqual({ en: 'Editor foundation', vi: 'Nền tảng editor' });
      expect(ProjectMapper.toRelations(RAW_PROJECT).highlights[0].title).toBeNull();
    });

    it('should flatten images with media URL and altText', () => {
      const relations = ProjectMapper.toRelations(RAW_PROJECT);

      expect(relations.images).toHaveLength(1);
      expect(relations.images[0].url).toBe('https://cdn.example.com/screenshot.png');
      expect(relations.images[0].altText).toBe('Screenshot');
    });

    it('should flatten skills with name, slug, and category', () => {
      const relations = ProjectMapper.toRelations(RAW_PROJECT);

      expect(relations.skills).toEqual([
        { id: '00000000-0000-0000-0000-000000000040', name: 'TypeScript', slug: 'typescript', category: 'TECHNICAL' },
      ]);
    });
  });

  describe('rich-text storage passthrough', () => {
    it('toDomain maps body Json/Html/SchemaVersion onto matching fields (no field swap)', () => {
      const bodyJson = { en: { doc: 'body-json-en' }, vi: { doc: 'body-json-vi' } };
      const bodyHtml = { en: '<p>body-html-en</p>', vi: '<p>body-html-vi</p>' };
      const raw: PrismaProjectWithRelations = { ...RAW_PROJECT, bodyJson, bodyHtml, bodySchemaVersion: 5 };

      const entity = ProjectMapper.toDomain(raw);

      expect(entity.bodyJson).toEqual(bodyJson);
      expect(entity.bodyHtml).toEqual(bodyHtml);
      expect(entity.bodySchemaVersion).toBe(5);
    });

    it('toRelations maps each highlight Json/Html/SchemaVersion onto matching fields (no field swap)', () => {
      const json = (k: string) => ({ en: { doc: `${k}-en` }, vi: { doc: `${k}-vi` } });
      const html = (k: string) => ({ en: `<p>${k}-en</p>`, vi: `<p>${k}-vi</p>` });
      const highlight = {
        ...RAW_PROJECT.highlights[0],
        challengeJson: json('challenge'),
        challengeHtml: html('challenge'),
        challengeSchemaVersion: 2,
        approachJson: json('approach'),
        approachHtml: html('approach'),
        approachSchemaVersion: 3,
        outcomeJson: json('outcome'),
        outcomeHtml: html('outcome'),
        outcomeSchemaVersion: 4,
      };
      const raw: PrismaProjectWithRelations = { ...RAW_PROJECT, highlights: [highlight] };

      const { highlights } = ProjectMapper.toRelations(raw);

      expect(highlights[0].challengeJson).toEqual(json('challenge'));
      expect(highlights[0].challengeHtml).toEqual(html('challenge'));
      expect(highlights[0].challengeSchemaVersion).toBe(2);
      expect(highlights[0].approachJson).toEqual(json('approach'));
      expect(highlights[0].approachHtml).toEqual(html('approach'));
      expect(highlights[0].approachSchemaVersion).toBe(3);
      expect(highlights[0].outcomeJson).toEqual(json('outcome'));
      expect(highlights[0].outcomeHtml).toEqual(html('outcome'));
      expect(highlights[0].outcomeSchemaVersion).toBe(4);
    });
  });
});
