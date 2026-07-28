import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { Router } from '@angular/router';
import { Icon } from '../icon/icon';
import { UmamiEventDirective } from '../../directives/umami-event/umami-event.directive';
import { KeyboardShortcutService } from '../../services/keyboard/keyboard-shortcut.service';
import { CommandPaletteService } from './command-palette.service';
import { resolveCopy } from '../../services/copy';
import { LandingLocaleService } from '../../services/locale/landing-locale.service';
import { T } from '../t';
import {
  COMMAND_PALETTE_SEARCH_SOURCES,
  KIND_LABEL_KEYS,
  KIND_ORDER,
  pageManifest,
  sectionManifest,
  type CommandKind,
  type CommandResult,
  type FlatRow,
  filterCommands,
  groupCommandsByKind,
} from './command-palette.types';

/**
 * Linear-style command palette (V1 from DDL).
 *
 * Mounts once at the app root (e.g. inside `landing-shell`); the component watches
 * {@link CommandPaletteService.visible} and renders itself when true.
 *
 * The palette automatically lists:
 * - {@link pageManifest} — top-level pages, resolved for the active locale
 * - {@link sectionManifest} — section anchors, resolved for the active locale
 * - every shortcut registered with {@link KeyboardShortcutService} (as Actions)
 *
 * Adding more actions is just registering a shortcut anywhere in the app — the
 * palette picks them up reactively.
 *
 * **Keyboard**: ↑↓ navigate (with auto-scroll-into-view), Enter activates,
 * Esc closes, ⌘K toggles. While open, the global keyboard service is suspended
 * so other shortcuts don't fire underneath.
 */
