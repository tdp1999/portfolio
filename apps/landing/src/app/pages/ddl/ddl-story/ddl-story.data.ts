import type { DdlVariant } from '../ddl.types';
import type { Paragraph } from './ddl-story.types';

// Decision record (exploring) — the four §05 directions, no winner yet. Each
// carries its trade-off as `note`; the verdict block stays in "Exploring" mode.
export const STORY_VARIANTS: readonly DdlVariant[] = [
  {
    id: 'a-manuscript',
    label: 'A — Manuscript · Editorial',
    note: 'Prose IS the design — centered narrow column, drop cap, pull-quote. Reads as a moment of pause, but drops the asymmetry the rest of the page keeps.',
  },
  {
    id: 'b-journal',
    label: "B — Engineer's Journal · Marginalia",
    note: 'Sticky annotations + chip sync make reading feel guided and technical — a workshop, not a magazine. Busiest of the four.',
  },
  {
    id: 'c-spotlight',
    label: 'C — Cinematic Spotlight · Portrait',
    note: 'Highest emotional payoff, most cinematic — but the portrait variant depends on a real B&W / duotone photo asset.',
  },
  {
    id: 'd-artifact',
    label: 'D — Personal Artifact · Letter',
    note: 'Most intimate — dated, signed, grounded by a vertical timeline of shipped work. Reads as a diary entry.',
  },
];

const BIO_LONG = `Frontend engineer, five years in, four of them at Redoc shipping for Singapore-market banking — loan management, SME lending, finance ERP. Daily work is the long tail of features the bank actually runs on; the highlights are larger pieces like a Document Engine replacing CKEditor across loan products, or the permission framework over a hundred sub-modules. *Real problems, real users, good people.*

Outside the day job, the same instinct shows up — a portfolio monorepo with a design system written from scratch, a Claude Code plugin marketplace built for me and my team. The pattern, looking back, is the same: I build *the rails before I build the train*. Patterns down before code. Tests before features. Design system before reaching for Material. Workflow system before tasks.

None of these artifacts are individually remarkable. The interesting thing — *if there is one* — is that they share a way of working.`;

export const JOURNAL_META: readonly string[] = ['2021 – present', 'Redoc · Singapore', 'Frontend · Architecture'];

export const JOURNAL_CHIPS: readonly string[] = [
  'Document Engine',
  'Permission framework',
  'Long tail features',
  'Portfolio monorepo',
  'Claude Code marketplace',
  'Design system from scratch',
  'Way of working',
];

export const TIMELINE_EVENTS: readonly { readonly year: string; readonly label: string }[] = [
  { year: '2020', label: 'First lines of code' },
  { year: '2022', label: 'Document Engine' },
  { year: '2024', label: 'Permission framework' },
  { year: '2025', label: 'Portfolio rewrite' },
  { year: '2026', label: 'Claude Code marketplace' },
];

// Declared before the first parseBioLong() call below — parseBioLong reads it at
// call time, so it must already be initialized (a `const` further down hits the
// temporal dead zone and parseBioLong sees `undefined`).
const ITALIC_PATTERN = /\*([^*]+)\*/g;

export const PARAGRAPHS = parseBioLong(BIO_LONG);

// Extra synthetic paragraphs for the "test paragraph count" toggle in the lamp
// variant. Content continues the existing voice; just enough to give the
// resize observer + dynamic angle path real layout to chew on.
export const LAMP_EXTRA_PARAGRAPHS = parseBioLong(
  `If you trace the timeline, the pattern repeats: I sit with a problem long enough that the meta-pattern shows itself, then I build the meta first. Sometimes that's a workflow, sometimes a vocabulary, sometimes just a way to think. The artifact comes after.

The risk of this approach is *paralysis* — you can sharpen the pencil forever. The discipline is knowing when the meta is good enough and shipping the actual thing. I get the calibration wrong often. Each cycle, it improves a little.`
);

export const FIRST_PARAGRAPH = PARAGRAPHS[0];
export const FIRST_RUN = FIRST_PARAGRAPH[0];
export const DROP_CAP_LETTER = FIRST_RUN.text.charAt(0);
export const FIRST_PARAGRAPH_TAIL: Paragraph = [
  { text: FIRST_RUN.text.slice(1), italic: FIRST_RUN.italic },
  ...FIRST_PARAGRAPH.slice(1),
];

function parseBioLong(source: string): readonly Paragraph[] {
  if (!source) return [];
  return source
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0)
    .map<Paragraph>((block) => {
      const runs: { text: string; italic: boolean }[] = [];
      let cursor = 0;
      const text = block.replace(/\s+/g, ' ');
      ITALIC_PATTERN.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = ITALIC_PATTERN.exec(text))) {
        if (match.index > cursor) {
          runs.push({ text: text.slice(cursor, match.index), italic: false });
        }
        runs.push({ text: match[1], italic: true });
        cursor = match.index + match[0].length;
      }
      if (cursor < text.length) {
        runs.push({ text: text.slice(cursor), italic: false });
      }
      return runs;
    });
}
