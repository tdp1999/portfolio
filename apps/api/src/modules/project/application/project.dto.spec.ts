import { CreateProjectSchema, UpdateProjectSchema, TechnicalHighlightSchema, ProjectLinkSchema } from './project.dto';

const VALID_CREATE = {
  title: 'My Portfolio',
  oneLiner: { en: 'A showcase', vi: 'Gioi thieu' },
  description: { en: 'Full desc', vi: 'Mo ta' },
  motivation: { en: 'Learn', vi: 'Hoc' },
  role: { en: 'Dev', vi: 'Dev' },
  startDate: '2025-01-01',
};

describe('CreateProjectSchema', () => {
  it('should parse valid input and apply defaults', () => {
    const result = CreateProjectSchema.safeParse(VALID_CREATE);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.featured).toBe(false);
      expect(result.data.displayOrder).toBe(0);
      expect(result.data.skillIds).toEqual([]);
      expect(result.data.imageIds).toEqual([]);
      expect(result.data.highlights).toEqual([]);
      expect(result.data.links).toEqual([]);
    }
  });

  it('should reject missing required field', () => {
    const { title, ...without } = VALID_CREATE;
    expect(CreateProjectSchema.safeParse(without).success).toBe(false);
  });

  it('should reject incomplete translatable field', () => {
    const result = CreateProjectSchema.safeParse({
      ...VALID_CREATE,
      oneLiner: { en: 'Only english' },
    });
    expect(result.success).toBe(false);
  });

  it('should strip HTML from title', () => {
    const result = CreateProjectSchema.safeParse({
      ...VALID_CREATE,
      title: '<script>alert("xss")</script>Portfolio',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).not.toContain('<script>');
    }
  });

  it('should accept up to 4 highlights', () => {
    const highlight = {
      challenge: { en: 'C', vi: 'C' },
      approach: { en: 'A', vi: 'A' },
      outcome: { en: 'O', vi: 'O' },
    };
    expect(CreateProjectSchema.safeParse({ ...VALID_CREATE, highlights: Array(4).fill(highlight) }).success).toBe(true);
  });

  it('should reject more than 4 highlights', () => {
    const highlight = {
      challenge: { en: 'C', vi: 'C' },
      approach: { en: 'A', vi: 'A' },
      outcome: { en: 'O', vi: 'O' },
    };
    expect(CreateProjectSchema.safeParse({ ...VALID_CREATE, highlights: Array(5).fill(highlight) }).success).toBe(
      false
    );
  });
});

describe('TechnicalHighlightSchema', () => {
  it('should parse valid highlight with optional codeUrl', () => {
    const withUrl = TechnicalHighlightSchema.safeParse({
      challenge: { en: 'Problem', vi: 'Van de' },
      approach: { en: 'Solution', vi: 'Giai phap' },
      outcome: { en: 'Result', vi: 'Ket qua' },
      codeUrl: 'https://github.com/pr/1',
    });
    expect(withUrl.success).toBe(true);

    const withoutUrl = TechnicalHighlightSchema.safeParse({
      challenge: { en: 'C', vi: 'C' },
      approach: { en: 'A', vi: 'A' },
      outcome: { en: 'O', vi: 'O' },
    });
    expect(withoutUrl.success).toBe(true);
  });

  it('accepts a rich-text-only highlight (legacy CAO optional during the RTE transition)', () => {
    const doc = { schemaVersion: 1, content: { type: 'doc', content: [] } };
    const richOnly = TechnicalHighlightSchema.safeParse({
      challengeJson: { en: doc, vi: doc },
      approachJson: { en: doc, vi: doc },
      outcomeJson: { en: doc, vi: doc },
    });
    expect(richOnly.success).toBe(true);
  });

  it('rejects a malformed rich-text doc (missing schemaVersion)', () => {
    const bad = TechnicalHighlightSchema.safeParse({
      challengeJson: { en: { content: {} }, vi: { content: {} } },
    });
    expect(bad.success).toBe(false);
  });
});

describe('UpdateProjectSchema', () => {
  it('should accept partial update via nonEmptyPartial', () => {
    expect(UpdateProjectSchema.safeParse({ title: 'Updated' }).success).toBe(true);
  });

  it('should reject empty object', () => {
    expect(UpdateProjectSchema.safeParse({}).success).toBe(false);
  });

  it('should accept body=null to clear case-study body', () => {
    expect(UpdateProjectSchema.safeParse({ body: null }).success).toBe(true);
  });

  it('should accept links array', () => {
    const result = UpdateProjectSchema.safeParse({
      links: [{ label: 'Source', url: 'https://github.com/example', type: 'repo' }],
    });
    expect(result.success).toBe(true);
  });
});

describe('ProjectLinkSchema', () => {
  it('should accept all 5 valid link types', () => {
    const types = ['repo', 'demo', 'case-study', 'doc', 'post'] as const;
    for (const type of types) {
      const result = ProjectLinkSchema.safeParse({ label: 'L', url: 'https://example.com', type });
      expect(result.success).toBe(true);
    }
  });

  it('should reject unknown type', () => {
    const result = ProjectLinkSchema.safeParse({ label: 'L', url: 'https://example.com', type: 'wat' });
    expect(result.success).toBe(false);
  });

  it('should reject empty label', () => {
    const result = ProjectLinkSchema.safeParse({ label: '', url: 'https://example.com', type: 'repo' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid URL', () => {
    const result = ProjectLinkSchema.safeParse({ label: 'L', url: 'not-a-url', type: 'repo' });
    expect(result.success).toBe(false);
  });
});
