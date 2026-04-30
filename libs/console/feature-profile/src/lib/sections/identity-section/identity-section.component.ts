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
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
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
  TranslatableGroupComponent,
} from '@portfolio/console/shared/ui';
import { ServerErrorDirective, type MediaItem } from '@portfolio/console/shared/util';
import { LIMITS } from '@portfolio/shared/validation';
import { startWith } from 'rxjs';
import { ProfileService } from '../../profile.service';
import { ProfileAdminResponse } from '../../profile.types';

@Component({
  selector: 'console-profile-identity-section',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    SectionCardComponent,
    FormSnapshotDirective,
    ServerErrorDirective,
    TranslatableGroupComponent,
  ],
  templateUrl: './identity-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IdentitySectionComponent {
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  readonly initialData = input.required<ProfileAdminResponse | null>();
  readonly mediaDataSource = input.required<MediaPickerDataSource>();
  readonly saved = output<Partial<ProfileAdminResponse>>();

  readonly form = this.fb.group({
    fullName: this.bilingualGroup({ required: true, maxLength: LIMITS.NAME_MAX }),
    title: this.bilingualGroup({ required: true, maxLength: LIMITS.TITLE_MAX }),
    bioShort: this.bilingualGroup({ required: true, maxLength: LIMITS.BIO_SHORT_MAX }),
    bioLong: this.bilingualGroup({ required: false }),
  });

  readonly saving = signal(false);
  readonly lastSaved = signal<Date | null>(null);
  readonly avatarSaving = signal(false);
  readonly avatarId = signal<string | null>(null);
  readonly avatarPreview = signal<string | null>(null);

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
        fullName: { en: data.fullName.en, vi: data.fullName.vi },
        title: { en: data.title.en, vi: data.title.vi },
        bioShort: { en: data.bioShort.en, vi: data.bioShort.vi },
        bioLong: { en: data.bioLong?.en ?? '', vi: data.bioLong?.vi ?? '' },
      });
      this.avatarId.set(data.avatarId);
      this.avatarPreview.set(data.avatarUrl);
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
    this.profileService
      .updateIdentity(this.form.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.form.markAsPristine();
          this.lastSaved.set(new Date());
          this.toast.success('Identity saved');
          const v = this.form.getRawValue();
          this.saved.emit({ fullName: v.fullName, title: v.title, bioShort: v.bioShort, bioLong: v.bioLong });
        },
        error: () => this.saving.set(false),
      });
  }

  openAvatarPicker(): void {
    this.dialog
      .open<MediaPickerDialogComponent, MediaPickerDialogData, MediaItem | undefined>(MediaPickerDialogComponent, {
        data: {
          mode: 'single',
          mimeFilter: 'image/',
          defaultFolder: 'avatars',
          selectedIds: this.avatarId() ? [this.avatarId()!] : [],
          dataSource: this.mediaDataSource(),
        } satisfies MediaPickerDialogData,
        width: '900px',
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((picked) => {
        if (!picked) return;
        const id = picked.id;
        this.avatarSaving.set(true);
        this.profileService
          .updateAvatar(id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: ({ avatarUrl }) => {
              this.avatarSaving.set(false);
              this.avatarId.set(id);
              this.avatarPreview.set(avatarUrl);
              this.toast.success('Avatar updated');
              this.saved.emit({ avatarId: id, avatarUrl });
            },
            error: () => this.avatarSaving.set(false),
          });
      });
  }

  confirmClearAvatar(): void {
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        data: { title: 'Remove Avatar', message: 'Remove your avatar photo?', confirmLabel: 'Remove' },
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) this.clearAvatar();
      });
  }

  private clearAvatar(): void {
    this.avatarSaving.set(true);
    this.profileService
      .updateAvatar(null)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.avatarSaving.set(false);
          this.avatarId.set(null);
          this.avatarPreview.set(null);
          this.saved.emit({ avatarId: null, avatarUrl: null });
        },
        error: () => this.avatarSaving.set(false),
      });
  }

  private bilingualGroup(opts: { required: boolean; maxLength?: number }) {
    const validators = [];
    if (opts.required) validators.push(Validators.required);
    if (opts.maxLength !== undefined) validators.push(Validators.maxLength(opts.maxLength));
    return this.fb.group({
      en: this.fb.control('', { nonNullable: true, validators }),
      vi: this.fb.control('', { nonNullable: true, validators }),
    });
  }
}
