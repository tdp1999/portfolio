import { DOCUMENT } from '@angular/common';
import { effect, inject, type Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';

export type LegalLocale = 'en' | 'vi';

const SITE_URL = 'https://thunderphong.com';
const SEO_TAG = 'data-legal-seo';

export interface LegalPageConfig {
  readonly path: '/privacy' | '/terms';
  readonly titles: Readonly<Record<LegalLocale, string>>;
  readonly descriptions: Readonly<Record<LegalLocale, string>>;
}

export interface LegalPageState {
  readonly locale: Signal<LegalLocale>;
  setLocale(lang: LegalLocale): void;
}

// Co-locating logic for both legal pages: derives locale from `?lang=` query
// param, keeps Title/Meta in sync, and emits canonical + hreflang link tags so
// Google indexes the two languages as alternates. Title-bar and the rest of
// the site remain English; only the page content switches.
export function useLegalPage(config: LegalPageConfig): LegalPageState {
  const document = inject(DOCUMENT);
  const title = inject(Title);
  const meta = inject(Meta);
  const route = inject(ActivatedRoute);
  const router = inject(Router);

  const locale = toSignal(
    route.queryParamMap.pipe(map((q) => (q.get('lang') === 'vi' ? ('vi' as const) : ('en' as const)))),
    { initialValue: 'en' as const }
  );

  effect(() => {
    const lang = locale();
    title.setTitle(config.titles[lang]);
    meta.updateTag({ name: 'description', content: config.descriptions[lang] });
    setHreflangLinks(document, config.path, lang);
  });

  return {
    locale,
    setLocale(lang) {
      void router.navigate([], {
        relativeTo: route,
        queryParams: { lang: lang === 'en' ? null : 'vi' },
        queryParamsHandling: 'merge',
      });
    },
  };
}

function setHreflangLinks(doc: Document, path: string, current: LegalLocale): void {
  const head = doc.head;
  head.querySelectorAll(`link[${SEO_TAG}]`).forEach((el) => el.remove());

  const urlEn = `${SITE_URL}${path}`;
  const urlVi = `${SITE_URL}${path}?lang=vi`;

  appendLink(doc, head, {
    rel: 'canonical',
    href: current === 'vi' ? urlVi : urlEn,
  });
  appendLink(doc, head, { rel: 'alternate', hreflang: 'en', href: urlEn });
  appendLink(doc, head, { rel: 'alternate', hreflang: 'vi', href: urlVi });
  appendLink(doc, head, { rel: 'alternate', hreflang: 'x-default', href: urlEn });
}

interface LinkSpec {
  readonly rel: string;
  readonly href: string;
  readonly hreflang?: string;
}

function appendLink(doc: Document, head: HTMLElement, spec: LinkSpec): void {
  const el = doc.createElement('link');
  el.rel = spec.rel;
  el.href = spec.href;
  if (spec.hreflang) el.setAttribute('hreflang', spec.hreflang);
  el.setAttribute(SEO_TAG, '');
  head.appendChild(el);
}
