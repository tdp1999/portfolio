import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ConfirmDialogComponent,
  type ConfirmDialogData,
  FilterBarComponent,
  FilterSearchComponent,
  FilterSelectComponent,
  SpinnerOverlayComponent,
  ToastService,
} from '@portfolio/console/shared/ui';
import { forkJoin, Observable } from 'rxjs';
import { ContactMessageListItem, MessageService } from '../message.service';
import { RelativeTimePipe } from '../pipes/relative-time.pipe';

const STATUS_OPTIONS = [
  { value: 'UNREAD', label: 'Unread' },
  { value: 'READ', label: 'Read' },
  { value: 'REPLIED', label: 'Replied' },
  { value: 'ARCHIVED', label: 'Archived' },
];

const PURPOSE_OPTIONS = [
  { value: 'GENERAL', label: 'General' },
  { value: 'JOB_OPPORTUNITY', label: 'Job Opportunity' },
  { value: 'FREELANCE', label: 'Freelance' },
  { value: 'COLLABORATION', label: 'Collaboration' },
  { value: 'BUG_REPORT', label: 'Bug Report' },
  { value: 'OTHER', label: 'Other' },
];

@Component({
  selector: 'console-messages-page',
  standalone: true,
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatCheckboxModule,
    MatChipsModule,
    MatIconModule,
    MatMenuModule,
    SpinnerOverlayComponent,
    FilterBarComponent,
    FilterSearchComponent,
    FilterSelectComponent,
    RelativeTimePipe,
  ],
  templateUrl: './messages-page.html',
  styleUrl: './messages-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MessagesPageComponent implements OnInit {
  private readonly messageService = inject(MessageService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);

  readonly paginator = viewChild.required(MatPaginator);
  readonly displayedColumns = ['select', 'status', 'name', 'purpose', 'subject', 'createdAt', 'actions'];
  readonly statusOptions = STATUS_OPTIONS;
  readonly purposeOptions = PURPOSE_OPTIONS;

  readonly messages = signal<ContactMessageListItem[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(20);
  readonly search = signal('');
  readonly statusFilter = signal('');
  readonly purposeFilter = signal('');
  readonly selected = signal<Set<string>>(new Set());

  readonly activeFilters = computed(() => {
    const filters: { key: string; label: string }[] = [];
    const s = this.search();
    if (s) filters.push({ key: 'search', label: `Search: ${s}` });
    const st = this.statusFilter();
    if (st)
      filters.push({ key: 'status', label: `Status: ${STATUS_OPTIONS.find((o) => o.value === st)?.label ?? st}` });
    const p = this.purposeFilter();
    if (p)
      filters.push({ key: 'purpose', label: `Purpose: ${PURPOSE_OPTIONS.find((o) => o.value === p)?.label ?? p}` });
    return filters;
  });

  readonly hasSelection = computed(() => this.selected().size > 0);
  readonly selectedCount = computed(() => this.selected().size);
  readonly allSelected = computed(() => {
    const items = this.messages();
    return items.length > 0 && this.selected().size === items.length;
  });

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams;
    if (params['search']) this.search.set(params['search']);
    if (params['status']) this.statusFilter.set(params['status']);
    if (params['purpose']) this.purposeFilter.set(params['purpose']);
    if (params['page']) this.pageIndex.set(Math.max(0, Number(params['page']) - 1));
    this.loadMessages();
  }

  onSearchChange(value: string): void {
    this.search.set(value);
    this.resetAndLoad();
  }

  onStatusChange(value: string): void {
    this.statusFilter.set(value);
    this.resetAndLoad();
  }

  onPurposeChange(value: string): void {
    this.purposeFilter.set(value);
    this.resetAndLoad();
  }

  removeFilter(key: string): void {
    switch (key) {
      case 'search':
        this.search.set('');
        break;
      case 'status':
        this.statusFilter.set('');
        break;
      case 'purpose':
        this.purposeFilter.set('');
        break;
    }
    this.resetAndLoad();
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.selected.set(new Set());
    this.loadMessages();
  }

  openDetail(message: ContactMessageListItem): void {
    this.router.navigate(['/messages', message.id]);
  }

  toggleSelect(id: string): void {
    this.selected.update((set) => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  toggleSelectAll(): void {
    if (this.allSelected()) {
      this.selected.set(new Set());
    } else {
      this.selected.set(new Set(this.messages().map((m) => m.id)));
    }
  }

  isSelected(id: string): boolean {
    return this.selected().has(id);
  }

  bulkMarkAsRead(): void {
    const ids = [...this.selected()];
    this.executeBulkAction(ids, (id) => this.messageService.markAsRead(id), `Marked ${ids.length} messages as read`);
  }

  bulkArchive(): void {
    const ids = [...this.selected()];
    this.executeBulkAction(ids, (id) => this.messageService.archive(id), `Archived ${ids.length} messages`);
  }

  bulkDelete(): void {
    const ids = [...this.selected()];
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Messages',
        message: `Are you sure you want to delete ${ids.length} message(s)?`,
        confirmLabel: 'Delete',
      } satisfies ConfirmDialogData,
    });
    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.executeBulkAction(ids, (id) => this.messageService.softDelete(id), `Deleted ${ids.length} messages`);
    });
  }

  getStatusDotClass(message: ContactMessageListItem): string {
    if (message.isSpam) return 'dot-spam';
    switch (message.status) {
      case 'UNREAD':
        return 'dot-unread';
      case 'READ':
        return 'dot-read';
      case 'REPLIED':
        return 'dot-replied';
      case 'ARCHIVED':
        return 'dot-archived';
      default:
        return 'dot-read';
    }
  }

  getPurposeLabel(purpose: string): string {
    return PURPOSE_OPTIONS.find((o) => o.value === purpose)?.label ?? purpose;
  }

  getPurposeClass(purpose: string): string {
    switch (purpose) {
      case 'JOB_OPPORTUNITY':
        return 'badge-job';
      case 'FREELANCE':
        return 'badge-freelance';
      case 'COLLABORATION':
        return 'badge-collab';
      case 'BUG_REPORT':
        return 'badge-bug';
      default:
        return 'badge-default';
    }
  }

  isUnread(message: ContactMessageListItem): boolean {
    return message.status === 'UNREAD' && !message.isSpam;
  }

  private executeBulkAction(ids: string[], action: (id: string) => Observable<unknown>, successMessage: string): void {
    forkJoin(ids.map((id) => action(id))).subscribe({
      next: () => {
        this.toast.success(successMessage);
        this.selected.set(new Set());
        this.loadMessages();
      },
      error: () => {
        this.toast.error('Some actions failed. Refreshing list.');
        this.selected.set(new Set());
        this.loadMessages();
      },
    });
  }

  private resetAndLoad(): void {
    this.pageIndex.set(0);
    this.paginator().pageIndex = 0;
    this.selected.set(new Set());
    this.loadMessages();
  }

  private loadMessages(): void {
    this.syncQueryParams();
    this.loading.set(true);
    this.messageService
      .list({
        page: this.pageIndex() + 1,
        limit: this.pageSize(),
        search: this.search() || undefined,
        status: this.statusFilter() || undefined,
        purpose: this.purposeFilter() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.messages.set(res.data);
          this.total.set(res.total);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.toast.error('Failed to load messages');
        },
      });
  }

  private syncQueryParams(): void {
    const params: Record<string, string> = {};
    const search = this.search();
    const status = this.statusFilter();
    const purpose = this.purposeFilter();
    const page = this.pageIndex() + 1;
    if (search) params['search'] = search;
    if (status) params['status'] = status;
    if (purpose) params['purpose'] = purpose;
    if (page > 1) params['page'] = String(page);
    this.router.navigate([], { queryParams: params, replaceUrl: true });
  }
}
