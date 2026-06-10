export type VariantMeta = {
  readonly label: string;
  readonly hint: string;
  readonly picked?: boolean;
};

export const DEPTH_MAP_VARIANTS: readonly VariantMeta[] = [
  {
    label: 'Variant 1 · Tiered grid',
    hint: 'Three labeled rows; Daily dominates with name + 1-line rationale per item, Frequent + Shipped collapse to chips at decreasing prominence. Clearest read of "depth vs breadth."',
  },
  {
    label: 'Variant 2 · Concentric rings',
    hint: 'SVG three-ring polar layout; tools positioned evenly per tier (Daily inner, Frequent mid, Shipped outer). Rationale lives in a footnote list under the ring so the visualization stays legible.',
  },
  {
    label: 'Variant 3 · Constellation',
    hint: 'Daily tools as anchored "stars" — labeled cards with rationale, joined to a pivot by an accent rule. Frequent + Shipped cluster below as smaller pills and a mono row. Editorial voice.',
  },
];

export const FAILURES_VARIANTS: readonly VariantMeta[] = [
  {
    label: 'Variant 1 · Three-column cards',
    hint: 'Equal-height bordered cards side-by-side; each has labeled Decision / Consequence / Lesson sections. Dense + scannable — all three failures fit one viewport on desktop. Collapses to single column < 1024px.',
    picked: true,
  },
  {
    label: 'Variant 2 · Numbered editorial',
    hint: 'Stacked vertical, mono numbers on a left rail, italic-display heading taken from the decision, lesson as a separated footer line. Reads like a journal — slower pace, more breathing room.',
  },
  {
    label: 'Variant 3 · Prose with pull-quote lesson',
    hint: 'Stacked editorial vignettes; decision + consequence flow as paragraphs, the lesson elevates to a large italic pull-quote with accent rule. The takeaway is what sticks; V3 makes that visible.',
  },
];

export const CURRENTLY_SHIPPING_VARIANTS: readonly VariantMeta[] = [
  {
    label: 'Variant 1 · Status strip',
    hint: 'Four labeled rows (Building / Writing / Learning / Last shipped) with values, mono "Last updated" + `See /now →` footer. Most scannable; reads like a status board. Best when values stay ≤ 2 lines.',
  },
  {
    label: 'Variant 2 · Card with prose',
    hint: 'Bordered card; the four fields flow as labeled prose paragraphs ("Right now I\'m building X. Writing Y. Learning Z..."). Narrative voice over status-board scan — reads warmer.',
  },
  {
    label: 'Variant 3 · Terminal-styled',
    hint: 'Monospace pseudo-terminal block (`$ now`, `· building → X`). Strong craft signal; polarizing — HR persona may bounce off the affectation. No real interactivity.',
  },
];
