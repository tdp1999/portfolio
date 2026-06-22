import type { DdlVariant } from '../ddl.types';

export const HOURS_FROM = '09:00–18:00 ICT';
export const HOURS_TO = '08:00–17:00 GMT-1';

// Decision record for the §3 Bio Card Grid refinement pass. This page is a set
// of SIX independent micro-decisions, not one single winner — each refinement
// (§A–§F) has its own picked option. Modelled as one variant per refinement:
// `label` names the refinement, the pick lives in `decision`/`note`. The
// structural one (§B background bleed) carries the `selected` verdict since it
// changes section geometry; the rest are listed as the other settled picks.
export const BIO_VARIANTS: readonly DdlVariant[] = [
  {
    id: 'b-bleed',
    label: '§B Background bleed — B5 · Hard cut up, bleed down',
    selected: true,
    decision:
      'Keep the hard top border with the hero (it has a crisp blueprint grid), drop the bottom border so the aurora bleeds down into selected-work.',
  },
  {
    id: 'a-title',
    label: '§A Section title — A1 · "Who I Am"',
    note: 'Direct, keeps the NN · Label eyebrow format consistent with 03/04/05/06.',
  },
  {
    id: 'c-hours',
    label: '§C HOURS roulette — C3 · Type-out',
    note: 'Characters reveal one by one like a terminal — matches the mono voice over slot/scramble flash.',
  },
  {
    id: 'd-email',
    label: '§D Email copy — inline copy→check feedback',
    note: 'Hover reveals the copy icon; click swaps copy→check for 1.5s. Becomes the shared copy-to-clipboard pattern on graduate.',
  },
  {
    id: 'e-hover',
    label: '§E Card hover — E3 · Theme-mixed glow',
    note: 'Accent halo via color-mix, no dark drop-shadow — reads correctly in both light and dark themes.',
  },
  {
    id: 'f-social',
    label: '§F Social icons in Card C — F1 · Below "Connect now"',
    note: 'Icon row (max 4) sits under the link, keeping the explicit CTA intact.',
  },
];
