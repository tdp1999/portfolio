import type { Locale } from '@portfolio/shared/types';
import { resolveCopy } from '@portfolio/landing/shared/ui';
import type { BreadcrumbItem } from '@portfolio/landing/shared/ui';

export function notFoundBreadcrumb(locale: Locale): readonly BreadcrumbItem[] {
  return [
    { label: resolveCopy('common.page.home', locale), href: '/' },
    { label: resolveCopy('common.page.notFound', locale) },
  ];
}
