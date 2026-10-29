import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import {
  ConfirmDialogComponent,
  type ConfirmDialogData,
  ProgressBarService,
  SetHasPipe,
  SkeletonTable,
  ToastService,
  withListLoading,
} from '@portfolio/console/shared/ui';
import { BreakpointObserverService } from '@portfolio/shared/features/breakpoint-observer';
import { filter } from 'rxjs';
import HealthProfileNameDialog, {
  type HealthProfileNameDialogData,
  type HealthProfileNameDialogResult,
} from '../health-profile.name-dialog/health-profile.name-dialog';
import { MedicineCabinetService } from '../medicine-cabinet.service';
import type { HealthProfileDto } from '../medicine-cabinet.types';

/** 'S5 Hộp xóa người': the item count tells the Owner what goes with the person (R7.3, R7.5). */
export function deletePersonDialogData(person: HealthProfileDto): ConfirmDialogData {
  const { name, itemCount } = person;
  return {
    title: `Delete ${name}?`,
    message:
      itemCount === 0
        ? `${name} has no items.`
        : `${name} has ${itemCount} ${itemCount === 1 ? 'item' : 'items'}. They will be deleted too.`,
    confirmLabel: itemCount === 0 ? 'Delete' : 'Delete all',
  };
}

/** 'S4 Trang người': people of the medicine cabinet, with add, rename and delete. */
@Component({
  selector: 'console-health-profile-list',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    RouterLink,
    SetHasPipe,
    SkeletonTable,
  ],
  templateUrl: './health-profile.list.html',
  styleUrl: './health-profile.list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class HealthProfileList implements OnInit {
  private readonly service = inject(MedicineCabinetService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly progress = inject(ProgressBarService);
  private readonly breakpoints = inject(BreakpointObserverService);

  protected readonly displayedColumns = ['name', 'items', 'actions'];
  protected readonly people = signal<HealthProfileDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly deletingIds = signal<ReadonlySet<string>>(new Set());
  /** Below tablet the table becomes a one-column card list (Q-43). */
  protected readonly useCards = computed(() => !this.breakpoints.isAtLeast('tablet'));

  ngOnInit(): void {
    this.load();
  }

  protected add(): void {
    this.openNameDialog({ mode: 'add' });
  }

  protected rename(person: HealthProfileDto): void {
    this.openNameDialog({ mode: 'rename', id: person.id, name: person.name });
  }

  protected confirmDelete(person: HealthProfileDto): void {
    if (this.deletingIds().has(person.id)) return;
    this.dialog
      .open(ConfirmDialogComponent, { data: deletePersonDialogData(person) })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => this.delete(person.id));
  }

  private openNameDialog(data: HealthProfileNameDialogData): void {
    this.dialog
      .open<HealthProfileNameDialog, HealthProfileNameDialogData, HealthProfileNameDialogResult>(
        HealthProfileNameDialog,
        { data, width: '480px', maxWidth: '100vw' }
      )
      .afterClosed()
      .pipe(filter((result) => result !== undefined))
      .subscribe(() => this.load({ silent: true }));
  }

  private delete(id: string): void {
    this.setDeleting(id, true);
    // A 404 means another tab deleted the person first: the result is the same (Q-47).
    const done = () => {
      this.setDeleting(id, false);
      this.toast.success('Person deleted');
      this.load({ silent: true });
    };
    this.service.deleteProfile(id).subscribe({
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
    this.service
      .listProfiles()
      .pipe(withListLoading({ silent: opts.silent, loading: this.loading, progress: this.progress }))
      .subscribe({ next: (people) => this.people.set(people) });
  }
}
