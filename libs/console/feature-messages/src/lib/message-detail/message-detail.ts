import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import {
  ConfirmDialogComponent,
  type ConfirmDialogData,
  SpinnerOverlayComponent,
  ToastService,
} from '@portfolio/console/shared/ui';
import { filter, of, switchMap, tap } from 'rxjs';
import { ContactMessageDetail, MessageService } from '../message.service';

@Component({
  selector: 'console-message-detail',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, SpinnerOverlayComponent, DatePipe],
  templateUrl: './message-detail.html',
  styleUrl: './message-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MessageDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly message = signal<ContactMessageDetail | null>(null);
  readonly loading = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadMessage(id);
  }

  goBack(): void {
    this.router.navigate(['/messages']);
  }

  markAsUnread(): void {
    const msg = this.message();
    if (!msg) return;
    this.messageService.markAsUnread(msg.id).subscribe({
      next: () => {
        this.toast.success('Marked as unread');
        this.goBack();
      },
    });
  }

  archive(): void {
    const msg = this.message();
    if (!msg) return;
    this.messageService.archive(msg.id).subscribe({
      next: () => {
        this.toast.success('Message archived');
        this.goBack();
      },
    });
  }

  restore(): void {
    const msg = this.message();
    if (!msg) return;
    this.messageService.restore(msg.id).subscribe({
      next: () => {
        this.toast.success('Message restored');
        this.loadMessage(msg.id);
      },
    });
  }

  // Note: mailto: links cannot detect whether the user actually sent the email,
  // so we mark as replied optimistically when the mail client opens.
  // A future in-app composer will provide true send confirmation.
  reply(): void {
    const msg = this.message();
    if (!msg) return;

    const subject = msg.subject ? `Re: ${msg.subject}` : '';
    window.open(`mailto:${msg.email}?subject=${encodeURIComponent(subject)}`, '_self');

    this.messageService.setReplied(msg.id).subscribe({
      next: () => {
        this.toast.success('Marked as replied');
        this.loadMessage(msg.id);
      },
    });
  }

  confirmDelete(): void {
    const msg = this.message();
    if (!msg) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Message',
        message: `Are you sure you want to delete this message from "${msg.name}"?`,
        confirmLabel: 'Delete',
      } satisfies ConfirmDialogData,
    });
    dialogRef
      .afterClosed()
      .pipe(
        filter(Boolean),
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => this.messageService.softDelete(msg.id))
      )
      .subscribe({
        next: () => {
          this.toast.success('Message deleted');
          this.goBack();
        },
      });
  }

  private loadMessage(id: string): void {
    this.loading.set(true);
    this.messageService
      .getById(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((msg) => {
          this.message.set(msg);
          this.loading.set(false);
        }),
        switchMap((msg) => (msg.status === 'UNREAD' ? this.messageService.markAsRead(id) : of(void 0)))
      )
      .subscribe({
        error: () => {
          this.loading.set(false);
          this.goBack();
        },
      });
  }
}
