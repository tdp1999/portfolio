import { CreateProjectSchema, UpdateProjectSchema, TechnicalHighlightSchema } from './project.dto';

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

  it('should reject missing CAO fields', () => {
    expect(TechnicalHighlightSchema.safeParse({ challenge: { en: 'C', vi: 'C' } }).success).toBe(false);
  });
});

describe('UpdateProjectSchema', () => {
  it('should accept partial update via nonEmptyPartial', () => {
    expect(UpdateProjectSchema.safeParse({ title: 'Updated' }).success).toBe(true);
  });

  it('should reject empty object', () => {
    expect(UpdateProjectSchema.safeParse({}).success).toBe(false);
  });
});
