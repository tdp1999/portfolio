import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, HostListener, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import {
  HasUnsavedChanges,
  MarkdownEditorComponent,
  onBeforeUnload,
  SectionCard,
  SpinnerOverlay,
  StickySaveBar,
  ToastService,
} from '@portfolio/console/shared/ui';
import { PROFILE_MAX_CHARS } from '../radar.constants';
import { RadarService } from '../radar.service';

/**
 * The Owner's workflow profile: the markdown the radar worker reads before writing each apply
 * note. One document, so the page is a single editor rather than a list.
 */
@Component({
  selector: 'console-radar-profile-form',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MarkdownEditorComponent,
    SectionCard,
    SpinnerOverlay,
    StickySaveBar,
  ],
  templateUrl: './radar-profile.form.html',
  styleUrl: './radar-profile.form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class RadarProfileForm implements OnInit, HasUnsavedChanges {
  // ── DI ────────────────────────────────────────────────────────────
  private readonly radarService = inject(RadarService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  // ── Writable signals ──────────────────────────────────────────────
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly saving = signal(false);
  protected readonly dirty = signal(false);
  protected readonly length = signal(0);
  protected readonly updatedAt = signal<string | null>(null);

  // ── Forms ─────────────────────────────────────────────────────────
  protected readonly body = new FormControl('', {
    nonNullable: true,
    validators: [Validators.maxLength(PROFILE_MAX_CHARS)],
  });

  // ── Plain state ───────────────────────────────────────────────────
  protected readonly maxChars = PROFILE_MAX_CHARS;
  /** Last saved text, so Discard does not need a round trip. */
  private savedBody = '';

  ngOnInit(): void {
    this.body.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.length.set(value.length);
      this.dirty.set(value !== this.savedBody);
    });
    this.load();
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    onBeforeUnload(event, this.dirty());
  }

  hasUnsavedChanges() {
    return this.dirty;
  }

  onRetry(): void {
    this.load();
  }

  onDiscard(): void {
    this.reset(this.savedBody);
  }

  onSave(): void {
    if (this.body.invalid) {
      this.body.markAsTouched();
      return;
    }
    this.saving.set(true);
    this.radarService.saveProfile(this.body.value).subscribe({
      next: (profile) => {
        this.saving.set(false);
        this.updatedAt.set(profile.updatedAt);
        this.reset(profile.body);
        this.toast.success('Workflow profile saved');
      },
      error: () => this.saving.set(false),
    });
  }

  // ── shared helpers ────────────────────────────────────────────────
  private load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.radarService.getProfile().subscribe({
      next: (profile) => {
        this.updatedAt.set(profile.updatedAt);
        this.reset(profile.body);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  private reset(body: string): void {
    this.savedBody = body;
    this.body.setValue(body);
    this.dirty.set(false);
  }
}
