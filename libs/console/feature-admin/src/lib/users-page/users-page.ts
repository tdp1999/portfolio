import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { AuthStore } from '@portfolio/console/shared/data-access';
import type { FilterOption } from '@portfolio/console/shared/ui';
import {
  ConfirmDialogComponent,
  type ConfirmDialogData,
  FilterBarComponent,
  FilterSearchComponent,
  FilterSelectComponent,
  SpinnerOverlayComponent,
  ToastService,
} from '@portfolio/console/shared/ui';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@portfolio/console/shared/util';
import { AdminUser, AdminUserService } from '../admin-user.service';

@Component({
  selector: 'console-users-page',
  standalone: true,
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    SpinnerOverlayComponent,
    MatTooltipModule,
    DatePipe,
    FilterBarComponent,
    FilterSearchComponent,
    FilterSelectComponent,
  ],
  templateUrl: './users-page.html',
  styleUrl: './users-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class UsersPageComponent implements OnInit {
  private readonly adminUserService = inject(AdminUserService);
  private readonly authStore = inject(AuthStore);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);

  readonly paginator = viewChild.required(MatPaginator);

  readonly displayedColumns = ['name', 'email', 'role', 'status', 'createdAt', 'actions'];

  readonly statusOptions: FilterOption[] = [
    { value: 'active', label: 'Active' },
    { value: 'invited', label: 'Invited' },
    { value: 'deleted', label: 'Deleted' },
  ];

  readonly users = signal<AdminUser[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
  readonly search = signal('');
  readonly statusFilter = signal('');

  private get currentUserId(): string {
    return this.authStore.user()?.id ?? '';
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  onSearchChange(value: string): void {
    this.search.set(value);
    this.resetAndLoad();
  }

  onStatusChange(value: string): void {
    this.statusFilter.set(value);
    this.resetAndLoad();
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadUsers();
  }

  openInviteDialog(): void {
    import('../invite-dialog/invite-dialog').then((m) => {
      const dialogRef = this.dialog.open(m.default, {
        width: '520px',
      });
      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.toast.success('User invited successfully');
          this.loadUsers();
        }
      });
    });
  }

  confirmDelete(user: AdminUser): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete User',
        message: `Are you sure you want to delete "${user.name}"? This action can be reversed later.`,
        confirmLabel: 'Delete',
      } satisfies ConfirmDialogData,
    });
    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.deleteUser(user.id);
      }
    });
  }

  canDelete(user: AdminUser): boolean {
    return user.id !== this.currentUserId && !user.deletedAt;
  }

  isDeleted(user: AdminUser): boolean {
    return !!user.deletedAt;
  }

  private resetAndLoad(): void {
    this.pageIndex.set(0);
    this.paginator().pageIndex = 0;
    this.loadUsers();
  }

  private loadUsers(): void {
    this.loading.set(true);
    this.adminUserService
      .list({
        page: this.pageIndex() + 1,
        limit: this.pageSize(),
        search: this.search() || undefined,
        status: this.statusFilter() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.users.set(res.data);
          this.total.set(res.total);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.toast.error('Failed to load users');
        },
      });
  }

  private deleteUser(id: string): void {
    this.adminUserService.softDelete(id).subscribe({
      next: () => {
        this.toast.success('User deleted successfully');
        this.loadUsers();
      },
      error: () => {
        // Error toast handled by global error interceptor
      },
    });
  }
}
