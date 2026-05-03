import { ProjectLink } from './project-link';

describe('ProjectLink VO', () => {
  const validProps = {
    label: 'Source',
    url: 'https://github.com/example',
    type: 'repo' as const,
  };

  describe('create() — validation', () => {
    it('should accept all 5 valid types', () => {
      const types = ['repo', 'demo', 'case-study', 'doc', 'post'] as const;
      for (const type of types) {
        expect(() => ProjectLink.create({ ...validProps, type })).not.toThrow();
      }
    });

    it('should reject empty label', () => {
      expect(() => ProjectLink.create({ ...validProps, label: '' })).toThrow('label is required');
    });

    it('should reject whitespace-only label', () => {
      expect(() => ProjectLink.create({ ...validProps, label: '   ' })).toThrow('label is required');
    });

    it('should trim label', () => {
      const link = ProjectLink.create({ ...validProps, label: '  Source  ' });
      expect(link.label).toBe('Source');
    });

    it('should reject invalid URL', () => {
      expect(() => ProjectLink.create({ ...validProps, url: 'not-a-url' })).toThrow('not a valid URL');
    });

    it('should reject non-http(s) URL', () => {
      expect(() => ProjectLink.create({ ...validProps, url: 'ftp://example.com' })).toThrow('not a valid URL');
    });

    it('should reject unknown type', () => {
      expect(() => ProjectLink.create({ ...validProps, type: 'unknown' as never })).toThrow('type must be one of');
    });
  });

  describe('immutability', () => {
    it('should be frozen', () => {
      expect(Object.isFrozen(ProjectLink.create(validProps))).toBe(true);
    });
  });

  describe('equals', () => {
    it('should return true for same fields', () => {
      const a = ProjectLink.create(validProps);
      const b = ProjectLink.create(validProps);
      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different type', () => {
      const a = ProjectLink.create(validProps);
      const b = ProjectLink.create({ ...validProps, type: 'demo' });
      expect(a.equals(b)).toBe(false);
    });
  });
});
