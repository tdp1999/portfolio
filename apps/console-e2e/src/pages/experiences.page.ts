import { type Locator, type Page } from '@playwright/test';

export class ExperiencesPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly addButton: Locator;
  readonly searchInput: Locator;
  readonly table: Locator;
  readonly paginator: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Experience Management' });
    this.addButton = page.getByRole('button', { name: 'Add Experience' });
    this.searchInput = page.getByRole('textbox', { name: /search/i });
    this.table = page.locator('table');
    this.paginator = page.locator('mat-paginator');
  }

  async goto(): Promise<void> {
    await this.page.goto('/experiences');
    await this.heading.waitFor({ state: 'visible', timeout: 10000 });
  }

  getRowByCompany(companyName: string): Locator {
    return this.page.locator('tr').filter({ hasText: companyName });
  }

  async openMenuForRow(companyName: string): Promise<void> {
    const row = this.getRowByCompany(companyName);
    await row.locator('button[mat-icon-button]').click();
  }

  async clickEdit(companyName: string): Promise<void> {
    await this.openMenuForRow(companyName);
    await this.page.locator('button[mat-menu-item]', { hasText: 'Edit' }).click();
  }

  async clickDelete(companyName: string): Promise<void> {
    await this.openMenuForRow(companyName);
    await this.page.locator('button[mat-menu-item]', { hasText: 'Delete' }).click();
  }

  async clickRestore(companyName: string): Promise<void> {
    await this.openMenuForRow(companyName);
    await this.page.locator('button[mat-menu-item]', { hasText: 'Restore' }).click();
  }

  // ── Dialog helpers ────────────────────────────────────────────────

  get dialog() {
    const container = this.page.locator('mat-dialog-container');
    return {
      container,
      companyNameInput: container.locator('input[formControlName="companyName"]'),
      positionEnInput: container.locator('input[formControlName="position_en"]'),
      positionViInput: container.locator('input[formControlName="position_vi"]'),
      descriptionEnTextarea: container.locator('textarea[formControlName="description_en"]'),
      descriptionViTextarea: container.locator('textarea[formControlName="description_vi"]'),
      teamRoleEnInput: container.locator('input[formControlName="teamRole_en"]'),
      teamRoleViInput: container.locator('input[formControlName="teamRole_vi"]'),
      employmentTypeSelect: container.locator('mat-select[formControlName="employmentType"]'),
      locationTypeSelect: container.locator('mat-select[formControlName="locationType"]'),
      startDateInput: container.locator('input[formControlName="startDate"]'),
      endDateInput: container.locator('input[formControlName="endDate"]'),
      isCurrentCheckbox: container.getByRole('checkbox', { name: 'Current position' }),
      locationCountryInput: container.locator('input[formControlName="locationCountry"]'),
      skillSearchInput: container.locator('input[formControlName="skillSearchControl"]'),
      skillAutocompleteInput: container.locator('mat-dialog-container input').filter({ hasText: '' }).nth(2),
      selectedSkillChips: container.locator('mat-chip-set mat-chip'),
      achievementsEnTab: container.locator('div[role="tab"]', { hasText: 'English' }),
      addAchievementEnButton: container.locator('button', { hasText: 'Add Achievement' }).first(),
      serverError: container.locator('.text-red-500'),
      cancelButton: container.locator('button[mat-dialog-close]'),
      submitButton: container.locator('button[mat-flat-button]', { hasText: /Create|Update/ }),
    };
  }

  async fillRequiredFields(opts: {
    companyName: string;
    positionEn: string;
    positionVi: string;
    startDate: string | Date;
    locationCountry?: string;
  }): Promise<void> {
    const d = this.dialog;
    await d.companyNameInput.fill(opts.companyName);
    await d.positionEnInput.fill(opts.positionEn);
    await d.positionViInput.fill(opts.positionVi);

    // The start-date input is now wrapped in `console-month-year-picker` and
    // marked `readonly`; typing into it has no effect. Drive the calendar instead:
    // toggle → multi-year → year → month-year view → month.
    const date = typeof opts.startDate === 'string' ? new Date(opts.startDate) : opts.startDate;
    await this.pickMonthYear('startDate', date);

    // locationCountry is required by the backend — fill it (defaults to 'Vietnam')
    const locationCountry = opts.locationCountry ?? 'Vietnam';
    await d.locationCountryInput.fill(locationCountry);
  }

  /**
   * Selects a month + year on a `console-month-year-picker` via its calendar
   * popup. `controlName` is the `formControlName` mirrored onto the underlying
   * `<input>` (e.g. `startDate`, `endDate`).
   */
  async pickMonthYear(controlName: string, date: Date): Promise<void> {
    // The toggle button sits as a sibling of the input inside the same mat-form-field.
    const field = this.page
      .locator(`input[formControlName="${controlName}"]`)
      .locator('xpath=ancestor::mat-form-field[1]');
    await field.locator('mat-datepicker-toggle button').click();

    // Material calendar opens in `multi-year` view (a grid of years). Click the year first.
    const calendar = this.page.locator('.mat-datepicker-content');
    await calendar
      .locator('.mat-calendar-body-cell', { hasText: String(date.getFullYear()) })
      .first()
      .click();

    // Calendar transitions to the year view (a grid of months). monthSelected fires on click.
    const monthShort = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][
      date.getMonth()
    ];
    await calendar.locator('.mat-calendar-body-cell', { hasText: monthShort }).first().click();
  }

  async selectSkill(skillName: string): Promise<void> {
    const skillInput = this.page.locator('mat-dialog-container input[placeholder="Type to search..."]');
    await skillInput.fill(skillName);
    await this.page.locator('mat-option', { hasText: skillName }).click();
  }

  async addEnglishAchievement(text: string): Promise<void> {
    await this.dialog.achievementsEnTab.click();
    await this.dialog.addAchievementEnButton.click();
    const lastInput = this.page
      .locator('mat-dialog-container')
      .locator('mat-tab-body')
      .first()
      .locator('input[formControlName="text"]')
      .last();
    await lastInput.fill(text);
  }
}
