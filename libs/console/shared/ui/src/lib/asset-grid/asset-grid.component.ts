import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostListener,
  afterRenderEffect,
  input,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CloudinaryThumbPipe, IsImagePipe, ReadableSizePipe } from '@portfolio/shared/ui-pipes';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { AssetGridMode, AssetGridViewMode, MediaItem } from './asset-grid.types';

@Component({
  selector: 'console-asset-grid',
  standalone: true,
  imports: [
    DatePipe,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    SkeletonComponent,
    CloudinaryThumbPipe,
    IsImagePipe,
    ReadableSizePipe,
  ],
  templateUrl: './asset-grid.component.html',
  styleUrl: './asset-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssetGridComponent {
  readonly items = input.required<readonly MediaItem[]>();
  readonly selectedIds = input<readonly string[]>([]);
  readonly mode = input<AssetGridMode>('multi');
  readonly viewMode = input<AssetGridViewMode>('grid');
  readonly loading = input(false);
  readonly currentPage = input(1);
  readonly totalPages = input(1);
  readonly skeletonCount = input(12);

  readonly selectionChange = output<string[]>();
  readonly itemActivated = output<string>();
  readonly pageChange = output<number>();

  protected readonly focusedIndex = signal(0);
  protected readonly container = viewChild<ElementRef<HTMLElement>>('container');
  protected readonly itemButtons = viewChildren<ElementRef<HTMLButtonElement>>('itemBtn');

  protected readonly selectedSet = computed(() => new Set(this.selectedIds()));
  protected readonly skeletonItems = computed(() => Array.from({ length: this.skeletonCount() }, (_, i) => i));
  protected readonly containerRole = computed(() => (this.mode() === 'multi' ? 'grid' : 'listbox'));
  protected readonly itemRole = computed(() => (this.mode() === 'multi' ? 'gridcell' : 'option'));

  constructor() {
    afterRenderEffect(() => {
      const idx = this.focusedIndex();
      const buttons = this.itemButtons();
      if (buttons[idx] && document.activeElement?.closest('.asset-grid')) {
        buttons[idx].nativeElement.focus();
      }
    });
  }

  protected onItemClick(item: MediaItem, index: number): void {
    this.focusedIndex.set(index);
    this.toggleSelection(item.id);
  }

  protected onItemDblClick(item: MediaItem): void {
    this.itemActivated.emit(item.id);
  }

  protected toggleSelection(id: string): void {
    const current = new Set(this.selectedIds());
    if (this.mode() === 'single') {
      this.selectionChange.emit(current.has(id) ? [] : [id]);
      return;
    }
    if (current.has(id)) current.delete(id);
    else current.add(id);
    this.selectionChange.emit([...current]);
  }

  @HostListener('keydown', ['$event'])
  protected onKeyDown(event: KeyboardEvent): void {
    const list = this.items();
    if (!list.length) return;
    const cols = this.viewMode() === 'list' ? 1 : this.columnCount();
    const current = this.focusedIndex();

    switch (event.key) {
      case 'ArrowRight':
        this.focusedIndex.set(Math.min(current + 1, list.length - 1));
        break;
      case 'ArrowLeft':
        this.focusedIndex.set(Math.max(current - 1, 0));
        break;
      case 'ArrowDown':
        this.focusedIndex.set(Math.min(current + cols, list.length - 1));
        break;
      case 'ArrowUp':
        this.focusedIndex.set(Math.max(current - cols, 0));
        break;
      case 'Home':
        this.focusedIndex.set(0);
        break;
      case 'End':
        this.focusedIndex.set(list.length - 1);
        break;
      case ' ':
        this.toggleSelection(list[current].id);
        break;
      case 'Enter':
        this.itemActivated.emit(list[current].id);
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  protected prevPage(): void {
    if (this.currentPage() > 1) this.pageChange.emit(this.currentPage() - 1);
  }

  protected nextPage(): void {
    if (this.currentPage() < this.totalPages()) this.pageChange.emit(this.currentPage() + 1);
  }

  private columnCount(): number {
    const el = this.container()?.nativeElement;
    if (!el) return 1;
    const template = getComputedStyle(el).gridTemplateColumns;
    if (!template || template === 'none') return 1;
    return template.split(' ').filter(Boolean).length || 1;
  }
}
