import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroupDirective, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ToastService } from '@portfolio/console/shared/ui';
import { extractApiError, FormErrorPipe, ServerErrorDirective } from '@portfolio/console/shared/util';
import { RadarService } from '../radar.service';
import { RadarSource } from '../radar.types';
import { toSourcePlatform, toUploadErrorLines } from './radar-source.dialog.util';

@Component({
  selector: 'console-radar-source-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    FormErrorPipe,
    ServerErrorDirective,
  ],
  templateUrl: './radar-source.dialog.html',
  styleUrl: './radar-source.dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadarSourceDialog implements OnInit {
  // ── DI ────────────────────────────────────────────────────────────
  private readonly radarService = inject(RadarService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  // ── Writable signals ──────────────────────────────────────────────
  protected readonly sources = signal<RadarSource[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly adding = signal(false);
  protected readonly busySourceId = signal<string | null>(null);
  protected readonly uploadError = signal<{ title: string; message: string; lines: string[] } | null>(null);

  // ── Forms ─────────────────────────────────────────────────────────
  protected readonly form = this.fb.nonNullable.group({
    // A page URL, or a bare YouTube `@handle`.
    url: ['', [Validators.required, Validators.maxLength(500), Validators.pattern(/^(https?:\/\/\S+|@[\w.-]+)$/)]],
    displayName: ['', [Validators.required, Validators.maxLength(200)]],
  });

  // ── Computed ──────────────────────────────────────────────────────
  private readonly url = toSignal(this.form.controls.url.valueChanges, { initialValue: '' });
  /** Read from the URL as it is typed, so adding a source needs no platform picker. */
  protected readonly platform = computed(() => toSourcePlatform(this.url()));

  ngOnInit(): void {
    this.loadSources();
    // A YouTube channel brings its own title, so the name is optional there.
    this.form.controls.url.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((url) => {
      const name = this.form.controls.displayName;
      const validators =
        toSourcePlatform(url) === 'YOUTUBE'
          ? [Validators.maxLength(200)]
          : [Validators.required, Validators.maxLength(200)];
      name.setValidators(validators);
      name.updateValueAndValidity({ emitEvent: false });
    });
  }

  onRetryLoad(): void {
    this.loading.set(true);
    this.loadSources();
  }

  // ── Add source ────────────────────────────────────────────────────
  /** Takes the directive, not just the group: `resetForm` also clears the submitted flag, so the emptied fields do not show "required". */
  onAddSource(formDirective: FormGroupDirective): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.adding.set(true);
    const value = this.form.getRawValue();
    this.radarService.createSource({ ...value, platform: toSourcePlatform(value.url) }).subscribe({
      next: (source) => {
        this.adding.set(false);
        formDirective.resetForm();
        this.toast.success(`Added ${source.displayName}`);
        this.loadSources();
      },
      error: () => this.adding.set(false),
    });
  }

  // ── Upload ────────────────────────────────────────────────────────
  onFileSelected(source: RadarSource, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    // Reset so picking the same file again after a fix still fires `change`.
    input.value = '';
    if (!file) return;

    this.uploadError.set(null);
    this.busySourceId.set(source.id);
    this.radarService.uploadCapture(source.id, file).subscribe({
      next: (r) => {
        this.busySourceId.set(null);
        this.loadSources();
        if (!r.failed) {
          this.toast.success(`Uploaded: ${r.created} created, ${r.updated} updated, 0 failed`);
          return;
        }
        // Partial success: the good posts are saved, so list the failed ones instead of a green toast.
        this.toast.warning(`Uploaded: ${r.created} created, ${r.updated} updated, ${r.failed} failed`);
        this.uploadError.set({
          title: `Some posts for ${source.displayName} were not saved. The rest are in the Feed.`,
          message: `${r.created} created, ${r.updated} updated, ${r.failed} failed.`,
          lines: toUploadErrorLines(Object.fromEntries(r.failures.map((f) => [String(f.index), [f.reason]]))),
        });
      },
      error: (err: HttpErrorResponse) => {
        this.busySourceId.set(null);
        const apiError = extractApiError(err);
        this.uploadError.set({
          title: `Upload to ${source.displayName} was rejected. The Feed is unchanged.`,
          message: apiError.message,
          lines: toUploadErrorLines(apiError.data),
        });
      },
    });
  }

  /** Comments only attach to posts this source already has; the rest of the file is counted as unmatched. */
  onCommentsFileSelected(source: RadarSource, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    this.uploadError.set(null);
    this.busySourceId.set(source.id);
    this.radarService.uploadComments(source.id, file).subscribe({
      next: (r) => {
        this.busySourceId.set(null);
        const summary = `${r.comments} comments on ${r.posts} posts, ${r.unmatched} unmatched, ${r.failed} failed`;
        if (!r.failed && r.posts) {
          this.toast.success(`Uploaded comments: ${summary}`);
          return;
        }
        this.toast.warning(`Uploaded comments: ${summary}`);
        this.uploadError.set({
          title: r.posts
            ? `Some comments for ${source.displayName} were not saved.`
            : `No comment in the file belongs to a post of ${source.displayName}.`,
          message: summary + '.',
          lines: toUploadErrorLines(Object.fromEntries(r.failures.map((f) => [String(f.index), [f.reason]]))),
        });
      },
      error: (err: HttpErrorResponse) => {
        this.busySourceId.set(null);
        const apiError = extractApiError(err);
        this.uploadError.set({
          title: `Comments upload to ${source.displayName} was rejected. Nothing changed.`,
          message: apiError.message,
          lines: toUploadErrorLines(apiError.data),
        });
      },
    });
  }

  // ── Activate / deactivate ─────────────────────────────────────────
  onToggleActive(source: RadarSource): void {
    this.busySourceId.set(source.id);
    this.radarService.setSourceActive(source.id, !source.isActive).subscribe({
      next: () => {
        this.busySourceId.set(null);
        this.loadSources();
      },
      error: () => this.busySourceId.set(null),
    });
  }

  // ── shared helpers ────────────────────────────────────────────────
  private loadSources(): void {
    this.loadError.set(false);
    this.radarService.listSources().subscribe({
      next: (sources) => {
        this.sources.set(sources);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }
}
