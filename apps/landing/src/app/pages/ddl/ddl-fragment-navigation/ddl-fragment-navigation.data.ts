import type { InPageSection } from '@portfolio/landing/shared/ui';

import type { DdlVariant } from '../ddl.types';

// Decision record — this page is still EXPLORING: five in-page navigation
// patterns are on the board, none has won yet. No `selected`; each variant
// carries its trade-off as a `note`, so the widget tags them all "Candidate".
export const FRAGMENT_NAVIGATION_VARIANTS: readonly DdlVariant[] = [
  {
    id: 'fab',
    label: 'Scroll-to-top FAB',
    note: 'A single floating button — zero scan cost, but it only goes up; it offers no overview of where the sections are.',
  },
  {
    id: 'toc',
    label: 'Sticky TOC sidebar',
    note: 'Full outline always in view with live scrollspy. Richest wayfinding, but needs a laptop-width rail it can dock into.',
  },
  {
    id: 'inline',
    label: 'Inline TOC (mobile)',
    note: 'Outline folded into the content column up top. Works at any width, but scrolls away — no persistent "you are here".',
  },
  {
    id: 'dots',
    label: 'Section dots + reading bar',
    note: 'Minimal dot rail plus a top progress bar. Compact and ambient, but the dots are unlabelled until hovered.',
  },
  {
    id: 'pill',
    label: 'Floating pill + mini-map',
    note: 'A compact pill that expands to a mini-map. Space-efficient and playful, but the extra tap hides the outline by default.',
  },
];

export const SECTIONS: readonly InPageSection[] = [
  { id: 'intro', title: 'Introduction' },
  { id: 'principles', title: 'Principles' },
  { id: 'tokens', title: 'Tokens & scale' },
  { id: 'typography', title: 'Typography' },
  { id: 'color', title: 'Color system' },
  { id: 'components', title: 'Components' },
  { id: 'patterns', title: 'Patterns' },
  { id: 'motion', title: 'Motion' },
  { id: 'a11y', title: 'Accessibility' },
  { id: 'roadmap', title: 'Roadmap' },
];

export const LOREM = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean euismod bibendum laoreet. Proin gravida dolor sit amet lacus accumsan et viverra justo commodo. Proin sodales pulvinar sic tempor. Sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Nam fermentum, nulla luctus pharetra vulputate, felis tellus mollis orci, sed rhoncus pronin sapien nunc accuan eget. Quisque rutrum. Aenean imperdiet. Etiam ultricies nisi vel augue. Curabitur ullamcorper ultricies nisi. Nam eget dui. Etiam rhoncus. Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero, sit amet adipiscing sem neque sed ipsum.`;

export const PATTERN_OPTIONS = [
  { id: 'fab', label: 'Scroll-to-top FAB' },
  { id: 'toc', label: 'Sticky TOC sidebar' },
  { id: 'inline', label: 'Inline TOC (mobile)' },
  { id: 'dots', label: 'Section dots + progress' },
  { id: 'pill', label: 'Floating pill + mini-map' },
];
