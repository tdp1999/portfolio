import { addHeadingAnchors } from './rte-headings';

describe('addHeadingAnchors', () => {
  it('returns empty for empty input', () => {
    expect(addHeadingAnchors('')).toEqual({ html: '', toc: [] });
  });

  it('adds slugged ids to h2/h3/h4 and collects h2/h3 into the ToC', () => {
    const { html, toc } = addHeadingAnchors('<h2>Getting Started</h2><p>x</p><h3>Sub Section</h3><h4>Note</h4>');
    expect(html).toContain('<h2 id="getting-started">Getting Started</h2>');
    expect(html).toContain('<h3 id="sub-section">Sub Section</h3>');
    expect(html).toContain('<h4 id="note">Note</h4>');
    // h4 gets an id (for in-page links) but is not a ToC entry.
    expect(toc).toEqual([
      { id: 'getting-started', text: 'Getting Started', level: 2 },
      { id: 'sub-section', text: 'Sub Section', level: 3 },
    ]);
  });

  it('dedupes repeated heading slugs', () => {
    const { html, toc } = addHeadingAnchors('<h2>Intro</h2><h2>Intro</h2>');
    expect(html).toContain('id="intro"');
    expect(html).toContain('id="intro-2"');
    expect(toc.map((t) => t.id)).toEqual(['intro', 'intro-2']);
  });

  it('derives slug + ToC text from the heading text, ignoring inline markup', () => {
    const { html, toc } = addHeadingAnchors('<h2>The <strong>Big</strong> Idea</h2>');
    expect(html).toContain('id="the-big-idea"');
    expect(toc[0]).toEqual({ id: 'the-big-idea', text: 'The Big Idea', level: 2 });
  });

  it('leaves a heading that already has an id untouched', () => {
    const { html } = addHeadingAnchors('<h2 id="custom">T</h2>');
    expect(html).toBe('<h2 id="custom">T</h2>');
  });

  it('still slugs a heading carrying a *-id attribute (not a real id=)', () => {
    // `data-image-id` must NOT be mistaken for an existing `id=` — the heading
    // should still get a slug + a ToC entry.
    const { html, toc } = addHeadingAnchors('<h2 data-image-id="5">Overview</h2>');
    expect(html).toContain('id="overview"');
    expect(html).toContain('data-image-id="5"');
    expect(toc).toEqual([{ id: 'overview', text: 'Overview', level: 2 }]);
  });
});
