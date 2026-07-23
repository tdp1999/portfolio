import {
  collectEmptySections,
  countGaps,
  countIncomplete,
  describeFields,
  foldableIds,
  gist,
  hasAnyContent,
  resolveTranslatable,
  translationProgress,
} from './record-view.util';
import type { RecordFieldDescriptor } from './record-view.types';

interface Demo {
  motivation: { en?: string; vi?: string };
  description: { en?: string; vi?: string };
  role: { en?: string; vi?: string };
}

const FIELDS: RecordFieldDescriptor<Demo>[] = [
  { id: 'motivation', label: 'Motivation', read: (d) => d.motivation },
  { id: 'description', label: 'Description', read: (d) => d.description },
  { id: 'role', label: 'Role', read: (d) => d.role },
];

/** EN written, VI missing, description absent in both. */
const PARTIAL: Demo = {
  motivation: { en: 'Written in English', vi: '' },
  description: { en: '', vi: '' },
  role: { en: 'Also English', vi: 'Cũng có tiếng Việt' },
};

describe('resolveTranslatable', () => {
  it('never falls back to the other language', () => {
    // The whole point: the console must be able to say "this is untranslated".
    expect(resolveTranslatable({ en: 'hello', vi: '' }, 'vi')).toEqual({ text: '', state: 'other-locale' });
  });

  it('distinguishes untranslated from absent', () => {
    expect(resolveTranslatable({ en: 'hello' }, 'vi').state).toBe('other-locale');
    expect(resolveTranslatable({ en: '', vi: '' }, 'vi').state).toBe('unset');
    expect(resolveTranslatable(null, 'en').state).toBe('unset');
  });

  it('treats whitespace-only as absent', () => {
    expect(resolveTranslatable({ en: '   ', vi: '' }, 'en').state).toBe('unset');
  });

  it('trims the value it returns', () => {
    expect(resolveTranslatable({ en: '  hi  ' }, 'en').text).toBe('hi');
  });
});

describe('describeFields', () => {
  it('resolves each descriptor in the active locale', () => {
    expect(describeFields(PARTIAL, FIELDS, 'en').map((f) => f.state)).toEqual(['filled', 'unset', 'filled']);
    expect(describeFields(PARTIAL, FIELDS, 'vi').map((f) => f.state)).toEqual(['other-locale', 'unset', 'filled']);
  });

  it('returns nothing for a missing record', () => {
    expect(describeFields(null, FIELDS, 'en')).toEqual([]);
  });
});

describe('countGaps', () => {
  it('counts untranslated and absent alike, because both are still to do', () => {
    expect(countGaps(describeFields(PARTIAL, FIELDS, 'en'))).toBe(1);
    expect(countGaps(describeFields(PARTIAL, FIELDS, 'vi'))).toBe(2);
  });
});

describe('hasAnyContent / foldableIds', () => {
  it('keeps a section alive when content exists in the other language only', () => {
    const viFields = describeFields(PARTIAL, FIELDS, 'vi');
    expect(hasAnyContent(viFields)).toBe(true);
    // The untranslated field is still openable — there is something to show.
    expect(foldableIds(viFields)).toEqual(['motivation', 'role']);
  });

  it('reports no content when every field is absent in both languages', () => {
    const blank: Demo = { motivation: {}, description: {}, role: {} };
    expect(hasAnyContent(describeFields(blank, FIELDS, 'en'))).toBe(false);
  });
});

describe('translationProgress', () => {
  it('counts against fields that exist, not against every declared field', () => {
    // `description` is absent in both languages, so it is not a translation debt.
    expect(translationProgress(PARTIAL, FIELDS, 'en')).toEqual({ written: 2, total: 2 });
    expect(translationProgress(PARTIAL, FIELDS, 'vi')).toEqual({ written: 1, total: 2 });
  });
});

describe('countIncomplete', () => {
  const items = [
    { challenge: 'a', outcome: 'b' },
    { challenge: 'a', outcome: '' },
    { challenge: '', outcome: '' },
  ];

  it('counts members missing at least one required part', () => {
    expect(countIncomplete(items, [(i) => i.challenge, (i) => i.outcome])).toBe(2);
  });

  it('handles empty and nullish collections', () => {
    expect(countIncomplete([], [(i: { a: string }) => i.a])).toBe(0);
    expect(countIncomplete(null, [(i: { a: string }) => i.a])).toBe(0);
  });

  it('treats a bilingual part with neither language as missing', () => {
    const bilingual = [{ body: { en: '', vi: '' } }, { body: { en: 'x' } }];
    expect(countIncomplete(bilingual, [(i) => i.body])).toBe(1);
  });
});

describe('collectEmptySections', () => {
  it('returns the names of absent sections in declaration order', () => {
    expect(
      collectEmptySections([
        { name: 'Story', empty: false },
        { name: 'Media', empty: true },
        { name: 'Links', empty: true },
      ])
    ).toEqual(['Media', 'Links']);
  });
});

describe('gist', () => {
  it('leaves a short line intact', () => {
    expect(gist('short enough')).toBe('short enough');
  });

  it('truncates on a word boundary', () => {
    const result = gist('a'.repeat(50) + ' ' + 'b'.repeat(60), 96);
    expect(result.endsWith('…')).toBe(true);
    expect(result).not.toContain('b');
  });

  it('collapses internal whitespace so a gist stays one line', () => {
    expect(gist('two\n\nlines   here')).toBe('two lines here');
  });
});
