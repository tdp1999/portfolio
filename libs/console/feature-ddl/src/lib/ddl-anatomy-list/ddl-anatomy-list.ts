import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { FilterBar, FilterSearch, FilterSelect, SkeletonTable, type FilterOption } from '@portfolio/console/shared/ui';

type Status = 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
interface ProjectRow {
  id: string;
  title: string;
  status: Status;
  tags: string[];
  updated: string;
}
type ViewState = 'data' | 'loading' | 'empty' | 'error';

/**
 * DDL ANATOMY — List page reference. Shows every list-page element from the audit:
 * breadcrumbs · page header (title + count + primary + overflow) · toolbar
 * (search + filter chips + sort + columns) · active-filter chips + result count ·
 * bulk-selection contextual bar · table (select + status badge + row overflow) ·
 * pagination · loading / empty / error states. Boxed, centered container.
 * Mock data — iterate on this directly.
 */
@Component({
  selector: 'console-ddl-anatomy-list',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatMenuModule,
    MatPaginatorModule,
    MatTableModule,
    FilterBar,
    FilterSearch,
    FilterSelect,
    SkeletonTable,
  ],
  templateUrl: './ddl-anatomy-list.html',
  styleUrl: '../ddl-anatomy.shared.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DdlAnatomyList {
  readonly viewState = signal<ViewState>('data');
  readonly states: ViewState[] = ['data', 'loading', 'empty', 'error'];

  private readonly allRows: ProjectRow[] = [
    {
      id: 'p1',
      title: 'Realestatedoc Console',
      status: 'PUBLISHED',
      tags: ['Angular', 'NestJS'],
      updated: '2 days ago',
    },
    { id: 'p2', title: 'Document Engine', status: 'PUBLISHED', tags: ['TypeScript', 'DDD'], updated: '5 days ago' },
    { id: 'p3', title: 'Portfolio Landing', status: 'DRAFT', tags: ['SSR', 'Angular'], updated: '1 week ago' },
    { id: 'p4', title: 'Fintech Ledger', status: 'ARCHIVED', tags: ['Banking'], updated: '3 weeks ago' },
    { id: 'p5', title: 'Design Bank', status: 'DRAFT', tags: ['UX'], updated: '1 month ago' },
  ];

  readonly search = signal('');
  readonly statusFilter = signal<Status | null>(null);
  readonly statusOptions: FilterOption[] = [
    { value: 'PUBLISHED', label: 'Published' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'ARCHIVED', label: 'Archived' },
  ];

  onStatusChange(value: string): void {
    this.statusFilter.set(value ? (value as Status) : null);
  }

  readonly rows = computed(() => {
    const q = this.search().toLowerCase();
    const st = this.statusFilter();
    return this.allRows.filter((r) => (!q || r.title.toLowerCase().includes(q)) && (!st || r.status === st));
  });

  readonly total = this.allRows.length;
  readonly displayed = ['select', 'title', 'status', 'tags', 'updated', 'actions'];

  // Bulk selection
  readonly selected = signal<Set<string>>(new Set());
  readonly selectedCount = computed(() => this.selected().size);
  readonly allSelected = computed(() => this.rows().length > 0 && this.rows().every((r) => this.selected().has(r.id)));

  toggleRow(id: string): void {
    const next = new Set(this.selected());
    next.has(id) ? next.delete(id) : next.add(id);
    this.selected.set(next);
  }

  toggleAll(): void {
    if (this.allSelected()) {
      this.selected.set(new Set());
    } else {
      this.selected.set(new Set(this.rows().map((r) => r.id)));
    }
  }

  clearSelection(): void {
    this.selected.set(new Set());
  }

  clearFilters(): void {
    this.search.set('');
    this.statusFilter.set(null);
  }

  readonly hasActiveFilters = computed(() => this.search().length > 0 || this.statusFilter() !== null);
}
