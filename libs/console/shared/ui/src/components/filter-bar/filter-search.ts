import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  linkedSignal,
  OnInit,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { debounceTime, filter, Subject, tap } from 'rxjs';
import { FILTER_DEBOUNCE_MS } from '@portfolio/console/shared/util';

@Component({
  selector: 'console-filter-search',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule],
  template: `
    <mat-form-field subscriptSizing="dynamic" class="filter-field w-full">
      <mat-label>{{ label() }}</mat-label>
      <input matInput [ngModel]="text()" (ngModelChange)="onValueChange($event)" [placeholder]="placeholder()" />
      <mat-icon matPrefix>search</mat-icon>
      @if (text()) {
        <button matSuffix mat-icon-button (click)="clear()">
          <mat-icon>close</mat-icon>
        </button>
      }
    </mat-form-field>
  `,
  // The host is the flex item of the filter bar, so it (not the inner field) has to grow.
  host: { class: 'block flex-1 min-w-[300px] max-w-[1200px]' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterSearch implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly input$ = new Subject<string>();

  readonly label = input('Search');
  readonly placeholder = input('Search...');
  readonly debounce = input(FILTER_DEBOUNCE_MS);
  /** Optional: the parent's search state, so a value restored from the URL or cleared elsewhere shows in the box. */
  readonly value = input('');
  readonly searchChange = output<string>();

  protected readonly text = linkedSignal(() => this.value());
  /** Last value the parent knows about; typing it again emits nothing. */
  private known = '';

  constructor() {
    effect(() => {
      this.known = this.value();
    });
  }

  ngOnInit(): void {
    this.input$
      .pipe(
        debounceTime(this.debounce()),
        filter((val) => val !== this.known),
        tap((val) => (this.known = val)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((val) => this.searchChange.emit(val));
  }

  onValueChange(val: string): void {
    this.text.set(val);
    this.input$.next(val);
  }

  clear(): void {
    this.text.set('');
    this.input$.next('');
  }
}
