import { CreateProjectSchema, UpdateProjectSchema, TechnicalHighlightSchema, ProjectLinkSchema } from './project.dto';

const VALID_CREATE = {
  title: 'My Portfolio',
  oneLiner: { en: 'A showcase', vi: 'Gioi thieu' },
  description: { en: 'Full desc', vi: 'Mo ta' },
  motivation: { en: 'Learn', vi: 'Hoc' },
  role: { en: 'Dev', vi: 'Dev' },
  startDate: '2025-01-01',
};

const DOC = { schemaVersion: 1, content: { type: 'doc', content: [] } };
const RICH_HIGHLIGHT = {
  challengeJson: { en: DOC, vi: DOC },
  approachJson: { en: DOC, vi: DOC },
  outcomeJson: { en: DOC, vi: DOC },
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
    expect(CreateProjectSchema.safeParse({ ...VALID_CREATE, highlights: Array(4).fill(RICH_HIGHLIGHT) }).success).toBe(
      true
    );
  });

  it('should reject more than 4 highlights', () => {
    expect(CreateProjectSchema.safeParse({ ...VALID_CREATE, highlights: Array(5).fill(RICH_HIGHLIGHT) }).success).toBe(
      false
    );
  });
});

describe('TechnicalHighlightSchema', () => {
  it('should parse valid rich highlight with optional codeUrl', () => {
    const withUrl = TechnicalHighlightSchema.safeParse({
      ...RICH_HIGHLIGHT,
      codeUrl: 'https://github.com/pr/1',
    });
    expect(withUrl.success).toBe(true);

    const withoutUrl = TechnicalHighlightSchema.safeParse(RICH_HIGHLIGHT);
    expect(withoutUrl.success).toBe(true);
  });

  it('accepts a rich-text highlight built from the `*Json` docs', () => {
    const richOnly = TechnicalHighlightSchema.safeParse(RICH_HIGHLIGHT);
    expect(richOnly.success).toBe(true);
  });

  it('rejects a malformed rich-text doc (missing schemaVersion)', () => {
    const bad = TechnicalHighlightSchema.safeParse({
      challengeJson: { en: { content: {} }, vi: { content: {} } },
    });
    expect(bad.success).toBe(false);
  });

  describe('title', () => {
    it('accepts a bilingual pair and preserves both locales', () => {
      const result = TechnicalHighlightSchema.safeParse({
        ...RICH_HIGHLIGHT,
        title: { en: 'Choosing the editor foundation', vi: 'Lựa chọn nền tảng xây dựng editor' },
      });
      expect(result.success).toBe(true);
      expect(result.data?.title).toEqual({
        en: 'Choosing the editor foundation',
        vi: 'Lựa chọn nền tảng xây dựng editor',
      });
    });

    it('accepts null and omitted (the field is optional)', () => {
      expect(TechnicalHighlightSchema.safeParse({ ...RICH_HIGHLIGHT, title: null }).success).toBe(true);
      expect(TechnicalHighlightSchema.safeParse(RICH_HIGHLIGHT).data?.title).toBeUndefined();
    });

    it('accepts an empty locale (lenient — one-sided titles are allowed)', () => {
      const result = TechnicalHighlightSchema.safeParse({ ...RICH_HIGHLIGHT, title: { en: 'Only EN', vi: '' } });
      expect(result.success).toBe(true);
    });

    it('rejects a locale over 120 characters', () => {
      const result = TechnicalHighlightSchema.safeParse({
        ...RICH_HIGHLIGHT,
        title: { en: 'x'.repeat(121), vi: 'ok' },
      });
      expect(result.success).toBe(false);
    });

    it('rejects a partial pair (both locales are required keys)', () => {
      const result = TechnicalHighlightSchema.safeParse({ ...RICH_HIGHLIGHT, title: { en: 'Only EN' } });
      expect(result.success).toBe(false);
    });
  });
});

describe('UpdateProjectSchema', () => {
  it('should accept partial update via nonEmptyPartial', () => {
    expect(UpdateProjectSchema.safeParse({ title: 'Updated' }).success).toBe(true);
  });

  it('should reject empty object', () => {
    expect(UpdateProjectSchema.safeParse({}).success).toBe(false);
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
