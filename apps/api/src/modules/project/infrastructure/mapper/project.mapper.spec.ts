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
  featured: false,
  displayOrder: 0,
  sourceUrl: 'https://github.com/example',
  projectUrl: null,
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
      challenge: { en: 'C2', vi: 'C2' },
      approach: { en: 'A2', vi: 'A2' },
      outcome: { en: 'O2', vi: 'O2' },
      codeUrl: null,
      displayOrder: 1,
    },
    {
      id: '00000000-0000-0000-0000-000000000010',
      projectId: '00000000-0000-0000-0000-000000000001',
      challenge: { en: 'C1', vi: 'C1' },
      approach: { en: 'A1', vi: 'A1' },
      outcome: { en: 'O1', vi: 'O1' },
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
        isLibrary: false,
        parentSkillId: null,
        yearsOfExperience: 5,
        iconUrl: null,
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
  describe('toRelations', () => {
    it('should sort highlights by displayOrder', () => {
      const relations = ProjectMapper.toRelations(RAW_PROJECT);

      expect(relations.highlights).toHaveLength(2);
      expect(relations.highlights[0].codeUrl).toBe('https://github.com/pr/1');
      expect(relations.highlights[1].codeUrl).toBeNull();
    });

    it('should flatten images with media URL and altText', () => {
      const relations = ProjectMapper.toRelations(RAW_PROJECT);

      expect(relations.images).toHaveLength(1);
      expect(relations.images[0].url).toBe('https://cdn.example.com/screenshot.png');
      expect(relations.images[0].altText).toBe('Screenshot');
    });

    it('should flatten skills with name and slug', () => {
      const relations = ProjectMapper.toRelations(RAW_PROJECT);

      expect(relations.skills).toEqual([
        { id: '00000000-0000-0000-0000-000000000040', name: 'TypeScript', slug: 'typescript' },
      ]);
    });
  });
});
