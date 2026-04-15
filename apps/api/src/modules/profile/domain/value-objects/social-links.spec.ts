import { SocialLinks } from './social-links';

describe('SocialLinks VO', () => {
  describe('create() — validation guards', () => {
    it('should accept empty arrays (no links to validate)', () => {
      expect(() => SocialLinks.create({ socialLinks: [], resumeUrls: {}, certifications: [] })).not.toThrow();
    });

    it('should reject a social link with empty url', () => {
      expect(() =>
        SocialLinks.create({
          socialLinks: [{ platform: 'GITHUB', url: '' }],
          resumeUrls: {},
          certifications: [],
        })
      ).toThrow('Social link for GITHUB must have a url');
    });

    it('should reject a social link with whitespace-only url', () => {
      expect(() =>
        SocialLinks.create({
          socialLinks: [{ platform: 'TWITTER', url: '   ' }],
          resumeUrls: {},
          certifications: [],
        })
      ).toThrow('Social link for TWITTER must have a url');
    });
  });

  describe('immutability', () => {
    it('should be frozen', () => {
      expect(Object.isFrozen(SocialLinks.create({ socialLinks: [], resumeUrls: {}, certifications: [] }))).toBe(true);
    });
  });
});
