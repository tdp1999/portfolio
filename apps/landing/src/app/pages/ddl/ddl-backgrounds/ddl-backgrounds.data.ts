import type { PatternEntry } from './ddl-backgrounds.types';

export const PATTERNS: readonly PatternEntry[] = [
  {
    id: 'blueprint',
    label: 'BLUEPRINT',
    hint: 'Perspective grid floor receding to a vanishing point.',
    useCase:
      'Hero section for the engineering / systems-builder identity. The receding floor reads as "infrastructure, foundations, planning" — supports a type-led hero that names the engineer above the schematic.',
    bestFor: ['Home hero', 'Project case-study openers', 'Colophon "stack" intro'],
    avoidFor: ['Long-form reading sections', 'Card grids (competes with card borders)'],
    sampleHeadline: 'Phuong Tran — Frontend Engineer.',
    sampleTagline: 'Four years shipping fintech tools for the Singapore market.',
  },
  {
    id: 'topo',
    label: 'TOPO',
    hint: 'Concentric ring contour map; two off-centre sources read like elevation.',
    useCase:
      'About / bio sections, or transitions between long-form chapters. The off-centre rings imply "depth, story, terrain" — pairs well with editorial Newsreader display and a quoted pull-line.',
    bestFor: ['About / 90s story', 'Section dividers between case studies', 'Pull-quote backdrops'],
    avoidFor: ['Hero (too soft, not enough structure)', 'Dense data sections'],
    sampleHeadline: 'The work, and the rails behind it.',
    sampleTagline: 'A 90-second story about how five years of fintech turned into a way of working.',
  },
  {
    id: 'hatch',
    label: 'HATCH',
    hint: 'Diagonal pencil hatching, faded top + bottom.',
    useCase:
      'Editorial draftsman feel. Use for "process / craft / sketch" sections — colophon, uses, the "how I work" bands. The hatching softens a section without competing with body type.',
    bestFor: ['Colophon body', '/uses page', 'Section under a pull-quote', 'Footer band'],
    avoidFor: ['Hero (visual weight too even, no focal point)', 'Card grids'],
    sampleHeadline: 'Tools, editor, and the sharp pencils.',
    sampleTagline: 'The actual machine the work gets made on. Versioned, dated, opinionated.',
  },
  {
    id: 'dots',
    label: 'DOT_MATRIX',
    hint: 'Dots at grid intersections, vignette mask. Star-field or measurement-paper.',
    useCase:
      'Data-leaning sections — projects index, timeline, anything that reads like a table or measurement. The dot grid implies precision without the heaviness of a full grid.',
    bestFor: ['Projects index header', 'Timeline / experience', 'Stats panels', 'Skills matrix'],
    avoidFor: ['Long reading prose (eye sees the dots)', 'Heroes asking for emotional weight'],
    sampleHeadline: 'Selected work · 2021 — 2026.',
    sampleTagline: 'Sixteen shipped projects. Three matter; three are linked here.',
  },
  {
    id: 'crosshair',
    label: 'CROSSHAIR',
    hint: 'Radar sweep + concentric rings anchored to one corner.',
    useCase:
      'CTA / contact sections. The "aim" of the radar pulls the eye to the message that asks the reader to act. Pair with one bold call-to-action and a single supporting line.',
    bestFor: ['Contact / get-in-touch', 'Newsletter band', 'Bottom-of-page CTA', '404 page'],
    avoidFor: ['Heroes (too directional, distracts from name)', 'Long-form body'],
    sampleHeadline: 'Get in touch.',
    sampleTagline: 'Open to frontend roles. Singapore market preferred.',
  },
];
