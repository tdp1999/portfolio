import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { PaginatorChange } from './paginator.types';
import { keepFirstRow, pageSlots } from './paginator.util';

/**
 * Page-size picker, row range and a numbered page strip (first, last, two siblings each side of
 * the current page, an ellipsis per hidden run that jumps five pages). Stateless: the list owns
 * `pageIndex` and `pageSize` and reloads on `page`. Narrow containers drop the strip for
 * "10 / 18" between the arrows; `compact` also drops the page-size select. Every change scrolls the console content back to the top, so a
 * new page always starts at its first row.
 */
@Component({
  selector: 'console-paginator',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatSelectModule, MatTooltipModule],
  templateUrl: './paginator.html',
  styleUrl: './paginator.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Paginator {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly length = input.required<number>();
  /** 0-based. */
  readonly pageIndex = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly pageSizeOptions = input<readonly number[]>([20, 50, 100, 200]);
  readonly disabled = input(false);
  /** For a narrow column (a split view's list): range and arrows only, no page-size select. */
  readonly compact = input(false, { transform: booleanAttribute });

  readonly page = output<PaginatorChange>();

  protected readonly pageCount = computed(() => Math.max(1, Math.ceil(this.length() / this.pageSize())));
  protected readonly slots = computed(() => pageSlots(this.pageCount(), this.pageIndex()));
  protected readonly isFirst = computed(() => this.pageIndex() === 0);
  protected readonly isLast = computed(() => this.pageIndex() >= this.pageCount() - 1);

  /** "101-150 of 896", or "0 of 0" for an empty list. */
  protected readonly rangeLabel = computed(() => {
    const total = this.length();
    if (!total) return '0 of 0';
    const from = this.pageIndex() * this.pageSize() + 1;
    const to = Math.min(from + this.pageSize() - 1, total);
    return `${from}-${to} of ${total}`;
  });

  onGoTo(pageIndex: number): void {
    const target = Math.min(Math.max(pageIndex, 0), this.pageCount() - 1);
    if (target === this.pageIndex()) return;
    this.emit({ pageIndex: target, pageSize: this.pageSize() });
  }

  onSizeChange(pageSize: number): void {
    if (pageSize === this.pageSize()) return;
    this.emit({ pageIndex: keepFirstRow(this.pageIndex(), this.pageSize(), pageSize), pageSize });
  }

  private emit(change: PaginatorChange): void {
    this.page.emit(change);
    this.host.nativeElement.closest('.console-content')?.scrollTo({ top: 0 });
  }
}
