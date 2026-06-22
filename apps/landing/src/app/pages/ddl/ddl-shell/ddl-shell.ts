import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, NavigationStart, Router, RouterOutlet } from '@angular/router';

import { ProfileService } from '@portfolio/landing/shared/data-access';
import {
  FooterBanner,
  FooterSignature,
  LandingLocaleService,
  LandingScrollspyService,
  TocSidebar,
} from '@portfolio/landing/shared/ui';
import { getLocalized } from '@portfolio/shared/utils/lite';

import { DdlDocsService } from '../ddl-docs.service';
import { DdlSidebar } from '../ddl-sidebar/ddl-sidebar';

@Component({
  selector: 'landing-ddl-shell',
  standalone: true,
  imports: [RouterOutlet, DdlSidebar, TocSidebar, FooterBanner, FooterSignature],
  providers: [LandingScrollspyService, DdlDocsService],
  templateUrl: './ddl-shell.html',
  styleUrl: './ddl-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DdlShell {
  // ──────── Injections ──────────────────────────────────────────────────
  protected readonly docs = inject(DdlDocsService);
  private readonly scrollspy = inject(LandingScrollspyService);
  private readonly router = inject(Router);
  private readonly profileService = inject(ProfileService);
  private readonly localeService = inject(LandingLocaleService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  // The internal scroll region (app-shell, laptop+) — spans content + TOC. The
  // window stays locked there, so this pane is the scroll source + anchor target.
  private readonly scrollRef = viewChild<ElementRef<HTMLElement>>('scroll');

  // ──────── State ───────────────────────────────────────────────────────
  protected readonly drawerOpen = signal(false);

  // The TOC shows as soon as the page has at least one anchored heading — even a
  // single entry earns the right rail (consistent frame across pages beats hiding
  // it). Only full-bleed pages reclaim the TOC column, so it never shows there.
  protected readonly showToc = computed(() => this.docs.sections().length >= 1 && this.docs.width() !== 'full');

  // ──────── Footer (rendered inside the docs content column) ──────────────
  private readonly profile = toSignal(this.profileService.getPublicProfile(), { initialValue: null });
  private readonly locale = this.localeService.locale;

  protected readonly fullName = computed(() => getLocalized(this.profile()?.fullName, this.locale()));
  protected readonly email = computed(() => this.profile()?.email ?? '');
  protected readonly footerTagline = computed(() => getLocalized(this.profile()?.footerTagline, this.locale()));
  protected readonly socialLinks = computed(() => this.profile()?.socialLinks ?? []);

  // ──────── Constructor ─────────────────────────────────────────────────
  constructor() {
    // Kill the document overscroll bounce while the docs are mounted. On mobile the
    // page scrolls the document, so an at-top rubber-band pull drags the sticky
    // header (logo + controls) down elastically while the fixed docs-nav toggle
    // stays put — they visibly desync. Disabling the bounce keeps both fixed, which
    // also matches the app-shell at laptop+ (the window is already locked there).
    if (isPlatformBrowser(this.platformId)) {
      const root = this.document.documentElement;
      const prev = root.style.overscrollBehaviorY;
      root.style.overscrollBehaviorY = 'none';
      this.destroyRef.onDestroy(() => {
        root.style.overscrollBehaviorY = prev;
      });
    }

    // Keep the shared scrollspy in sync with whatever the active child publishes.
    effect(() => this.scrollspy.setSections(this.docs.sections()));

    // App-shell (laptop+): the scroll region scrolls internally, so register it as
    // a scrollspy source (the window scroll listener won't fire there).
    afterNextRender(() => {
      const el = this.scrollRef()?.nativeElement;
      if (el) this.scrollspy.observeScrollContainer(el);
    });

    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      // Reset the TOC only when the route PATH changes — not on fragment-only
      // navigations (clicking a TOC link), which would wipe the current page's
      // sections. The next page republishes on init if it has any.
      if (event instanceof NavigationStart) {
        const nextPath = event.url.split('#')[0];
        const currentPath = this.router.url.split('#')[0];
        if (nextPath !== currentPath) this.docs.clear();
        return;
      }

      // App-shell scroll handling: Angular's window-based scrollPositionRestoration
      // / anchorScrolling can't move the internal content pane, so do it manually.
      if (event instanceof NavigationEnd && isPlatformBrowser(this.platformId)) {
        const scroll = this.scrollRef()?.nativeElement;
        const fragment = event.urlAfterRedirects.split('#')[1];
        if (fragment) {
          // TOC click → scroll the heading into the scroll region (scroll-padding
          // on __scroll provides the top offset). rAF lets the target render first.
          requestAnimationFrame(() =>
            document.getElementById(fragment)?.scrollIntoView({ block: 'start', behavior: 'smooth' })
          );
        } else if (scroll) {
          scroll.scrollTop = 0;
        }
      }
    });
  }

  // ──────── Methods ─────────────────────────────────────────────────────
  protected toggleDrawer(): void {
    this.drawerOpen.update((open) => !open);
  }

  protected closeDrawer(): void {
    this.drawerOpen.set(false);
  }
}
