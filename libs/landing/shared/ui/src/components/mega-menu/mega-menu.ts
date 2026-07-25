import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { NgTemplateOutlet, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Icon } from '../icon/icon';
import type { MegaMenuAlign, MegaMenuColumns, MegaMenuItem, MegaMenuSection } from './mega-menu.types';
import { CLOSE_DELAY_MS, HOVER_GRACE_MS, OPEN_DELAY_MS } from './mega-menu.constants';
import { nextMegaMenuId } from './mega-menu.util';

/**
 * Mega-menu dropdown — icon-forward "Products column + titled columns" layout
 * (V9b from DDL).
 *
 * Products lead in the first column: one product → a featured card (preview tile
 * that cross-fades to the icon tile on hover + title + description + link); two or
 * more → a stacked "Products" list. Everything else groups into titled columns (by
 * `section`) with a framed icon and an optional mono sub-label. With no products the
 * panel is the columns alone.
 *
 * It is a disclosure (button + `aria-expanded`/`aria-controls` toggling a region
 * of plain links) — deliberately NOT `role="menu"`.
 *
 * Opens on hover (pointer-fine devices, with small open/close delays) and on click.
 * With `align="screen"` the panel is centred on the viewport (its horizontal offset
 * is measured from the trigger on open); other aligns anchor it to the trigger.
 * Closes on outside-click, Escape, mouse-leave, or item activation. A transparent
 * `::before` bridge fills the gap between trigger and panel so hover doesn't break.
 */