@Component({
  selector: 'landing-command-palette',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, UmamiEventDirective, T],
  templateUrl: './command-palette.html',
  styleUrl: './command-palette.scss',
})
export class CommandPalette {
  private readonly state = inject(CommandPaletteService);
  private readonly shortcuts = inject(KeyboardShortcutService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  // App-contributed, search-only results (e.g. DDL registry) — folded in only
  // when there's an active query, so the default list stays lean.
  private readonly searchSources = inject(COMMAND_PALETTE_SEARCH_SOURCES);

  readonly visible = this.state.visible;
  readonly query = signal('');
  readonly cursor = signal(0);

  protected readonly searchInputRef = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  protected readonly rowEls = viewChildren<ElementRef<HTMLElement>>('rowEl');

  private readonly locale = inject(LandingLocaleService).locale;

  /** Group headers, resolved from `KIND_LABEL_KEYS` for the active locale. */
  protected readonly kindLabels = computed<Record<CommandKind, string>>(() => {
    const l = this.locale();
    return Object.fromEntries(
      Object.entries(KIND_LABEL_KEYS).map(([kind, key]) => [kind, resolveCopy(key, l)])
    ) as Record<CommandKind, string>;
  });

  /** Actions surface every registered keyboard shortcut as a palette item.
   *  `description` / `category` on a shortcut are copy **keys**, resolved here —
   *  registration runs once at startup and could not carry a live string. */
  protected readonly actionResults = computed<readonly CommandResult[]>(() => {
    const l = this.locale();
    return this.shortcuts.all().map((s) => ({
      id: `a-${s.id}`,
      kind: 'action' as const,
      title: resolveCopy(s.description, l),
      description: s.category ? resolveCopy(s.category, l) : undefined,
      hint: s.keys[0] ? this.shortcuts.format(s.keys[0]) : undefined,
      iconName: s.iconName ?? 'sliders-horizontal',
      handler: s.handler,
    }));
  });

  protected readonly allResults = computed<readonly CommandResult[]>(() => {
    const l = this.locale();
    return [...pageManifest(l), ...sectionManifest(l), ...this.actionResults()];
  });

  protected readonly emptyHint = computed(() => resolveCopy('palette.emptyHint', this.locale()));
  protected readonly placeholderText = computed(() => resolveCopy('palette.placeholder', this.locale()));
  protected readonly searchLabel = computed(() => resolveCopy('a11y.search', this.locale()));
  protected readonly queryLabel = computed(() => resolveCopy('a11y.search.query', this.locale()));
  protected readonly clearLabel = computed(() => resolveCopy('a11y.search.clear', this.locale()));
  protected readonly closeLabel = computed(() => resolveCopy('a11y.button.close', this.locale()));
  protected readonly escLabel = computed(() => resolveCopy('palette.hint.close', this.locale()));
  protected readonly hintNavigate = computed(() => resolveCopy('palette.hint.navigate', this.locale()));
  protected readonly hintOpen = computed(() => resolveCopy('palette.hint.open', this.locale()));

  protected readonly filtered = computed(() => {
    const q = this.query();
    const base = filterCommands(q, this.allResults());
    // Search-only sources never show in the default list.
    if (!q.trim()) return base;
    return [...base, ...filterCommands(q, this.searchSources)];
  });
  protected readonly grouped = computed(() => groupCommandsByKind(this.filtered()));

  protected readonly flatRows = computed<readonly FlatRow[]>(() => {
    const out: FlatRow[] = [];
    for (const group of this.grouped()) {
      let first = true;
      for (const r of group.items) {
        out.push({ result: r, groupHeader: first ? this.kindLabels()[group.kind] : undefined });
        first = false;
      }
    }
    return out;
  });

  protected readonly flatResults = computed(() => this.flatRows().map((r) => r.result));

  private resumeShortcuts: (() => void) | null = null;

  constructor() {
    // Register ⌘K shortcut to open. It's allowed-in-input so it works while
    // typing in form fields (a la Linear / Stripe).
    const disposeShortcut = this.shortcuts.register({
      id: 'command-palette',
      description: 'shortcut.palette.open',
      keys: ['mod+k'],
      category: 'shortcut.category.navigation',
      iconName: 'search',
      allowInInput: true,
      handler: () => this.state.toggle(),
    });
    this.destroyRef.onDestroy(disposeShortcut);

    // Suspend the global shortcut registry while the palette is open so other
    // bindings don't fire while the user is typing / navigating results. We
    // resume on close.
    effect(() => {
      const open = this.visible();
      if (open && !this.resumeShortcuts) {
        this.resumeShortcuts = this.shortcuts.suspend();
      } else if (!open && this.resumeShortcuts) {
        this.resumeShortcuts();
        this.resumeShortcuts = null;
      }
    });

    // Reset query + cursor each time the palette opens; auto-focus the input.
    effect(() => {
      if (this.visible()) {
        this.query.set('');
        this.cursor.set(0);
        queueMicrotask(() => this.searchInputRef()?.nativeElement?.focus());
      }
    });

    // Reset cursor whenever the filtered result shape changes.
    effect(() => {
      void this.flatResults();
      this.cursor.set(0);
    });

    // Auto-scroll the selected row into view (fixes the DDL scroll bug).
    effect(() => {
      const i = this.cursor();
      const els = this.rowEls();
      if (!this.visible()) return;
      // Defer so the DOM reflects the new selected class first.
      queueMicrotask(() => {
        els[i]?.nativeElement?.scrollIntoView({ block: 'nearest' });
      });
    });

    this.destroyRef.onDestroy(() => {
      if (this.resumeShortcuts) {
        this.resumeShortcuts();
        this.resumeShortcuts = null;
      }
    });
  }

  protected close(): void {
    this.state.hide();
  }

  protected onBackdropClick(event: MouseEvent, hostEl: HTMLElement): void {
    if (event.target === hostEl) this.close();
  }

  /**
   * Palette-local keyboard handling. The global service is suspended while we're
   * open, so this listener fully owns key dispatch. We re-handle `mod+k` here so
   * users can toggle the palette closed with the same combo that opened it.
   */
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.visible()) return;

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.close();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }

    const total = this.flatResults().length;
    if (total === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.cursor.update((c) => (c + 1) % total);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.cursor.update((c) => (c - 1 + total) % total);
    } else if (event.key === 'Home') {
      event.preventDefault();
      this.cursor.set(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      this.cursor.set(total - 1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const r = this.flatResults()[this.cursor()];
      if (r) this.activate(r);
    }
  }

  protected onQueryInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected clearQuery(): void {
    this.query.set('');
  }

  protected activate(result: CommandResult): void {
    this.close();
    if (result.handler) {
      result.handler();
      return;
    }
    if (!result.href) return;
    // Internal vs external
    if (/^https?:\/\//.test(result.href)) {
      if (this.isBrowser) {
        const win = this.document.defaultView;
        win?.open(result.href, '_blank', 'noopener,noreferrer');
      }
      return;
    }
    // Internal navigation — router handles same-route fragment hash too.
    void this.router.navigate([result.href], {
      fragment: result.fragment,
    });
  }

  protected kindOf(kind: CommandKind): string {
    return KIND_ORDER.includes(kind) ? kind : 'page';
  }
}
