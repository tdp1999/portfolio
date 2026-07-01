import {
  BLOCK_ATTR_SCHEMAS,
  BLOCK_TYPES,
  collectHeadings,
  galleryAttrsSchema,
  headingAttrsSchema,
  imageRefAttrsSchema,
  isSafeContentUrl,
  linkMarkAttrsSchema,
  parseBlockAttrs,
  portableDocumentSchema,
  PORTABLE_SCHEMA_VERSION,
} from './rte.portable';

describe('isSafeContentUrl (D6 link policy)', () => {
  it.each(['https://a.com/x', 'http://a.com', 'mailto:me@a.com', '/projects/foo'])('accepts %s', (url) => {
    expect(isSafeContentUrl(url)).toBe(true);
  });

  it.each([
    'javascript:alert(1)',
    'data:text/html,x',
    'vbscript:msgbox',
    '//evil.com', // protocol-relative — could resolve to any scheme's host
    'not a url',
    '',
  ])('rejects %s', (url) => {
    expect(isSafeContentUrl(url)).toBe(false);
  });

  it('rejects a non-string', () => {
    expect(isSafeContentUrl(undefined as unknown as string)).toBe(false);
  });
});

describe('linkMarkAttrsSchema', () => {
  it('accepts an https href', () => {
    expect(linkMarkAttrsSchema.parse({ href: 'https://a.com' })).toEqual({ href: 'https://a.com' });
  });

  it('rejects a javascript: href (primary security gate)', () => {
    expect(linkMarkAttrsSchema.safeParse({ href: 'javascript:alert(1)' }).success).toBe(false);
  });
});

describe('headingAttrsSchema', () => {
  it.each([2, 3, 4])('accepts level %s', (level) => {
    expect(headingAttrsSchema.parse({ level })).toEqual({ level });
  });

  it.each([1, 5, 0])('rejects level %s', (level) => {
    expect(headingAttrsSchema.safeParse({ level }).success).toBe(false);
  });
});

describe('imageRefAttrsSchema', () => {
  it('requires a non-empty imageId', () => {
    expect(imageRefAttrsSchema.safeParse({}).success).toBe(false);
    expect(imageRefAttrsSchema.safeParse({ imageId: '' }).success).toBe(false);
  });

  it('accepts imageId with optional caption + captionPosition', () => {
    expect(imageRefAttrsSchema.parse({ imageId: 'm1', caption: 'A photo', captionPosition: 'top' })).toEqual({
      imageId: 'm1',
      caption: 'A photo',
      captionPosition: 'top',
    });
  });

  it('rejects an unknown captionPosition', () => {
    expect(imageRefAttrsSchema.safeParse({ imageId: 'm1', captionPosition: 'middle' }).success).toBe(false);
  });
});

describe('galleryAttrsSchema', () => {
  it('requires at least one non-empty imageId', () => {
    expect(galleryAttrsSchema.safeParse({ imageIds: [] }).success).toBe(false);
    expect(galleryAttrsSchema.safeParse({ imageIds: [''] }).success).toBe(false);
    expect(galleryAttrsSchema.safeParse({}).success).toBe(false);
  });

  it('accepts imageIds with optional numbered flag', () => {
    expect(galleryAttrsSchema.parse({ imageIds: ['m1', 'm2'], numbered: false })).toEqual({
      imageIds: ['m1', 'm2'],
      numbered: false,
    });
  });
});

describe('collectHeadings (ToC / scroll anchors)', () => {
  const heading = (level: number, text: string) => ({
    type: 'heading',
    attrs: { level },
    content: [{ type: 'text', text }],
  });

  it('collects h2–h4 in reading order with slugged ids and levels', () => {
    const refs = collectHeadings({
      schemaVersion: 1,
      content: [
        heading(2, 'Getting Started'),
        { type: 'paragraph', content: [{ type: 'text', text: 'x' }] },
        heading(3, 'Sub Section'),
        heading(4, 'A Note'),
      ],
    });
    expect(refs.map((r) => ({ id: r.id, text: r.text, level: r.level }))).toEqual([
      { id: 'getting-started', text: 'Getting Started', level: 2 },
      { id: 'sub-section', text: 'Sub Section', level: 3 },
      { id: 'a-note', text: 'A Note', level: 4 },
    ]);
  });

  it('flattens marks/children when deriving heading text', () => {
    const refs = collectHeadings({
      schemaVersion: 1,
      content: [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'The Big Idea', marks: [{ type: 'bold' }] }],
        },
      ],
    });
    expect(refs[0]).toMatchObject({ id: 'the-big-idea', text: 'The Big Idea' });
  });

  it('dedupes colliding slugs with a numeric suffix', () => {
    const refs = collectHeadings({ schemaVersion: 1, content: [heading(2, 'Intro'), heading(2, 'Intro')] });
    expect(refs.map((r) => r.id)).toEqual(['intro', 'intro-2']);
  });

  it('returns an empty list for a null/empty document', () => {
    expect(collectHeadings(null)).toEqual([]);
    expect(collectHeadings({ schemaVersion: 1, content: [] })).toEqual([]);
  });

  it('exposes the source node so a renderer can map node → id', () => {
    const h = heading(2, 'Overview');
    const refs = collectHeadings({ schemaVersion: 1, content: [h] });
    expect(refs[0].node).toBe(h);
  });
});

describe('parseBlockAttrs', () => {
  it('drops an unknown block type (type whitelist is the gate)', () => {
    expect(parseBlockAttrs('script', {})).toEqual({ ok: false, error: expect.stringContaining('unknown block type') });
  });

  it('returns empty attrs for an attr-less structural block', () => {
    expect(parseBlockAttrs('paragraph', { junk: 1 })).toEqual({ ok: true, attrs: {} });
  });

  it('validates + strips unknown keys for heading', () => {
    expect(parseBlockAttrs('heading', { level: 3, foo: 'bar' })).toEqual({ ok: true, attrs: { level: 3 } });
  });

  it('fails a heading with an invalid level', () => {
    expect(parseBlockAttrs('heading', { level: 1 }).ok).toBe(false);
  });

  it('validates image-ref and fails when imageId is missing', () => {
    expect(parseBlockAttrs('image-ref', { imageId: 'm1' })).toEqual({ ok: true, attrs: { imageId: 'm1' } });
    expect(parseBlockAttrs('image-ref', {}).ok).toBe(false);
  });

  it('keeps BLOCK_ATTR_SCHEMAS in sync with BLOCK_TYPES', () => {
    // Every schema key must be a known block type (no orphan schemas).
    for (const type of Object.keys(BLOCK_ATTR_SCHEMAS)) {
      expect(BLOCK_TYPES as readonly string[]).toContain(type);
    }
  });
});

describe('portableDocumentSchema (envelope)', () => {
  it('accepts a well-formed document', () => {
    const doc = {
      schemaVersion: PORTABLE_SCHEMA_VERSION,
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Title' }] },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'link', marks: [{ type: 'link', attrs: { href: 'https://a.com' } }] }],
        },
      ],
    };
    expect(portableDocumentSchema.safeParse(doc).success).toBe(true);
  });

  it('rejects a negative schemaVersion', () => {
    expect(portableDocumentSchema.safeParse({ schemaVersion: -1, content: [] }).success).toBe(false);
  });

  it('rejects an unknown mark type at the envelope level', () => {
    const doc = {
      schemaVersion: 1,
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'x', marks: [{ type: 'blink' }] }] }],
    };
    expect(portableDocumentSchema.safeParse(doc).success).toBe(false);
  });
});
