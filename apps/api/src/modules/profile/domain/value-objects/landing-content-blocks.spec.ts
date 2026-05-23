import { LandingContentBlocks, type LandingContentBlocksProps } from './landing-content-blocks';

describe('LandingContentBlocks VO', () => {
  const tagline = { en: 'Build delightful UIs', vi: 'Xay dung giao dien thu vi' };
  const stackIntro = { en: 'My toolkit', vi: 'Bo cong cu cua toi' };
  const selectedWorkIntro = { en: 'Selected work', vi: 'Cong viec chon loc' };
  const contactIntro = { en: 'Say hello', vi: 'Chao hoi' };
  const footerTagline = { en: 'Made with care', vi: 'Tao ra voi su quan tam' };
  const aboutHeading = { en: 'About — engineering for hiring teams', vi: 'Ve toi' };
  const aboutLede = { en: 'Six years shipping.', vi: 'Sau nam ship.' };
  const ctaHeading = { en: "If this resonated, let's talk", vi: 'Hop gu thi noi chuyen' };
  const ctaLede = { en: 'Pick the door that fits.', vi: 'Chon cua phu hop.' };
  const coreStack: string[] = ['Angular', 'TypeScript'];

  /** All-null props with empty coreStack — keeps test bodies focused on the
   *  one field each test cares about while staying type-complete. */
  const blank = (overrides: Partial<LandingContentBlocksProps> = {}): LandingContentBlocksProps => ({
    tagline: null,
    stackIntro: null,
    selectedWorkIntro: null,
    contactIntro: null,
    footerTagline: null,
    aboutHeading: null,
    aboutLede: null,
    ctaHeading: null,
    ctaLede: null,
    coreStack: [],
    ...overrides,
  });

  describe('factories', () => {
    it('should create with all blocks set', () => {
      const vo = LandingContentBlocks.create({
        tagline,
        stackIntro,
        selectedWorkIntro,
        contactIntro,
        footerTagline,
        aboutHeading,
        aboutLede,
        ctaHeading,
        ctaLede,
        coreStack,
      });

      expect(vo.tagline).toEqual(tagline);
      expect(vo.stackIntro).toEqual(stackIntro);
      expect(vo.selectedWorkIntro).toEqual(selectedWorkIntro);
      expect(vo.contactIntro).toEqual(contactIntro);
      expect(vo.footerTagline).toEqual(footerTagline);
      expect(vo.aboutHeading).toEqual(aboutHeading);
      expect(vo.aboutLede).toEqual(aboutLede);
      expect(vo.ctaHeading).toEqual(ctaHeading);
      expect(vo.ctaLede).toEqual(ctaLede);
      expect(vo.coreStack).toEqual(coreStack);
    });

    it('should accept all-null blocks', () => {
      const vo = LandingContentBlocks.create(blank());

      expect(vo.tagline).toBeNull();
      expect(vo.stackIntro).toBeNull();
      expect(vo.selectedWorkIntro).toBeNull();
      expect(vo.contactIntro).toBeNull();
      expect(vo.footerTagline).toBeNull();
      expect(vo.aboutHeading).toBeNull();
      expect(vo.aboutLede).toBeNull();
      expect(vo.ctaHeading).toBeNull();
      expect(vo.ctaLede).toBeNull();
      expect(vo.coreStack).toEqual([]);
    });

    it('empty() should produce a VO with all blocks null', () => {
      const vo = LandingContentBlocks.empty();

      expect(vo.tagline).toBeNull();
      expect(vo.stackIntro).toBeNull();
      expect(vo.selectedWorkIntro).toBeNull();
      expect(vo.contactIntro).toBeNull();
      expect(vo.footerTagline).toBeNull();
      expect(vo.aboutHeading).toBeNull();
      expect(vo.aboutLede).toBeNull();
      expect(vo.ctaHeading).toBeNull();
      expect(vo.ctaLede).toBeNull();
      expect(vo.coreStack).toEqual([]);
    });
  });

  describe('equals', () => {
    it('should return true when all blocks match', () => {
      const props = blank({
        tagline,
        stackIntro,
        selectedWorkIntro,
        contactIntro,
        footerTagline,
        aboutHeading,
        aboutLede,
        ctaHeading,
        ctaLede,
        coreStack,
      });
      const a = LandingContentBlocks.create(props);
      const b = LandingContentBlocks.create({
        ...props,
        tagline: { ...tagline },
        coreStack: [...coreStack],
      });

      expect(a.equals(b)).toBe(true);
    });

    it('should return false when tagline differs', () => {
      const a = LandingContentBlocks.create(blank({ tagline }));
      const b = LandingContentBlocks.create(blank({ tagline: { en: 'Different', vi: 'Khac' } }));

      expect(a.equals(b)).toBe(false);
    });

    it.each([
      ['aboutHeading', { aboutHeading }],
      ['aboutLede', { aboutLede }],
      ['ctaHeading', { ctaHeading }],
      ['ctaLede', { ctaLede }],
    ] as const)('should return false when %s differs', (_label, overrides) => {
      const a = LandingContentBlocks.create(blank(overrides));
      const b = LandingContentBlocks.create(blank());

      expect(a.equals(b)).toBe(false);
    });

    it('should return false when one is null and the other is set', () => {
      const a = LandingContentBlocks.create(blank({ tagline }));
      const b = LandingContentBlocks.empty();

      expect(a.equals(b)).toBe(false);
    });

    it('should return false when only coreStack length differs', () => {
      const a = LandingContentBlocks.empty();
      const b = LandingContentBlocks.create(blank({ coreStack: ['Angular', 'TypeScript'] }));
      const c = LandingContentBlocks.create(blank({ coreStack: ['Angular', 'TypeScript', 'Material'] }));

      expect(b.equals(c)).toBe(false);
      expect(a.equals(b)).toBe(false);
    });

    it('should return false when coreStack items are reordered (order-sensitive)', () => {
      const a = LandingContentBlocks.create(blank({ coreStack: ['Angular', 'TypeScript'] }));
      const b = LandingContentBlocks.create(blank({ coreStack: ['TypeScript', 'Angular'] }));

      expect(a.equals(b)).toBe(false);
    });
  });

  describe('defensive copy', () => {
    it('create() should not let later input-array mutation leak into the VO', () => {
      const input = ['Angular', 'TypeScript'];
      const vo = LandingContentBlocks.create(blank({ coreStack: input }));

      input.push('Leaked');
      input[0] = 'Mutated';

      expect(vo.coreStack).toEqual(['Angular', 'TypeScript']);
    });

    it('fromPersistence() should not let later input-array mutation leak into the VO', () => {
      const input = ['Angular', 'TypeScript'];
      const vo = LandingContentBlocks.fromPersistence(blank({ coreStack: input }));

      input.push('Leaked');

      expect(vo.coreStack).toEqual(['Angular', 'TypeScript']);
    });

    it('fromPersistence() should coerce a missing coreStack (undefined) to []', () => {
      const vo = LandingContentBlocks.fromPersistence(blank({ coreStack: undefined as unknown as string[] }));

      expect(vo.coreStack).toEqual([]);
    });
  });

  describe('immutability', () => {
    it('should be frozen', () => {
      expect(Object.isFrozen(LandingContentBlocks.empty())).toBe(true);
    });
  });
});
