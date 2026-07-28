import type { SelectOption } from '../select';
import type { Locale } from '@portfolio/shared/types';
import { resolveCopy } from '../../services/copy';
import type { NavItem } from './header.types';

export const LANGUAGES: readonly SelectOption<Locale>[] = [
  { value: 'en', label: 'English', sublabel: 'en', iconName: 'globe' },
  { value: 'vi', label: 'Tiếng Việt', sublabel: 'vi', iconName: 'globe' },
];

/**
 * Primary nav, resolved per locale. Labels come from `common.page.*` — the same
 * entries the breadcrumbs, the footer site-map, and the command palette read, so
 * a page rename lands in one place.
 */
export function navItems(locale: Locale): readonly NavItem[] {
  return [
    { label: resolveCopy('common.page.home', locale), path: '/', exact: true },
    { label: resolveCopy('common.page.about', locale), path: '/about' },
    { label: resolveCopy('common.page.projects', locale), path: '/projects' },
    { label: resolveCopy('common.page.contact', locale), path: '/contact' },
  ];
}

export const SCROLL_THRESHOLD = 8;
