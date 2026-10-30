import { DOCUMENT } from '@angular/common';
import type { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Button,
  Container,
  EmptyState,
  FilterChip,
  Input,
  LandingCopyPipe,
  LandingLocaleService,
  Link,
  LoadingSpinner,
  resolveCopy,
  ViewToggle,
  type ViewToggleOption,
} from '@portfolio/landing/shared/ui';
import type { MedicineLookupItem } from '@portfolio/shared/types';
import { medicalItemDisplay } from '@portfolio/shared/utils/lite';
import { debounceTime, distinctUntilChanged, skip } from 'rxjs';

import { MedicineCabinetService } from '../medicine-cabinet.service';
import { CONSOLE_URL } from '../medicine-cabinet.tokens';
import { MedicineLookupItemActions } from '../medicine-lookup.item-actions/medicine-lookup.item-actions';
import { MedicineLookupItemName } from '../medicine-lookup.item-name/medicine-lookup.item-name';
import {
  editHref,
  filterLookup,
  groupByPerson,
  personChips,
  toLookupRow,
  type LookupGroup,
  type LookupRowCopy,
  type LookupSubtable,
} from '../medicine-lookup.util';

type LookupView = 'rows' | 'cards';
type LoadState = 'loading' | 'ready' | 'forbidden' | 'failed';
/** Which empty state replaces the results, if any (S6 copy table). */
type EmptyKind = 'none' | 'travel' | 'filtered' | null;

/** The chosen view is remembered per device (R9.2). */
const VIEW_STORAGE_KEY = 'medicine-cabinet.view';
/** Scroll position saved before the edit link leaves the page, read once on the way back (R16.3). */
const SCROLL_STORAGE_KEY = 'medicine-cabinet.scroll';

interface SavedScroll {
  url: string;
  top: number;
}
/** The keyword and chips reach the URL once typing pauses (P12). */
const URL_DEBOUNCE_MS = 250;

/**
 * 'S6 Trang tra cứu': every item of every person, grouped by person, searched and filtered on the
 * client. The keyword and chips live on the URL (`?q=`, `?person=`, `?travel=1`), so the edit link's
 * `returnTo` brings the Owner back to the same view.
 */
