import { LandingContentBlocks } from './landing-content-blocks';

describe('LandingContentBlocks VO', () => {
  const tagline = { en: 'Build delightful UIs', vi: 'Xay dung giao dien thu vi' };
  const stackIntro = { en: 'My toolkit', vi: 'Bo cong cu cua toi' };
  const selectedWorkIntro = { en: 'Selected work', vi: 'Cong viec chon loc' };
  const contactIntro = { en: 'Say hello', vi: 'Chao hoi' };
  const footerTagline = { en: 'Made with care', vi: 'Tao ra voi su quan tam' };
  const coreStack: string[] = ['Angular', 'TypeScript'];

  describe('factories', () => {
    it('should create with all blocks set', () => {
      const vo = LandingContentBlocks.create({
        tagline,
        stackIntro,
        selectedWorkIntro,
        contactIntro,
        footerTagline,
        coreStack,
      });

      expect(vo.tagline).toEqual(tagline);
      expect(vo.stackIntro).toEqual(stackIntro);
      expect(vo.selectedWorkIntro).toEqual(selectedWorkIntro);
      expect(vo.contactIntro).toEqual(contactIntro);
      expect(vo.footerTagline).toEqual(footerTagline);
      expect(vo.coreStack).toEqual(coreStack);
    });

    it('should accept all-null blocks', () => {
      const vo = LandingContentBlocks.create({
        tagline: null,
        stackIntro: null,
        selectedWorkIntro: null,
        contactIntro: null,
        footerTagline: null,
        coreStack: [],
      });

      expect(vo.tagline).toBeNull();
      expect(vo.stackIntro).toBeNull();
      expect(vo.selectedWorkIntro).toBeNull();
      expect(vo.contactIntro).toBeNull();
      expect(vo.footerTagline).toBeNull();
      expect(vo.coreStack).toEqual([]);
    });

    it('empty() should produce a VO with all blocks null', () => {
      const vo = LandingContentBlocks.empty();

      expect(vo.tagline).toBeNull();
      expect(vo.stackIntro).toBeNull();
      expect(vo.selectedWorkIntro).toBeNull();
      expect(vo.contactIntro).toBeNull();
      expect(vo.footerTagline).toBeNull();
      expect(vo.coreStack).toEqual([]);
    });
  });

  describe('equals', () => {
    it('should return true when all blocks match', () => {
      const a = LandingContentBlocks.create({
        tagline,
        stackIntro,
        selectedWorkIntro,
        contactIntro,
        footerTagline,
        coreStack,
      });
      const b = LandingContentBlocks.create({
        tagline: { ...tagline },
        stackIntro: { ...stackIntro },
        selectedWorkIntro: { ...selectedWorkIntro },
        contactIntro: { ...contactIntro },
        footerTagline: { ...footerTagline },
        coreStack: [...coreStack],
      });

      expect(a.equals(b)).toBe(true);
    });

    it('should return false when any block differs', () => {
      const a = LandingContentBlocks.create({
        tagline,
        stackIntro,
        selectedWorkIntro,
        contactIntro,
        footerTagline,
        coreStack,
      });
      const b = LandingContentBlocks.create({
        tagline: { en: 'Different', vi: 'Khac' },
        stackIntro,
        selectedWorkIntro,
        contactIntro,
        footerTagline,
        coreStack,
      });

      expect(a.equals(b)).toBe(false);
    });

    it('should return false when one is null and the other is set', () => {
      const a = LandingContentBlocks.create({
        tagline,
        stackIntro: null,
        selectedWorkIntro: null,
        contactIntro: null,
        footerTagline: null,
        coreStack: [],
      });
      const b = LandingContentBlocks.empty();

      expect(a.equals(b)).toBe(false);
    });
  });

  describe('immutability', () => {
    it('should be frozen', () => {
      expect(Object.isFrozen(LandingContentBlocks.empty())).toBe(true);
    });
  });
});
