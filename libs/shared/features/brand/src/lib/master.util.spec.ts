import { TDP_BRAND } from './brand.config';
import { DOT, MONOGRAM_VIEWBOX, WORDMARK_DOT, WORDMARK_VIEWBOX } from './glyph-outlines.data';
import { masterSvg, monogramSvg, motifSvg, MOTIF, signatureSvg, wordmarkSvg } from './master.util';

const DEFAULT_INK = '#0a0d12';
const ACCENT = TDP_BRAND.theme.accent;

/** Extract the outer (first) `viewBox="..."` from an SVG string. */
function outerViewBox(svg: string): { x: number; y: number; w: number; h: number } {
  const match = svg.match(/viewBox="([^"]+)"/);
  if (!match) throw new Error('no viewBox');
  const [x, y, w, h] = match[1].split(/\s+/).map(Number);
  return { x, y, w, h };
}

/** Fill of the `<circle …/>` (the Dot) in a mark SVG. */
function dotFill(svg: string): string | null {
  return svg.match(/<circle[^>]*fill="([^"]+)"/)?.[1] ?? null;
}

describe('master.util — Monogram', () => {
  it('renders an svg with the Dot and the glyph group', () => {
    const svg = monogramSvg();
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('<circle');
    expect(svg).toContain('<g fill=');
    expect(svg).toContain(`cx="${DOT.cx}"`);
    expect(svg).toContain(`r="${DOT.r}"`);
  });

  it('variant "full" colours the Dot with the accent', () => {
    expect(dotFill(monogramSvg({ variant: 'full', accent: ACCENT }))).toBe(ACCENT);
  });

  it('variants "mono" and "knockout" colour the Dot with the ink', () => {
    expect(dotFill(monogramSvg({ variant: 'mono', ink: DEFAULT_INK }))).toBe(DEFAULT_INK);
    expect(dotFill(monogramSvg({ variant: 'knockout', ink: DEFAULT_INK }))).toBe(DEFAULT_INK);
  });

  it('defaults ink + accent from TDP_BRAND when unset', () => {
    const svg = monogramSvg();
    expect(svg).toContain(`<g fill="${DEFAULT_INK}">`);
    expect(dotFill(svg)).toBe(ACCENT);
  });

  it('padding grows the viewBox outward on every side', () => {
    const [x, y, w, h] = MONOGRAM_VIEWBOX.split(/\s+/).map(Number);
    const pad = 20;
    const vb = outerViewBox(monogramSvg({ padding: pad }));
    expect(vb.x).toBe(x - pad);
    expect(vb.y).toBe(y - pad);
    expect(vb.w).toBe(w + pad * 2);
    expect(vb.h).toBe(h + pad * 2);
  });

  it('omits the background rect when background is null/unset, emits it when set', () => {
    expect(monogramSvg()).not.toContain('<rect');
    expect(monogramSvg({ background: '#101418' })).toContain('<rect');
    expect(monogramSvg({ background: '#101418' })).toContain('fill="#101418"');
  });
});

describe('master.util — Wordmark', () => {
  it('closes with the accent Dot at the wordmark Dot coordinates', () => {
    const svg = wordmarkSvg({ variant: 'full', accent: ACCENT });
    expect(svg).toContain(`cx="${WORDMARK_DOT.cx}"`);
    expect(dotFill(svg)).toBe(ACCENT);
  });

  it('uses the wordmark viewBox', () => {
    const [x, y, w, h] = WORDMARK_VIEWBOX.split(/\s+/).map(Number);
    const vb = outerViewBox(wordmarkSvg());
    expect([vb.x, vb.y, vb.w, vb.h]).toEqual([x, y, w, h]);
  });
});

describe('master.util — Signature', () => {
  it('horizontal layout is wider than tall', () => {
    const vb = outerViewBox(signatureSvg({ layout: 'horizontal' }));
    expect(vb.w).toBeGreaterThan(vb.h);
  });

  it('stacked layout is taller than the horizontal one', () => {
    const horizontal = outerViewBox(signatureSvg({ layout: 'horizontal' }));
    const stacked = outerViewBox(signatureSvg({ layout: 'stacked' }));
    expect(stacked.h).toBeGreaterThan(horizontal.h);
    expect(stacked.w).toBeLessThan(horizontal.w);
  });

  it('nests two inner marks (monogram + wordmark)', () => {
    const svg = signatureSvg();
    // outer svg + 2 inner svgs
    expect((svg.match(/<svg/g) ?? []).length).toBe(3);
  });

  it('full variant colours both Dots with the accent', () => {
    const svg = signatureSvg({ variant: 'full', accent: ACCENT });
    const circles = svg.match(/<circle[^>]*fill="([^"]+)"/g) ?? [];
    expect(circles.length).toBe(2);
    expect(circles.every((c) => c.includes(ACCENT))).toBe(true);
  });
});

describe('master.util — masterSvg dispatch', () => {
  it('dispatches by mark name', () => {
    expect(masterSvg('monogram')).toBe(monogramSvg());
    expect(masterSvg('wordmark')).toBe(wordmarkSvg());
    expect(masterSvg('signature')).toBe(signatureSvg());
  });

  it('falls back to the monogram for an unknown mark', () => {
    expect(masterSvg('nope' as never)).toBe(monogramSvg());
  });
});

describe('master.util — Motif', () => {
  it('renders a tileable pattern grid at the requested size', () => {
    const svg = motifSvg(200, 120);
    expect(svg).toContain('viewBox="0 0 200 120"');
    expect(svg).toContain('<pattern');
    expect(svg).toContain('url(#brand-motif)');
  });

  it('is lines-only — no <circle> (the Dot must stay the only circle elsewhere)', () => {
    expect(motifSvg(100, 100)).not.toContain('<circle');
  });

  it('defaults cell / stroke / opacity from the MOTIF token', () => {
    const svg = motifSvg(100, 100);
    expect(svg).toContain(`width="${MOTIF.cell}"`);
    expect(svg).toContain(`stroke-width="${MOTIF.stroke}"`);
    expect(svg).toContain(`opacity="${MOTIF.opacity}"`);
  });

  it('recolours the lines with the accent', () => {
    expect(motifSvg(100, 100, { accent: '#ff0000' })).toContain('stroke="#ff0000"');
  });

  it('honours cell / strokeWidth / opacity overrides', () => {
    const svg = motifSvg(100, 100, { cell: 80, strokeWidth: 2, opacity: 0.5 });
    expect(svg).toContain('width="80"');
    expect(svg).toContain('stroke-width="2"');
    expect(svg).toContain('opacity="0.5"');
  });

  it('omits the background rect unless a background is set', () => {
    // line grid always emits a fill rect; background is a *separate* surface rect
    expect(motifSvg(100, 100, { background: '#101418' })).toContain('fill="#101418"');
    expect((motifSvg(100, 100).match(/<rect/g) ?? []).length).toBe(1);
    expect((motifSvg(100, 100, { background: '#101418' }).match(/<rect/g) ?? []).length).toBe(2);
  });
});
