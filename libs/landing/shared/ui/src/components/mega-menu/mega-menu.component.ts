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
import { IconComponent } from '../icon/icon.component';
import type { MegaMenuAlign, MegaMenuColumns, MegaMenuItem } from './mega-menu.types';

const OPEN_DELAY_MS = 80;
const CLOSE_DELAY_MS = 200;
/** After a hover-open, clicks within this window are treated as "keep open"
 *  (defeats the hover→click-toggle-off race). Past this window, click toggles
 *  off normally — otherwise users feel like they need to click twice to close. */
const HOVER_GRACE_MS = 250;

/**
 * Mega-menu dropdown — "featured hero + compact rows" layout (V5 from DDL).
 *
 * One item may be marked `featured` — it renders as a hero card at the top with
 * a big icon, label, description and an optional CTA. All other items render as
 * single-line compact rows with a label on the left and a mono `hint` on the right.
 *
 * Opens on hover (pointer-fine devices, with small open/close delays) and on click.
 * Closes on outside-click, Escape, mouse-leave, or item activation. A transparent
 * `::before` bridge on the panel fills the visual gap between trigger and panel so
 * hover doesn't break when the mouse moves across.
 */
@Component({
  selector: 'landing-mega-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconComponent, NgTemplateOutlet],
  host: {
    class: 'landing-mega-menu',
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseLeave()',
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'close()',
  },
  template: `
    <button
      type="button"
      class="landing-mega-menu__trigger"
      [class.landing-mega-menu__trigger--open]="open()"
      [attr.aria-expanded]="open()"
      [attr.aria-controls]="panelId()"
      aria-haspopup="menu"
      (click)="toggle($event)"
    >
      <span class="landing-mega-menu__trigger-label">{{ triggerLabel() }}</span>
      <landing-icon name="chevron-down" [size]="12" class="landing-mega-menu__chevron" aria-hidden="true" />
    </button>

    @if (open()) {
      <div
        class="landing-mega-menu__panel"
        [class.landing-mega-menu__panel--align-left]="align() === 'left'"
        [class.landing-mega-menu__panel--align-center]="align() === 'center'"
        [class.landing-mega-menu__panel--align-right]="align() === 'right'"
        [id]="panelId()"
        role="menu"
        [attr.aria-label]="triggerLabel()"
      >
        @if (featuredItem(); as f) {
          <ng-container [ngTemplateOutlet]="featuredTpl" [ngTemplateOutletContext]="{ $implicit: f }" />
        }
        @if (compactItems().length > 0) {
          <ul class="landing-mega-menu__list" role="presentation">
            @for (item of compactItems(); track item.label) {
              <li class="landing-mega-menu__item" role="none">
                <ng-container [ngTemplateOutlet]="compactTpl" [ngTemplateOutletContext]="{ $implicit: item }" />
              </li>
            }
          </ul>
        }
      </div>
    }

    <!-- ─── Featured hero card template ────────────────────────────────── -->
    <ng-template #featuredTpl let-item>
      @if (resolveKind(item) === 'internal') {
        <a
          [routerLink]="item.href"
          [fragment]="item.fragment ?? undefined"
          class="landing-mega-menu__hero"
          role="menuitem"
          (click)="onItemSelect()"
        >
          @if (item.iconName) {
            <span class="landing-mega-menu__hero-icon" aria-hidden="true">
              <landing-icon [name]="item.iconName" [size]="22" />
            </span>
          }
          <span class="landing-mega-menu__hero-text">
            <span class="landing-mega-menu__hero-title">{{ item.label }}</span>
            @if (item.description) {
              <span class="landing-mega-menu__hero-desc">{{ item.description }}</span>
            }
          </span>
          <span class="landing-mega-menu__hero-cta">
            {{ item.cta ?? 'Open' }}
            <landing-icon name="arrow-right" [size]="12" aria-hidden="true" />
          </span>
        </a>
      } @else {
        <a
          [attr.href]="item.href"
          [attr.target]="resolveKind(item) === 'external' ? '_blank' : null"
          [attr.rel]="resolveKind(item) === 'external' ? 'noopener noreferrer' : null"
          [attr.download]="resolveKind(item) === 'download' ? '' : null"
          class="landing-mega-menu__hero"
          role="menuitem"
          (click)="onItemSelect()"
        >
          @if (item.iconName) {
            <span class="landing-mega-menu__hero-icon" aria-hidden="true">
              <landing-icon [name]="item.iconName" [size]="22" />
            </span>
          }
          <span class="landing-mega-menu__hero-text">
            <span class="landing-mega-menu__hero-title">{{ item.label }}</span>
            @if (item.description) {
              <span class="landing-mega-menu__hero-desc">{{ item.description }}</span>
            }
          </span>
          <span class="landing-mega-menu__hero-cta">
            {{ item.cta ?? 'Open' }}
            <landing-icon name="arrow-right" [size]="12" aria-hidden="true" />
          </span>
        </a>
      }
    </ng-template>

    <!-- ─── Compact row template ───────────────────────────────────────── -->
    <ng-template #compactTpl let-item>
      @if (resolveKind(item) === 'internal') {
        <a
          [routerLink]="item.href"
          [fragment]="item.fragment ?? undefined"
          class="landing-mega-menu__row"
          role="menuitem"
          (click)="onItemSelect()"
        >
          <span class="landing-mega-menu__row-label">{{ item.label }}</span>
          @if (item.hint) {
            <span class="landing-mega-menu__row-hint">{{ item.hint }}</span>
          }
        </a>
      } @else {
        <a
          [attr.href]="item.href"
          [attr.target]="resolveKind(item) === 'external' ? '_blank' : null"
          [attr.rel]="resolveKind(item) === 'external' ? 'noopener noreferrer' : null"
          [attr.download]="resolveKind(item) === 'download' ? '' : null"
          class="landing-mega-menu__row"
          role="menuitem"
          (click)="onItemSelect()"
        >
          <span class="landing-mega-menu__row-label">{{ item.label }}</span>
          @if (item.hint) {
            <span class="landing-mega-menu__row-hint">{{ item.hint }}</span>
          }
        </a>
      }
    </ng-template>
  `,
  styleUrl: './mega-menu.component.scss',
})
export class MegaMenuComponent {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly triggerLabel = input.required<string>();
  readonly items = input.required<readonly MegaMenuItem[]>();
  readonly columns = input<MegaMenuColumns>(1);
  readonly align = input<MegaMenuAlign>('right');
  /** Stable id used for `aria-controls`. Auto-generated if omitted. */
  readonly panelId = input<string>(`landing-mega-menu-${nextMegaMenuId()}`);

  protected readonly open = signal(false);

  protected readonly featuredItem = computed<MegaMenuItem | null>(() => this.items().find((i) => i.featured) ?? null);
  protected readonly compactItems = computed<readonly MegaMenuItem[]>(() => this.items().filter((i) => !i.featured));

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

let megaMenuSeq = 0;
function nextMegaMenuId(): string {
  return (++megaMenuSeq).toString(36);
}
