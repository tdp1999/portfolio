import type { InPageSection } from '@portfolio/landing/shared/ui';

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
