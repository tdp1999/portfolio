import {
  DescriptionLongSchema,
  DescriptionShortSchema,
  NameSchema,
  TagNameSchema,
  TitleSchema,
  optionalShortText,
  requiredShortText,
} from './zod-atoms';

// AC-18 · 'P10 Trim' (SR-006) and the EP + BVA table of the medicine cabinet epic. Owner-approved review
// points 1 and 2 of the slice 1 Approach: every string atom runs trim, then NFC, then min and max, then
// strips HTML tags.

const NFD_E_DOT_CIRCUMFLEX = 'ệ'; // "ệ" written as three code points
const NFC_E_DOT_CIRCUMFLEX = 'ệ'; // "ệ" as one code point

const REQUIRED_ATOMS = {
  TitleSchema,
  NameSchema,
  TagNameSchema,
  DescriptionShortSchema,
  DescriptionLongSchema,
  'requiredShortText()': requiredShortText(),
};

describe('zod atoms', () => {
  describe('P10: trim runs before min', () => {
    it.each(Object.entries(REQUIRED_ATOMS))('%s rejects a value of only spaces', (_name, schema) => {
      expect(schema.safeParse('   ').success).toBe(false);
    });

    it('requiredShortText rejects an empty string', () => {
      expect(requiredShortText(50).safeParse('').success).toBe(false);
    });
  });

  describe('P10: trim runs before max', () => {
    it('requiredShortText(5) accepts five characters surrounded by spaces, trimmed', () => {
      const result = requiredShortText(5).safeParse('  abcde  ');
      expect(result).toEqual({ success: true, data: 'abcde' });
    });

    it('optionalShortText(5) accepts five characters surrounded by spaces, trimmed', () => {
      const result = optionalShortText(5).safeParse('  abcde  ');
      expect(result).toEqual({ success: true, data: 'abcde' });
    });

    it('requiredShortText(5) still rejects six characters after trimming', () => {
      expect(requiredShortText(5).safeParse('  abcdef  ').success).toBe(false);
    });
  });

  describe('BVA: NFC runs before the length is counted', () => {
    it('requiredShortText(1) accepts "ệ" written in NFD and returns it in NFC', () => {
      const result = requiredShortText(1).safeParse(NFD_E_DOT_CIRCUMFLEX);
      expect(result).toEqual({ success: true, data: NFC_E_DOT_CIRCUMFLEX });
    });

    it('optionalShortText(1) accepts "ệ" written in NFD and returns it in NFC', () => {
      const result = optionalShortText(1).safeParse(NFD_E_DOT_CIRCUMFLEX);
      expect(result).toEqual({ success: true, data: NFC_E_DOT_CIRCUMFLEX });
    });

    it('requiredShortText(50) accepts a 50-character name written in NFD', () => {
      const result = requiredShortText(50).safeParse(NFD_E_DOT_CIRCUMFLEX.repeat(50));
      expect(result.success).toBe(true);
    });

    it('requiredShortText(50) rejects a 51-character name written in NFD', () => {
      expect(requiredShortText(50).safeParse(NFD_E_DOT_CIRCUMFLEX.repeat(51)).success).toBe(false);
    });
  });

  describe('existing behaviour kept', () => {
    it('strips HTML tags after trimming', () => {
      expect(requiredShortText(50).safeParse(' <b>React</b> ')).toEqual({ success: true, data: 'React' });
    });

    it('optionalShortText accepts an empty string', () => {
      expect(optionalShortText(50).safeParse('')).toEqual({ success: true, data: '' });
    });
  });
});
