import type { DdlVariant } from '../ddl.types';

// Exploring (epic §2b) — no winner yet. Each variant reframes the §06b slot
// (between §6 The Story and §7 Get in Touch) from a third credo restatement
// into a structural beat: pause / sign-off / coda. Shown in a
// Story-tail → variant → CTA-preview sandwich so the transition reads in context.
export const PHILOSOPHY_STRIP_VARIANTS: readonly DdlVariant[] = [
  {
    id: 'v0-current',
    label: 'V0 — current production',
    note: 'bioShort centered 680px — restates credo a third time and has no structural break with §6 above.',
  },
  {
    id: 'v1-cut',
    label: 'V1 — cut clean',
    note: 'Story closes itself, go straight to CTA. Tightest rhythm, nothing to maintain — lowest debt.',
  },
  {
    id: 'v2-ornament',
    label: 'V2 — ornament pause (squiggle)',
    note: 'Hand-drawn indigo wave as the inked analogue of section-rule:lift; echoes §6 active-paragraph underline.',
  },
  {
    id: 'v3-signoff',
    label: 'V3 — sign-off (letter closing)',
    note: 'Right-aligned italic signature + mono datemark; turns the slot into a kết-thư beat. Risk: datemark must feel deliberate.',
  },
  {
    id: 'v4-coda',
    label: 'V4 — coda (pen at rest)',
    note: 'Micro-scene extending §6 inkwell iconography. Most personal; risk of another illustration to maintain across themes.',
  },
  {
    id: 'v5a-seal',
    label: 'V5a — stamped seal (monogram)',
    note: 'Wax-seal "PT" monogram, letterpress tradition. Strongest "this is mine"; risk if lettering reads as clipart.',
  },
  {
    id: 'v5b-datemark',
    label: 'V5b — marginalia datemark',
    note: 'One tiny centered mono line; most editorial, zero visual debt. Pairs best with V1 minimalism.',
  },
  {
    id: 'v5c-fin',
    label: 'V5c — chapter end (fin.)',
    note: 'Oversized italic "fin." — most literal "story ends here". Works only if the Story voice is already literary.',
  },
];