@Component({
  selector: 'landing-mega-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, NgTemplateOutlet],
  host: {
    class: 'landing-mega-menu',
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseLeave()',
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'close()',
    '(window:resize)': 'onViewportChange()',
  },
  template: `
    <button
      type="button"
      class="landing-mega-menu__trigger"
      [class.landing-mega-menu__trigger--open]="open()"
      [attr.aria-expanded]="open()"
      [attr.aria-controls]="panelId()"
      (click)="toggle($event)"
    >
      <span class="landing-mega-menu__trigger-label">{{ triggerLabel() }}</span>
      <landing-icon name="chevron-down" [size]="12" class="landing-mega-menu__chevron" aria-hidden="true" />
    </button>

    @if (open()) {
      <nav
        class="landing-mega-menu__panel"
        [class.landing-mega-menu__panel--align-left]="align() === 'left'"
        [class.landing-mega-menu__panel--align-center]="align() === 'center'"
        [class.landing-mega-menu__panel--align-right]="align() === 'right'"
        [class.landing-mega-menu__panel--align-screen]="align() === 'screen'"
        [class.landing-mega-menu__panel--rail]="hasRail()"
        [style.--mm-host-x]="hostLeft() + 'px'"
        [style.--mm-cols]="columns()"
        [id]="panelId()"
        [attr.aria-label]="triggerLabel()"
      >
        <!-- ─── Products column (first) ───────────────────────────────── -->
        @if (hasRail()) {
          <aside class="landing-mega-menu__rail">
            <h3 class="landing-mega-menu__eyebrow landing-mega-menu__eyebrow--accent">Products</h3>
            @if (soloProduct(); as p) {
              <ng-container [ngTemplateOutlet]="featureTpl" [ngTemplateOutletContext]="{ $implicit: p, solo: true }" />
            } @else {
              <ul class="landing-mega-menu__rail-list">
                @for (p of products(); track p.label) {
                  <li class="landing-mega-menu__item">
                    <ng-container
                      [ngTemplateOutlet]="featureTpl"
                      [ngTemplateOutletContext]="{ $implicit: p, solo: false }"
                    />
                  </li>
                }
              </ul>
            }
          </aside>
        }

        <!-- ─── Titled icon columns (Explore, Documents, …) ───────────── -->
        <div class="landing-mega-menu__sections">
          @for (col of sections(); track col.title ?? $index) {
            <div class="landing-mega-menu__col">
              @if (col.title) {
                <h3 class="landing-mega-menu__eyebrow landing-mega-menu__eyebrow--accent">{{ col.title }}</h3>
              }
              <ul class="landing-mega-menu__list">
                @for (item of col.items; track item.label) {
                  <li class="landing-mega-menu__item">
                    <ng-container [ngTemplateOutlet]="rowTpl" [ngTemplateOutletContext]="{ $implicit: item }" />
                  </li>
                }
              </ul>
            </div>
          }
        </div>
      </nav>
    }

    <!-- ─── Icon-row template (columns) ────────────────────────────────── -->
    <ng-template #rowTpl let-item>
      @if (resolveKind(item) === 'internal') {
        <a
          [routerLink]="item.href"
          [fragment]="item.fragment ?? undefined"
          class="landing-mega-menu__row"
          (click)="onItemSelect()"
        >
          <ng-container [ngTemplateOutlet]="rowBody" [ngTemplateOutletContext]="{ $implicit: item }" />
        </a>
      } @else {
        <a
          [attr.href]="item.href"
          [attr.target]="resolveKind(item) === 'external' ? '_blank' : null"
          [attr.rel]="resolveKind(item) === 'external' ? 'noopener noreferrer' : null"
          [attr.download]="resolveKind(item) === 'download' ? '' : null"
          class="landing-mega-menu__row"
          (click)="onItemSelect()"
        >
          <ng-container [ngTemplateOutlet]="rowBody" [ngTemplateOutletContext]="{ $implicit: item }" />
        </a>
      }
    </ng-template>

    <ng-template #rowBody let-item>
      @if (item.iconName) {
        <span class="landing-mega-menu__row-icon" aria-hidden="true">
          <landing-icon [name]="item.iconName" [size]="18" />
        </span>
      }
      <span class="landing-mega-menu__row-text">
        <span class="landing-mega-menu__row-titlerow">
          <span class="landing-mega-menu__row-label">{{ item.label }}</span>
          @if (item.badge) {
            <span class="landing-mega-menu__badge">{{ item.badge }}</span>
          }
        </span>
        @if (item.hint) {
          <span class="landing-mega-menu__row-hint">{{ item.hint }}</span>
        }
      </span>
    </ng-template>

    <!-- ─── What's New card template (rail) ────────────────────────────── -->
    <ng-template #featureTpl let-item let-solo="solo">
      @if (resolveKind(item) === 'internal') {
        <a
          [routerLink]="item.href"
          [fragment]="item.fragment ?? undefined"
          class="landing-mega-menu__feature"
          [class.landing-mega-menu__feature--solo]="solo"
          (click)="onItemSelect()"
        >
          <ng-container [ngTemplateOutlet]="featureBody" [ngTemplateOutletContext]="{ $implicit: item, solo }" />
        </a>
      } @else {
        <a
          [attr.href]="item.href"
          [attr.target]="resolveKind(item) === 'external' ? '_blank' : null"
          [attr.rel]="resolveKind(item) === 'external' ? 'noopener noreferrer' : null"
          [attr.download]="resolveKind(item) === 'download' ? '' : null"
          class="landing-mega-menu__feature"
          [class.landing-mega-menu__feature--solo]="solo"
          (click)="onItemSelect()"
        >
          <ng-container [ngTemplateOutlet]="featureBody" [ngTemplateOutletContext]="{ $implicit: item, solo }" />
        </a>
      }
    </ng-template>

    <ng-template #featureBody let-item let-solo="solo">
      <span class="landing-mega-menu__feature-tile" aria-hidden="true">
        @if (item.iconName) {
          <landing-icon [name]="item.iconName" [size]="solo ? 28 : 18" />
        }
        @if (solo && item.image) {
          <img
            class="landing-mega-menu__feature-shot landing-mega-menu__feature-shot--light"
            [src]="item.image"
            alt=""
            loading="lazy"
            decoding="async"
          />
        }
        @if (solo && item.imageDark) {
          <img
            class="landing-mega-menu__feature-shot landing-mega-menu__feature-shot--dark"
            [src]="item.imageDark"
            alt=""
            loading="lazy"
            decoding="async"
          />
        }
      </span>
      <span class="landing-mega-menu__feature-title">{{ item.label }}</span>
      @if (item.description) {
        <span class="landing-mega-menu__feature-desc">{{ item.description }}</span>
      }
      @if (solo) {
        <span class="landing-mega-menu__feature-link">
          {{ item.cta ?? 'Explore' }}
          <landing-icon name="arrow-right" [size]="12" aria-hidden="true" />
        </span>
      }
    </ng-template>
  `,
  styleUrl: './mega-menu.scss',
})
export class MegaMenu {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly triggerLabel = input.required<string>();
  readonly items = input.required<readonly MegaMenuItem[]>();
  /** Column count for the titled-column area (the product rail is separate). */
  readonly columns = input<MegaMenuColumns>(1);
  readonly align = input<MegaMenuAlign>('right');
  /** Stable id used for `aria-controls`. Auto-generated if omitted. */
  readonly panelId = input<string>(`landing-mega-menu-${nextMegaMenuId()}`);