@Component({
  selector: 'landing-medicine-lookup',
  imports: [
    ReactiveFormsModule,
    Button,
    Container,
    EmptyState,
    FilterChip,
    Input,
    LandingCopyPipe,
    Link,
    LoadingSpinner,
    MedicineLookupItemActions,
    MedicineLookupItemName,
    ViewToggle,
  ],
  templateUrl: './medicine-lookup.html',
  styleUrl: './medicine-lookup.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MedicineLookup {
  private readonly service = inject(MedicineCabinetService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly consoleUrl = inject(CONSOLE_URL);
  protected readonly locale = inject(LandingLocaleService).locale;

  private readonly initial = this.route.snapshot.queryParamMap;
  protected readonly search = new FormControl(this.initial.get('q') ?? '', { nonNullable: true });
  private readonly q = toSignal(this.search.valueChanges, { initialValue: this.search.value });
  protected readonly personId = signal<string | null>(this.initial.get('person'));
  protected readonly travel = signal(this.initial.get('travel') === '1');

  protected readonly view = signal<LookupView>(this.readStoredView());
  protected readonly viewOptions = computed<ViewToggleOption[]>(() => {
    const locale = this.locale();
    return [
      { id: 'rows', label: resolveCopy('medicineCabinet.view.rows', locale), icon: 'list', testId: 'view-rows' },
      {
        id: 'cards',
        label: resolveCopy('medicineCabinet.view.cards', locale),
        icon: 'layout-grid',
        testId: 'view-cards',
      },
    ];
  });
  protected readonly state = signal<LoadState>('loading');
  private readonly items = signal<MedicineLookupItem[]>([]);
  private readonly openNotes = signal<ReadonlySet<string>>(new Set());

  protected readonly chips = computed(() => personChips(this.items()));
  protected readonly hasItems = computed(() => this.items().length > 0);

  private readonly queryParams = computed(() => ({
    q: this.q().trim() || null,
    person: this.personId(),
    travel: this.travel() ? '1' : null,
  }));

  /** Full S6 URL with the current keyword and chips, for the edit links (R16.1). */
  private readonly returnTo = computed(() => {
    const tree = this.router.createUrlTree([], { relativeTo: this.route, queryParams: this.queryParams() });
    return `${this.document.location?.origin ?? ''}${this.router.serializeUrl(tree)}`;
  });

  private readonly matches = computed(() =>
    filterLookup(this.items(), { q: this.q(), personId: this.personId(), travel: this.travel() })
  );

  protected readonly empty = computed<EmptyKind>(() => {
    if (!this.hasItems()) return 'none';
    // "Chưa có sản phẩm mang đi" only when nobody has the label; otherwise the filters miss (R14.3, R14.7).
    if (this.travel() && !this.items().some((item) => item.packForTravel)) return 'travel';
    return this.matches().length === 0 ? 'filtered' : null;
  });

  private readonly rowCopy = computed<LookupRowCopy>(() => {
    const locale = this.locale();
    return {
      fieldLabels: {
        'item-strength': resolveCopy('medicineCabinet.field.strength', locale),
        'item-dose': resolveCopy('medicineCabinet.field.dose', locale),
        'item-timing': resolveCopy('medicineCabinet.field.timing', locale),
        'item-usage': resolveCopy('medicineCabinet.field.usage', locale),
        'item-purpose': resolveCopy('medicineCabinet.field.purpose', locale),
      },
      timing: {
        BEFORE_MEAL: resolveCopy('medicineCabinet.timing.BEFORE_MEAL', locale),
        AFTER_MEAL: resolveCopy('medicineCabinet.timing.AFTER_MEAL', locale),
        WITH_MEAL: resolveCopy('medicineCabinet.timing.WITH_MEAL', locale),
        ANY_TIME: resolveCopy('medicineCabinet.timing.ANY_TIME', locale),
      },
      usage: {
        LONG_TERM: resolveCopy('medicineCabinet.usage.LONG_TERM', locale),
        COURSE: resolveCopy('medicineCabinet.usage.COURSE', locale),
      },
    };
  });

  /** Column headers of the rows view, before the actions column. A supply has no medicine column (R6.7). */
  private readonly medicineColumns = computed(() => {
    const labels = this.rowCopy().fieldLabels;
    return [
      resolveCopy('medicineCabinet.field.name', this.locale()),
      labels['item-strength'],
      labels['item-dose'],
      labels['item-timing'],
      labels['item-usage'],
      labels['item-purpose'],
    ];
  });
  private readonly supplyColumns = computed(() => [
    resolveCopy('medicineCabinet.field.name', this.locale()),
    this.rowCopy().fieldLabels['item-purpose'],
  ]);

  protected readonly groups = computed<LookupGroup[]>(() => {
    const locale = this.locale();
    const copy = this.rowCopy();
    const returnTo = this.returnTo();
    const openNotes = this.openNotes();
    return groupByPerson(this.matches()).map((group) => {
      const items = group.items.map((item) =>
        toLookupRow(
          item,
          copy,
          {
            href: editHref(this.consoleUrl, item.id, returnTo),
            label: resolveCopy('medicineCabinet.edit', locale, { item: medicalItemDisplay(item).primary }),
          },
          openNotes.has(item.id)
        )
      );
      const subtables: LookupSubtable[] = [
        {
          testId: 'subtable-medicine',
          heading: resolveCopy('medicineCabinet.subtable.medicine', locale),
          columns: this.medicineColumns(),
          rows: items.filter((row) => !row.isSupply),
        },
        {
          testId: 'subtable-supply',
          heading: resolveCopy('medicineCabinet.subtable.supply', locale),
          columns: this.supplyColumns(),
          rows: items.filter((row) => row.isSupply),
        },
      ];
      return {
        personId: group.personId,
        heading:
          group.items.length === 1
            ? resolveCopy('medicineCabinet.group.headingOne', locale, { name: group.personName })
            : resolveCopy('medicineCabinet.group.heading', locale, { name: group.personName, n: group.items.length }),
        items,
        subtables: subtables.filter((table) => table.rows.length > 0),
      };
    });
  });

  constructor() {
    toObservable(this.queryParams)
      .pipe(
        skip(1),
        debounceTime(URL_DEBOUNCE_MS),
        distinctUntilChanged((a, b) => a.q === b.q && a.person === b.person && a.travel === b.travel),
        takeUntilDestroyed()
      )
      .subscribe((queryParams) => {
        void this.router.navigate([], { relativeTo: this.route, queryParams, replaceUrl: true });
      });
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.service
      .lookup()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.items.set(items);
          this.state.set('ready');
          this.restoreScroll();
        },
        error: (error: HttpErrorResponse) => this.state.set(error.status === 403 ? 'forbidden' : 'failed'),
      });
  }

  /** A new person chip replaces the old one; pressing the selected chip again unselects it (R5.8). */
  protected togglePerson(id: string): void {
    this.personId.update((current) => (current === id ? null : id));
  }

  protected toggleTravel(): void {
    this.travel.update((on) => !on);
  }

  protected clearFilters(): void {
    this.search.setValue('');
    this.personId.set(null);
    this.travel.set(false);
  }

  protected toggleNote(id: string): void {
    this.openNotes.update((open) => {
      const next = new Set(open);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  protected setView(view: LookupView): void {
    this.view.set(view);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, view);
    } catch {
      // Storage off (private mode, blocked): the choice lasts for this visit only (R9.3).
    }
  }

  protected saveScroll(): void {
    // The position belongs to this exact S6 URL, so a later visit with other filters starts at the top.
    const saved: SavedScroll = { url: this.returnTo(), top: this.document.defaultView?.scrollY ?? 0 };
    try {
      sessionStorage.setItem(SCROLL_STORAGE_KEY, JSON.stringify(saved));
    } catch {
      // Storage off: the Owner comes back at the top of the page.
    }
  }

  private readStoredView(): LookupView {
    try {
      return localStorage.getItem(VIEW_STORAGE_KEY) === 'cards' ? 'cards' : 'rows';
    } catch {
      return 'rows';
    }
  }

  private restoreScroll(): void {
    let saved: Partial<SavedScroll>;
    try {
      const raw = sessionStorage.getItem(SCROLL_STORAGE_KEY);
      if (raw === null) return;
      sessionStorage.removeItem(SCROLL_STORAGE_KEY);
      saved = JSON.parse(raw);
    } catch {
      return;
    }
    const { url, top } = saved;
    if (url !== this.returnTo() || typeof top !== 'number' || !Number.isFinite(top) || top <= 0) return;
    afterNextRender(() => this.document.defaultView?.scrollTo({ top }), { injector: this.injector });
  }
}
