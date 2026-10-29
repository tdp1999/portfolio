import { HttpErrorResponse } from '@angular/common/http';
import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  ConfirmDialogComponent,
  type ConfirmDialogData,
  EnumLabelPipe,
  Paginator,
  type PaginatorChange,
  ProgressBarService,
  RelativeTime,
  SetHasPipe,
  SkeletonTable,
  ToastService,
  withListLoading,
} from '@portfolio/console/shared/ui';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@portfolio/console/shared/util';
import { MEDICAL_ITEM_KIND_LABELS } from '@portfolio/shared/enum-labels';
import { medicalItemDisplay } from '@portfolio/shared/utils/lite';
import { BreakpointObserverService } from '@portfolio/shared/features/breakpoint-observer';
import { filter } from 'rxjs';
import { MedicineCabinetService } from '../medicine-cabinet.service';
import type { HealthProfileDto, MedicalItemDto } from '../medicine-cabinet.types';

/** One row of S1: the item with its display name and the name of its person. */
interface MedicalItemRow {
  item: MedicalItemDto;
  primary: string;
  secondary: string | null;
  personName: string;
}

/** 'S1 Danh sách sản phẩm' and 'S3 Hộp xóa sản phẩm'. The person filter lives in `?person=` (R10.8). */
@Component({
  selector: 'console-medical-item-list',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSelectModule,
    MatTableModule,
    MatTooltipModule,
    RouterLink,
    EnumLabelPipe,
    Paginator,
    RelativeTime,
    SetHasPipe,
    SkeletonTable,
  ],
  templateUrl: './medical-item.list.html',
  styleUrl: './medical-item.list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MedicalItemList implements OnInit {
  private readonly service = inject(MedicineCabinetService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly progress = inject(ProgressBarService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly breakpoints = inject(BreakpointObserverService);

  protected readonly kindLabels = MEDICAL_ITEM_KIND_LABELS;
  protected readonly displayedColumns = ['name', 'person', 'type', 'travel', 'updatedAt', 'actions'];
  protected readonly pageSizeOptions = PAGE_SIZE_OPTIONS;

  private readonly items = signal<MedicalItemDto[]>([]);
  protected readonly people = signal<HealthProfileDto[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(false);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  protected readonly personId = signal<string | null>(null);
  protected readonly deletingIds = signal<ReadonlySet<string>>(new Set());
  /** Below tablet the table becomes a one-column card list and the header actions move into a menu (Q-43). */
  protected readonly useCards = computed(() => !this.breakpoints.isAtLeast('tablet'));

  protected readonly rows = computed<MedicalItemRow[]>(() => {
    const names = new Map(this.people().map((p) => [p.id, p.name]));
    return this.items().map((item) => {
      const { primary, secondary } = medicalItemDisplay(item);
      return { item, primary, secondary, personName: names.get(item.profileId) ?? '' };
    });
  });

  /**
   * Name of the filtered person, for the "{name} has no items yet" state. The state follows the
   * filter, not the people request, so a late or deleted person still offers "Clear filter".
   */
  protected readonly filteredPersonName = computed(() => {
    const id = this.personId();
    return id ? (this.people().find((p) => p.id === id)?.name ?? 'This person') : null;
  });

  ngOnInit(): void {
    this.service.listProfiles().subscribe({ next: (people) => this.people.set(people) });
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.personId.set(params.get('person'));
      this.pageIndex.set(0);
      this.load();
    });
  }

  protected onPersonChange(personId: string | null): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: { person: personId } });
  }

  protected clearFilter(): void {
    this.onPersonChange(null);
  }

  protected onPage(event: PaginatorChange): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  protected confirmDelete(row: MedicalItemRow): void {
    if (this.deletingIds().has(row.item.id)) return;
    const data: ConfirmDialogData = {
      title: 'Delete item?',
      message: `Delete ${row.primary} of ${row.personName}? This cannot be undone.`,
      confirmLabel: 'Delete',
    };
    this.dialog
      .open(ConfirmDialogComponent, { data })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => this.delete(row.item.id));
  }

  private delete(id: string): void {
    this.setDeleting(id, true);
    // A 404 means the item was deleted somewhere else first: the result is the same (R13.9).
    const done = () => {
      this.setDeleting(id, false);
      this.toast.success('Item deleted');
      this.load({ silent: true });
    };
    this.service.deleteItem(id).subscribe({
      next: done,
      error: (err: HttpErrorResponse) => (err.status === 404 ? done() : this.setDeleting(id, false)),
    });
  }

  private setDeleting(id: string, on: boolean): void {
    this.deletingIds.update((ids) => {
      const next = new Set(ids);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  private load(opts: { silent?: boolean } = {}): void {
    const profileId = this.personId() ?? undefined;
    this.service
      .listItems({ page: this.pageIndex() + 1, limit: this.pageSize(), ...(profileId ? { profileId } : {}) })
      .pipe(withListLoading({ silent: opts.silent, loading: this.loading, progress: this.progress }))
      .subscribe({
        next: (res) => {
          // Deleting the last item of a later page leaves it empty: show the page before it instead.
          if (res.data.length === 0 && res.total > 0 && this.pageIndex() > 0) {
            this.pageIndex.update((i) => i - 1);
            this.load(opts);
            return;
          }
          this.items.set(res.data);
          this.total.set(res.total);
        },
      });
  }
}
