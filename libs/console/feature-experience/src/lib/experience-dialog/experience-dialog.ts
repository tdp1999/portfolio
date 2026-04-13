import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { extractApiError, FormErrorPipe } from '@portfolio/console/shared/data-access';
import { AdminExperience, SkillOption } from '../experience.types';
import { ExperienceService } from '../experience.service';

export interface ExperienceDialogData {
  experience?: AdminExperience;
}

type AchievementGroup = FormGroup<{ text: FormControl<string> }>;

@Component({
  selector: 'console-experience-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    FormErrorPipe,
  ],
  templateUrl: './experience-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ExperienceDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<ExperienceDialogComponent>);
  private readonly experienceService = inject(ExperienceService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  readonly data = inject<ExperienceDialogData>(MAT_DIALOG_DATA, { optional: true });

  readonly isEdit = !!this.data?.experience;
  readonly submitting = signal(false);
  readonly logoUploading = signal(false);
  readonly logoPreview = signal<string | null>(null);
  readonly serverError = signal('');

  readonly allSkills = signal<SkillOption[]>([]);
  readonly selectedSkills = signal<SkillOption[]>([]);
  readonly skillSearchControl = new FormControl('');
  readonly filteredSkills = signal<SkillOption[]>([]);

  readonly employmentTypeOptions = [
    { value: 'FULL_TIME', label: 'Full Time' },
    { value: 'PART_TIME', label: 'Part Time' },
    { value: 'CONTRACT', label: 'Contract' },
    { value: 'FREELANCE', label: 'Freelance' },
    { value: 'INTERNSHIP', label: 'Internship' },
    { value: 'SELF_EMPLOYED', label: 'Self Employed' },
  ];

  readonly locationTypeOptions = [
    { value: 'REMOTE', label: 'Remote' },
    { value: 'HYBRID', label: 'Hybrid' },
    { value: 'ONSITE', label: 'Onsite' },
  ];

  private readonly exp = this.data?.experience;

  readonly form = this.fb.nonNullable.group({
    // Company
    companyName: [this.exp?.companyName ?? '', [Validators.required, Validators.maxLength(200)]],
    companyUrl: [this.exp?.companyUrl ?? ''],
    companyLogoId: [this.exp?.companyLogoId ?? ''],

    // Role - bilingual
    position_en: [this.exp?.position?.en ?? '', [Validators.required]],
    position_vi: [this.exp?.position?.vi ?? '', [Validators.required]],
    description_en: [this.exp?.description?.en ?? ''],
    description_vi: [this.exp?.description?.vi ?? ''],
    teamRole_en: [this.exp?.teamRole?.en ?? ''],
    teamRole_vi: [this.exp?.teamRole?.vi ?? ''],

    // Employment
    employmentType: [this.exp?.employmentType ?? 'FULL_TIME', [Validators.required]],

    // Dates
    startDate: [this.exp?.startDate ? new Date(this.exp.startDate) : (null as Date | null), [Validators.required]],
    endDate: [this.exp?.endDate ? new Date(this.exp.endDate) : (null as Date | null)],
    isCurrent: [!this.exp?.endDate],

    // Location
    locationType: [this.exp?.locationType ?? 'ONSITE', [Validators.required]],
    locationCountry: [this.exp?.locationCountry ?? ''],
    locationCity: [this.exp?.locationCity ?? ''],
    locationPostalCode: [this.exp?.locationPostalCode ?? ''],
    locationAddress1: [this.exp?.locationAddress1 ?? ''],
    locationAddress2: [this.exp?.locationAddress2 ?? ''],

    // Context
    clientName: [this.exp?.clientName ?? ''],
    clientIndustry: [this.exp?.clientIndustry ?? ''],
    domain: [this.exp?.domain ?? ''],
    teamSize: [this.exp?.teamSize ?? (null as number | null)],

    // Display
    displayOrder: [this.exp?.displayOrder ?? 0],

    // Achievements
    achievements_en: this.fb.array<AchievementGroup>([]),
    achievements_vi: this.fb.array<AchievementGroup>([]),
  });

  ngOnInit(): void {
    this.loadSkills();
    this.populateAchievements();
    this.setupCurrentPositionToggle();
    this.setupSkillSearch();

    if (this.exp?.companyLogoUrl) {
      this.logoPreview.set(this.exp.companyLogoUrl);
    }
  }

  get achievementsEnArray(): FormArray {
    return this.form.get('achievements_en') as FormArray;
  }

  get achievementsViArray(): FormArray {
    return this.form.get('achievements_vi') as FormArray;
  }

  asFormGroup(control: AbstractControl): FormGroup {
    return control as FormGroup;
  }

  addAchievement(lang: 'en' | 'vi'): void {
    const arr = lang === 'en' ? this.achievementsEnArray : this.achievementsViArray;
    arr.push(this.createAchievementGroup());
  }

  removeAchievement(lang: 'en' | 'vi', index: number): void {
    const arr = lang === 'en' ? this.achievementsEnArray : this.achievementsViArray;
    arr.removeAt(index);
  }

  removeSkill(skill: SkillOption): void {
    this.selectedSkills.update((skills) => skills.filter((s) => s.id !== skill.id));
    this.updateFilteredSkills(this.skillSearchControl.value ?? '');
  }

  onSkillSelected(event: MatAutocompleteSelectedEvent): void {
    const skill = event.option.value as SkillOption;
    if (!this.selectedSkills().find((s) => s.id === skill.id)) {
      this.selectedSkills.update((skills) => [...skills, skill]);
    }
    this.skillSearchControl.setValue('');
    this.updateFilteredSkills('');
  }

  onLogoFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.logoUploading.set(true);
    this.experienceService
      .uploadMedia(file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (id) => {
          this.logoUploading.set(false);
          this.form.controls.companyLogoId.setValue(id);
          this.logoPreview.set(URL.createObjectURL(file));
        },
        error: () => {
          this.logoUploading.set(false);
        },
      });
  }

  clearLogo(): void {
    this.form.controls.companyLogoId.setValue('');
    this.logoPreview.set(null);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.serverError.set('');

    const v = this.form.getRawValue();
    const isCurrent = v.isCurrent;

    const achievements = {
      en: (v.achievements_en as Array<{ text: string }>).map((a) => a.text).filter(Boolean),
      vi: (v.achievements_vi as Array<{ text: string }>).map((a) => a.text).filter(Boolean),
    };

    const basePayload = {
      companyName: v.companyName,
      companyUrl: v.companyUrl || undefined,
      position: { en: v.position_en, vi: v.position_vi },
      description:
        v.description_en || v.description_vi ? { en: v.description_en || '', vi: v.description_vi || '' } : undefined,
      achievements,
      teamRole: v.teamRole_en || v.teamRole_vi ? { en: v.teamRole_en || '', vi: v.teamRole_vi || '' } : undefined,
      employmentType: v.employmentType,
      locationType: v.locationType,
      locationCountry: v.locationCountry || undefined,
      locationCity: v.locationCity || undefined,
      locationPostalCode: v.locationPostalCode || undefined,
      locationAddress1: v.locationAddress1 || undefined,
      locationAddress2: v.locationAddress2 || undefined,
      clientName: v.clientName || undefined,
      clientIndustry: v.clientIndustry || undefined,
      domain: v.domain || undefined,
      teamSize: v.teamSize ?? undefined,
      startDate: (v.startDate as Date).toISOString(),
      skillIds: this.selectedSkills().map((s) => s.id),
      displayOrder: v.displayOrder,
    };

    const onError = (err: HttpErrorResponse) => {
      this.submitting.set(false);
      const apiError = extractApiError(err);
      this.serverError.set(apiError?.message ?? 'Failed to save experience');
    };

    const editExp = this.data?.experience;
    if (this.isEdit && editExp) {
      const updatePayload = {
        ...basePayload,
        companyLogoId: v.companyLogoId || null,
        endDate: isCurrent ? null : v.endDate ? (v.endDate as Date).toISOString() : undefined,
      };
      this.experienceService
        .update(editExp.id, updatePayload)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({ next: () => this.dialogRef.close(true), error: onError });
    } else {
      const createPayload = {
        ...basePayload,
        companyLogoId: v.companyLogoId || undefined,
        endDate: isCurrent ? undefined : v.endDate ? (v.endDate as Date).toISOString() : undefined,
      };
      this.experienceService
        .create(createPayload)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({ next: () => this.dialogRef.close(true), error: onError });
    }
  }

  private createAchievementGroup(text = ''): AchievementGroup {
    return this.fb.nonNullable.group({ text: [text] }) as AchievementGroup;
  }

  private populateAchievements(): void {
    if (this.exp?.achievements) {
      for (const text of this.exp.achievements.en ?? []) {
        this.achievementsEnArray.push(this.createAchievementGroup(text));
      }
      for (const text of this.exp.achievements.vi ?? []) {
        this.achievementsViArray.push(this.createAchievementGroup(text));
      }
    }
  }

  private setupCurrentPositionToggle(): void {
    const isCurrentControl = this.form.controls.isCurrent;
    const endDateControl = this.form.controls.endDate;

    if (isCurrentControl.value) {
      endDateControl.disable();
    }

    isCurrentControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((isCurrent) => {
      if (isCurrent) {
        endDateControl.disable();
        endDateControl.setValue(null);
      } else {
        endDateControl.enable();
      }
    });
  }

  private loadSkills(): void {
    this.experienceService
      .listAllSkills()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (all) => {
          this.allSkills.set(all);
          if (this.exp?.skills) {
            const preSelected = all.filter((s) => this.exp!.skills.some((es) => es.id === s.id));
            this.selectedSkills.set(preSelected);
          }
          this.updateFilteredSkills('');
        },
      });
  }

  private setupSkillSearch(): void {
    this.skillSearchControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.updateFilteredSkills(value ?? '');
    });
  }

  private updateFilteredSkills(search: string): void {
    const selected = this.selectedSkills();
    const lowerSearch = search.toLowerCase();
    this.filteredSkills.set(
      this.allSkills().filter(
        (s) => !selected.find((sel) => sel.id === s.id) && s.name.toLowerCase().includes(lowerSearch)
      )
    );
  }
}
