import type { SelectOption } from '../select';
import type { Locale } from '@portfolio/shared/types';
import type { NavItem } from './header.types';

export const LANGUAGES: readonly SelectOption<Locale>[] = [
  { value: 'en', label: 'English', sublabel: 'en', iconName: 'globe' },
  { value: 'vi', label: 'Tiếng Việt', sublabel: 'vi', iconName: 'globe' },
];

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Home', path: '/', exact: true },
  { label: 'About', path: '/about' },
  { label: 'Projects', path: '/projects' },
  { label: 'Blog', path: '/blog' },
];

export const SCROLL_THRESHOLD = 8;
