import type { MegaMenuItem } from '@portfolio/landing/shared/ui';

/** Mock items for mega-menu variant to demonstrate "shared dropdown shell". */
export const MEGA_MENU_ITEMS: readonly MegaMenuItem[] = [
  {
    label: 'English',
    description: 'Default — site copy in English.',
    href: '#en',
    iconName: 'globe',
  },
  {
    label: 'Tiếng Việt',
    description: 'Bản tiếng Việt — same content, localized.',
    href: '#vi',
    iconName: 'globe',
  },
];
