import type { SelectOption } from '../select';
import type { Locale } from '@portfolio/shared/types';
import { resolveCopy } from '../../services/copy';
import type { MegaMenuItem } from '../mega-menu';
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

/**
 * The header's More menu, resolved per locale: the featured product, then the Explore, Documents and
 * Account sections. `resumeUrl` adds the CV download; `signedIn` drops the "Sign in" entry.
 */
export function moreMenuItems(locale: Locale, resumeUrl: string, signedIn: boolean): readonly MegaMenuItem[] {
  const explore = resolveCopy('nav.explore', locale);
  const items: MegaMenuItem[] = [];

  // Products lead the menu as the featured first column. Today there is one, so it
  // renders as the solo flagship card (preview screenshot that cross-fades to the
  // icon tile on hover). When `claude-code-ctx` ships, add it here with
  // `product: true` and the column auto-switches to a stacked "Products" list —
  // no layout or caller change needed.
  items.push({
    label: resolveCopy('common.page.documentEngine', locale),
    description: resolveCopy('nav.product.documentEngine.desc', locale),
    href: '/document-engine',
    iconName: 'file-pen',
    product: true,
    cta: resolveCopy('nav.product.documentEngine.cta', locale),
    image: '/menu/document-engine-light.webp',
    imageDark: '/menu/document-engine-dark.webp',
  });

  // Explore — utility / content links (framed icon + self-explanatory label).
  items.push(
    { label: resolveCopy('common.page.blog', locale), href: '/blog', section: explore, iconName: 'pen-line' },
    { label: resolveCopy('common.page.uses', locale), href: '/uses', section: explore, iconName: 'wrench' },
    { label: resolveCopy('common.page.colophon', locale), href: '/colophon', section: explore, iconName: 'layers' },
    { label: resolveCopy('common.page.ddl', locale), href: '/ddl', section: explore, iconName: 'palette' }
  );

  // Documents — downloadables.
  if (resumeUrl) {
    items.push({
      label: resolveCopy('nav.resume', locale),
      hint: 'PDF',
      href: resumeUrl,
      kind: 'download',
      iconName: 'file-down',
      section: resolveCopy('nav.documents', locale),
      column: 'documents',
    });
  }

  // Owner sign-in: its own "Account" section, stacked under Documents in the same column (a third
  // column would wrap under Explore in the 2-column panel). Hidden once signed in: sign-out lives
  // in the session bar under the header.
  if (!signedIn) {
    items.push({
      label: resolveCopy('auth.signIn.title', locale),
      href: '/sign-in',
      iconName: 'log-in',
      section: resolveCopy('nav.account', locale),
      column: 'documents',
    });
  }

  return items;
}

export const SCROLL_THRESHOLD = 8;
