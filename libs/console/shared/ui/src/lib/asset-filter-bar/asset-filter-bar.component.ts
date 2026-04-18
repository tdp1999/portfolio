import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { FILTER_DEBOUNCE_MS } from '@portfolio/console/shared/util';
import {
  DEFAULT_SORT,
  MIME_GROUPS,
  MIME_GROUP_LABELS,
  MimeGroup,
  SORT_LABELS,
  SORT_OPTIONS,
  SortOption,
  UPLOAD_FOLDER_LABELS,
  UPLOAD_FOLDERS,
  UploadFolder,
} from './asset-filter-bar.types';

@Component({
  selector: 'console-asset-filter-bar',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule, MatButtonModule],
  templateUrl: './asset-filter-bar.component.html',
  styleUrl: './asset-filter-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssetFilterBarComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly search$ = new Subject<string>();

  readonly search = input<string>('');
  readonly mimeGroup = input<MimeGroup | null>(null);
  readonly folder = input<UploadFolder | null>(null);
  readonly sort = input<SortOption>(DEFAULT_SORT);
  readonly foldersAvailable = input<readonly UploadFolder[]>(UPLOAD_FOLDERS);
  readonly showMimeChips = input(true);
  readonly debounce = input(FILTER_DEBOUNCE_MS);

  readonly searchChange = output<string>();
  readonly mimeGroupChange = output<MimeGroup | null>();
  readonly folderChange = output<UploadFolder | null>();
  readonly sortChange = output<SortOption>();
  readonly clearAll = output<void>();

  protected readonly searchValue = signal('');

  protected readonly mimeGroups = MIME_GROUPS;
  protected readonly mimeGroupLabels = MIME_GROUP_LABELS;
  protected readonly sortOptions = SORT_OPTIONS;
  protected readonly sortLabels = SORT_LABELS;
  protected readonly folderLabels = UPLOAD_FOLDER_LABELS;
  protected readonly defaultSort = DEFAULT_SORT;

  protected readonly hasActiveFilters = computed(
    () =>
      this.searchValue().length > 0 ||
      this.mimeGroup() !== null ||
      this.folder() !== null ||
      this.sort() !== DEFAULT_SORT
  );

  constructor() {
    effect(() => {
      const incoming = this.search();
      if (incoming !== this.searchValue()) {
        this.searchValue.set(incoming);
      }
    });
  }

  ngOnInit(): void {
    this.search$
      .pipe(debounceTime(this.debounce()), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => this.searchChange.emit(val));
  }

  protected onSearchInput(val: string): void {
    this.searchValue.set(val);
    this.search$.next(val);
  }

  protected clearSearch(): void {
    this.searchValue.set('');
    this.search$.next('');
  }

  protected toggleMimeGroup(group: MimeGroup): void {
    this.mimeGroupChange.emit(this.mimeGroup() === group ? null : group);
  }

  protected onFolderChange(value: UploadFolder | ''): void {
    this.folderChange.emit(value === '' ? null : value);
  }

  protected onSortChange(value: SortOption): void {
    this.sortChange.emit(value);
  }

  protected resetAll(): void {
    this.searchValue.set('');
    this.search$.next('');
    this.mimeGroupChange.emit(null);
    this.folderChange.emit(null);
    this.sortChange.emit(DEFAULT_SORT);
    this.clearAll.emit();
  }
}
