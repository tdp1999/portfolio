import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, OnInit, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { FILTER_DEBOUNCE_MS } from '@portfolio/console/shared/util';

@Component({
  selector: 'console-filter-search',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule],
  template: `
    <mat-form-field subscriptSizing="dynamic" class="filter-field min-w-[250px]">
      <mat-label>{{ label() }}</mat-label>
      <input matInput [ngModel]="value" (ngModelChange)="onValueChange($event)" [placeholder]="placeholder()" />
      <mat-icon matPrefix>search</mat-icon>
      @if (value) {
        <button matSuffix mat-icon-button (click)="clear()">
          <mat-icon>close</mat-icon>
        </button>
      }
    </mat-form-field>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterSearchComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly input$ = new Subject<string>();

  readonly label = input('Search');
  readonly placeholder = input('Search...');
  readonly debounce = input(FILTER_DEBOUNCE_MS);
  readonly searchChange = output<string>();

  value = '';

  ngOnInit(): void {
    this.input$
      .pipe(debounceTime(this.debounce()), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => this.searchChange.emit(val));
  }

  onValueChange(val: string): void {
    this.value = val;
    this.input$.next(val);
  }

  clear(): void {
    this.value = '';
    this.input$.next('');
  }
}
