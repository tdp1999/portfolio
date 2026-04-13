import { ChangeDetectionStrategy, Component, inject, OnInit, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  ConfirmDialogComponent,
  type ConfirmDialogData,
  FilterBarComponent,
  FilterSearchComponent,
  SpinnerOverlayComponent,
  ToastService,
} from '@portfolio/console/shared/ui';
import { CategoryDialogData } from '../category-dialog/category-dialog';
import { AdminCategory, CategoryService } from '../category.service';

@Component({
  selector: 'console-categories-page',
  standalone: true,
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    SpinnerOverlayComponent,
    FilterBarComponent,
    FilterSearchComponent,
  ],
  templateUrl: './categories-page.html',
  styleUrl: './categories-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CategoriesPageComponent implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);

  readonly paginator = viewChild.required(MatPaginator);
  readonly displayedColumns = ['name', 'slug', 'description', 'displayOrder', 'actions'];
  readonly categories = signal<AdminCategory[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(20);
  readonly search = signal('');

  ngOnInit(): void {
    this.loadCategories();
  }

  onSearchChange(value: string): void {
    this.search.set(value);
    this.resetAndLoad();
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadCategories();
  }

  openCreateDialog(): void {
    import('../category-dialog/category-dialog').then((m) => {
      const dialogRef = this.dialog.open(m.default, { width: '520px' });
      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.toast.success('Category created successfully');
          this.loadCategories();
        }
      });
    });
  }

  openEditDialog(category: AdminCategory): void {
    import('../category-dialog/category-dialog').then((m) => {
      const dialogRef = this.dialog.open(m.default, {
        width: '520px',
        data: { category } satisfies CategoryDialogData,
      });
      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.toast.success('Category updated successfully');
          this.loadCategories();
        }
      });
    });
  }

  confirmDelete(category: AdminCategory): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Category',
        message: `Are you sure you want to delete "${category.name}"?`,
        confirmLabel: 'Delete',
      } satisfies ConfirmDialogData,
    });
    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) this.deleteCategory(category.id);
    });
  }

  private resetAndLoad(): void {
    this.pageIndex.set(0);
    this.paginator().pageIndex = 0;
    this.loadCategories();
  }

  private loadCategories(): void {
    this.loading.set(true);
    this.categoryService
      .list({
        page: this.pageIndex() + 1,
        limit: this.pageSize(),
        search: this.search() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.categories.set(res.data);
          this.total.set(res.total);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.toast.error('Failed to load categories');
        },
      });
  }

  private deleteCategory(id: string): void {
    this.categoryService.delete(id).subscribe({
      next: () => {
        this.toast.success('Category deleted successfully');
        this.loadCategories();
      },
      error: () => {
        // Error toast handled by global error interceptor
      },
    });
  }
}
