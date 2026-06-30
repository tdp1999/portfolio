// Mock the rich-text barrel with a factory so the real RichTextService — which
// imports the ESM `document-engine-core` — is never loaded into this node-env spec.
jest.mock('../../rich-text', () => ({ RichTextService: class {} }));

import { mapHighlightDtoToInput, mapStoredHighlightToInput, type HighlightDto } from './project-highlight.mapper';
import type { ProjectHighlightDto } from '../infrastructure/mapper/project.mapper';

const EMPTY_LOCALE = { en: '', vi: '' };
const richDoc = { en: { schemaVersion: 3, content: {} }, vi: { schemaVersion: 3, content: {} } };

// Canonicalize result the stub returns for any field given a `*Json` input.
const canonical = { json: richDoc, html: { en: '<p>c</p>', vi: '<p>v</p>' }, schemaVersion: 3 };

function makeRichTextStub() {
  return { toCanonicalFormTranslatable: jest.fn().mockResolvedValue(canonical) } as never;
}

describe('mapHighlightDtoToInput', () => {
  it('runs the RTE pipeline per CAO field and returns the rich triples', async () => {
    const richText = makeRichTextStub();
    const h = {
      challengeJson: richDoc,
      approachJson: richDoc,
      outcomeJson: richDoc,
      codeUrl: 'https://x',
    } as HighlightDto;

    const result = await mapHighlightDtoToInput(richText, h, 2);

    expect((richText as { toCanonicalFormTranslatable: jest.Mock }).toCanonicalFormTranslatable).toHaveBeenCalledTimes(
      3
    );
    expect(result.challengeRich).toEqual(canonical);
    expect(result.approachRich).toEqual(canonical);
    expect(result.outcomeRich).toEqual(canonical);
    // Legacy markdown stays empty during the transition (RTE is the source).
    expect(result.challenge).toEqual(EMPTY_LOCALE);
    expect(result.codeUrl).toBe('https://x');
    expect(result.displayOrder).toBe(2);
  });

  it('leaves rich triples null and skips the pipeline when no *Json is sent', async () => {
    const richText = makeRichTextStub();
    const result = await mapHighlightDtoToInput(richText, {} as HighlightDto, 0);

    expect((richText as { toCanonicalFormTranslatable: jest.Mock }).toCanonicalFormTranslatable).not.toHaveBeenCalled();
    expect(result.challengeRich).toBeNull();
    expect(result.approachRich).toBeNull();
    expect(result.outcomeRich).toBeNull();
    expect(result.codeUrl).toBeNull();
  });
});

describe('mapStoredHighlightToInput', () => {
  const base: ProjectHighlightDto = {
    id: 'h1',
    challenge: { en: 'c', vi: 'c' },
    approach: { en: 'a', vi: 'a' },
    outcome: { en: 'o', vi: 'o' },
    challengeJson: richDoc,
    challengeHtml: { en: '<p>c</p>', vi: '<p>c</p>' },
    challengeSchemaVersion: 3,
    approachJson: null,
    approachHtml: null,
    approachSchemaVersion: 3,
    outcomeJson: richDoc,
    outcomeHtml: null,
    outcomeSchemaVersion: 5,
    codeUrl: null,
    displayOrder: 1,
  };

  it('rebuilds a triple from a stored doc', () => {
    const result = mapStoredHighlightToInput(base, 4);
    expect(result.challengeRich).toEqual({ json: richDoc, html: base.challengeHtml, schemaVersion: 3 });
    expect(result.displayOrder).toBe(4);
  });

  it('returns null for a field without a stored doc', () => {
    expect(mapStoredHighlightToInput(base, 0).approachRich).toBeNull();
  });

  it('falls back to empty html when the stored html is null', () => {
    const result = mapStoredHighlightToInput(base, 0);
    expect(result.outcomeRich).toEqual({ json: richDoc, html: EMPTY_LOCALE, schemaVersion: 5 });
  });
});