  protected readonly open = signal(false);
  /** Trigger's viewport-left, measured on open — feeds `align="screen"` centring. */
  protected readonly hostLeft = signal(0);

  /** Products feed the What's New rail; everything else groups into columns. */
  protected readonly products = computed<readonly MegaMenuItem[]>(() => this.items().filter((i) => i.product));
  protected readonly hasRail = computed<boolean>(() => this.products().length > 0);
  /** The sole product, when there is exactly one — rendered as the featured card. */
  protected readonly soloProduct = computed<MegaMenuItem | null>(() => {
    const p = this.products();
    return p.length === 1 ? p[0] : null;
  });

  /** Non-product items grouped into titled columns, in first-seen order. */
  protected readonly sections = computed<readonly MegaMenuSection[]>(() => {
    const groups = new Map<string | null, MegaMenuItem[]>();
    for (const item of this.items()) {
      if (item.product) continue;
      const key = item.section ?? null;
      const bucket = groups.get(key);
      if (bucket) bucket.push(item);
      else groups.set(key, [item]);
    }
    return [...groups.entries()].map(([title, items]) => ({ title, items }));
  });

  private openTimer: ReturnType<typeof setTimeout> | null = null;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  /** Tracks WHICH gesture opened the panel so a click that follows a hover-open
   *  doesn't get misread as "toggle off". `null` while closed. */
  private openedBy: 'hover' | 'click' | null = null;
  /** Timestamp of the last hover-open, used to bound the "keep open on click"
   *  protection. After HOVER_GRACE_MS the click acts like a normal toggle so the
   *  trigger can close the panel in one click. */
  private hoverOpenedAt = 0;

  constructor() {
    this.destroyRef.onDestroy(() => this.clearTimers());
  }

  protected resolveKind(item: MegaMenuItem): NonNullable<MegaMenuItem['kind']> {
    if (item.kind) return item.kind;
    if (item.href.startsWith('/')) return 'internal';
    if (/^https?:\/\//.test(item.href)) return 'external';
    if (item.href.startsWith('#')) return 'anchor';
    return 'external';
  }

  protected toggle(event: MouseEvent): void {
    event.stopPropagation();
    this.clearTimers();
    if (!this.open()) {
      // Closed → open as click-controlled.
      this.measureHost();
      this.openedBy = 'click';
      this.open.set(true);
      return;
    }
    // Hover-then-fast-click race: only swallow the close if we're inside the
    // brief grace window after a hover-open. Past that window the user is
    // making a deliberate "close" click and we must respect it on the first try.
    if (this.openedBy === 'hover' && Date.now() - this.hoverOpenedAt < HOVER_GRACE_MS) {
      this.openedBy = 'click';
      return;
    }
    this.doClose();
  }

  protected close(): void {
    this.clearTimers();
    if (this.open()) this.doClose();
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.open()) return;
    const target = event.target as Node | null;
    if (target && this.elementRef.nativeElement.contains(target)) return;
    this.clearTimers();
    this.doClose();
  }

  protected onItemSelect(): void {
    this.clearTimers();
    this.doClose();
  }

  protected onMouseEnter(): void {
    if (!this.supportsHover()) return;
    if (this.closeTimer !== null) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
    if (this.open() || this.openTimer !== null) return;
    this.openTimer = setTimeout(() => {
      this.openTimer = null;
      this.measureHost();
      this.openedBy = 'hover';
      this.hoverOpenedAt = Date.now();
      this.open.set(true);
    }, OPEN_DELAY_MS);
  }

  protected onMouseLeave(): void {
    if (!this.supportsHover()) return;
    if (this.openTimer !== null) {
      clearTimeout(this.openTimer);
      this.openTimer = null;
    }
    if (!this.open() || this.closeTimer !== null) return;
    this.closeTimer = setTimeout(() => {
      this.closeTimer = null;
      this.doClose();
    }, CLOSE_DELAY_MS);
  }

  /** Keep viewport-centred alignment correct if the window resizes while open. */
  protected onViewportChange(): void {
    if (this.open()) this.measureHost();
  }

  private measureHost(): void {
    if (!this.isBrowser) return;
    this.hostLeft.set(Math.round(this.elementRef.nativeElement.getBoundingClientRect().left));
  }

  private doClose(): void {
    this.open.set(false);
    this.openedBy = null;
  }

  private supportsHover(): boolean {
    if (!this.isBrowser) return false;
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }

  private clearTimers(): void {
    if (this.openTimer !== null) {
      clearTimeout(this.openTimer);
      this.openTimer = null;
    }
    if (this.closeTimer !== null) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }
}
