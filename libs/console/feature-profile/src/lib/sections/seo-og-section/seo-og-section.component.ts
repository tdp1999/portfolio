import { JsonPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { startWith } from 'rxjs';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
  FormSnapshotDirective,
  MediaPickerDataSource,
  MediaPickerDialogComponent,
  MediaPickerDialogData,
  SectionCardComponent,
  SectionStatus,
  ToastService,
} from '@portfolio/console/shared/ui';
import { baselineFor, FormErrorPipe, ServerErrorDirective, type MediaItem } from '@portfolio/console/shared/util';
import { ProfileService } from '../../profile.service';
import { ProfileAdminResponse } from '../../profile.types';

@Component({
  selector: 'console-profile-seo-og-section',
  standalone: true,
  imports: [
    JsonPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    SectionCardComponent,
    FormSnapshotDirective,
    ServerErrorDirective,
    FormErrorPipe,
  ],
  templateUrl: './seo-og-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeoOgSectionComponent {
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  readonly initialData = input.required<ProfileAdminResponse | null>();
  readonly mediaDataSource = input.required<MediaPickerDataSource>();
  readonly saved = output<Partial<ProfileAdminResponse>>();

  readonly form = this.fb.group({
    metaTitle: this.fb.control('', { nonNullable: true, validators: baselineFor.metaTitle() }),
    metaDescription: this.fb.control('', { nonNullable: true, validators: baselineFor.metaDescription() }),
    canonicalUrl: this.fb.control('', { nonNullable: true, validators: baselineFor.url() }),
  });

  readonly saving = signal(false);
  readonly lastSaved = signal<Date | null>(null);
  readonly ogImageSaving = signal(false);
  readonly ogImageId = signal<string | null>(null);
  readonly ogImagePreview = signal<string | null>(null);
  readonly jsonLd = signal<unknown>(null);
  readonly showJsonLd = signal(false);

  private readonly dirty = signal(false);
  private readonly invalid = signal(false);

  readonly status = computed<SectionStatus>(() => {
    if (this.invalid()) return 'error';
    if (this.saving() || this.dirty()) return 'editing';
    if (this.lastSaved()) return 'saved';
    return 'untouched';
  });

  private hydrated = false;

  constructor() {
    effect(() => {
      const data = this.initialData();
      if (!data || this.hydrated) return;
      this.form.reset({
        metaTitle: data.metaTitle ?? '',
        metaDescription: data.metaDescription ?? '',
        canonicalUrl: data.canonicalUrl ?? '',
      });
      this.ogImageId.set(data.ogImageId);
      this.ogImagePreview.set(data.ogImageUrl);
      this.hydrated = true;
    });
    this.form.events.pipe(startWith(null), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.dirty.set(this.form.dirty);
      this.invalid.set(this.form.invalid);
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const v = this.form.getRawValue();
    this.profileService
      .updateSeoOg({
        metaTitle: v.metaTitle || null,
        metaDescription: v.metaDescription || null,
        canonicalUrl: v.canonicalUrl || null,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.form.markAsPristine();
          this.lastSaved.set(new Date());
          this.toast.success('SEO / OG saved');
          this.saved.emit({
            metaTitle: v.metaTitle || null,
            metaDescription: v.metaDescription || null,
            canonicalUrl: v.canonicalUrl || null,
          });
        },
        error: () => this.saving.set(false),
      });
  }

  openOgImagePicker(): void {
    this.dialog
      .open<MediaPickerDialogComponent, MediaPickerDialogData, MediaItem | undefined>(MediaPickerDialogComponent, {
        data: {
          mode: 'single',
          mimeFilter: 'image/',
          defaultFolder: 'logos',
          selectedIds: this.ogImageId() ? [this.ogImageId()!] : [],
          dataSource: this.mediaDataSource(),
        } satisfies MediaPickerDialogData,
        width: '900px',
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((picked) => {
        if (!picked) return;
        const id = picked.id;
        this.ogImageSaving.set(true);
        this.profileService
          .updateOgImage(id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: ({ ogImageUrl }) => {
              this.ogImageSaving.set(false);
              this.ogImageId.set(id);
              this.ogImagePreview.set(ogImageUrl);
              this.toast.success('OG image updated');
              this.saved.emit({ ogImageId: id, ogImageUrl });
            },
            error: () => this.ogImageSaving.set(false),
          });
      });
  }

  confirmClearOgImage(): void {
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        data: { title: 'Remove OG Image', message: 'Remove your OG preview image?', confirmLabel: 'Remove' },
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) this.clearOgImage();
      });
  }

  private clearOgImage(): void {
    this.ogImageSaving.set(true);
    this.profileService
      .updateOgImage(null)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.ogImageSaving.set(false);
          this.ogImageId.set(null);
          this.ogImagePreview.set(null);
          this.saved.emit({ ogImageId: null, ogImageUrl: null });
        },
        error: () => this.ogImageSaving.set(false),
      });
  }

  loadJsonLd(): void {
    this.profileService
      .getJsonLd()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.jsonLd.set(data);
          this.showJsonLd.set(true);
        },
      });
  }
}
