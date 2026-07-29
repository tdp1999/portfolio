import { type Locator, type Page } from '@playwright/test';
import { SectionFormPage } from './section-form.page';

/**
 * Rail label for each section id — `experience.form.ts` `sections` is the source of truth.
 * Note `section-settings` is labelled **"Admin"**, not "Settings".
 */
const SECTION_LABELS = {
  'section-company': 'Company',
  'section-role': 'Role',
  'section-dates': 'Dates',
  'section-location': 'Location',
  'section-skills': 'Skills',
  'section-responsibilities': 'Responsibilities',
  'section-highlights': 'Highlights',
  'section-links': 'Links',
  'section-context': 'Context',
  'section-settings': 'Admin',
} as const;

export type ExperienceSectionId = keyof typeof SECTION_LABELS;

/**
 * The routed experience form at `/experiences/new` and `/experiences/:id/edit`.
 *
 * "Add Experience" on the list page reads like it opens a modal — the handler is even called
 * `openCreateDialog()` — but it calls `router.navigate(['/experiences', 'new'])`. There is no
 * dialog anywhere in this flow.
 *
 * Every section body is gated with `[hidden]="!showAll() && activeId() !== '<id>'"`, and the
 * form opens on Company. Fields in any other section — Team Size lives in **Context** — are in
 * the DOM but never visible until their tab is clicked, so a spec that skips `activate()` fails
 * as a 30s `fill()` timeout that looks nothing like the missing tab click that caused it.
 */
export class ExperienceFormPage extends SectionFormPage<ExperienceSectionId> {
  protected readonly labels = SECTION_LABELS;

  readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: /^(Add|Edit) Experience$/ });
  }

  async gotoNew(): Promise<void> {
    await this.page.goto('/experiences/new');
    await this.heading.waitFor({ state: 'visible', timeout: 10_000 });
  }

  async gotoEdit(id: string): Promise<void> {
    await this.page.goto(`/experiences/${id}/edit`);
    await this.heading.waitFor({ state: 'visible', timeout: 10_000 });
  }

  /**
   * Any control by `formControlName`.
   *
   * Preferred over `getByLabel` in the Context section, where the two team-size inputs are
   * labelled just "Min" and "Max" — labels that are only unambiguous because of where they sit.
   */
  control(name: string): Locator {
    return this.page.locator(`[formControlName="${name}"]`);
  }

  /** Fill a numeric control and blur, so the error-state matcher lets `<mat-error>` render. */
  async fillAndBlur(name: string, value: string): Promise<void> {
    const control = this.control(name);
    await control.fill(value);
    await control.blur();
  }

  // ── Section-scoped fields ───────────────────────────────────────────

  get companyNameInput(): Locator {
    return this.control('companyName');
  }

  /**
   * Position is a nested `FormGroup` rendered by `console-translatable-group`, so the two
   * inputs are `formControlName="en"` / `"vi"` — **not** `position_en`, which is what the
   * dialog used. Scope by label ("Position (EN)") rather than control name, since `en`/`vi`
   * repeat for every translatable group on the page.
   */
  positionInput(locale: 'EN' | 'VI'): Locator {
    return this.section('section-role').getByLabel(`Position (${locale})`);
  }

  teamRoleInput(locale: 'EN' | 'VI'): Locator {
    return this.section('section-role').getByLabel(`Team Role (${locale})`);
  }

  get locationCountryInput(): Locator {
    return this.control('locationCountry');
  }

  get isCurrentCheckbox(): Locator {
    return this.section('section-dates').getByRole('checkbox', { name: 'Current position' });
  }

  get endDateInput(): Locator {
    return this.control('endDate');
  }

  get skillSearchInput(): Locator {
    return this.section('section-skills').getByLabel('Search Skills');
  }

  get selectedSkillChips(): Locator {
    return this.section('section-skills').locator('mat-chip');
  }

  /**
   * Fill everything the API requires, so `save()` is not rejected on validation:
   * companyName, position EN + VI, startDate, locationCountry. `employmentType` and
   * `locationType` already default to valid values, and every rich-text field is optional
   * (`richTextGroup` attaches no required validator).
   */
  async fillRequired(values: {
    companyName: string;
    positionEn: string;
    positionVi: string;
    startDate: string | Date;
    locationCountry?: string;
  }): Promise<void> {
    await this.activate('section-company');
    await this.companyNameInput.fill(values.companyName);

    await this.activate('section-role');
    await this.positionInput('EN').fill(values.positionEn);
    await this.positionInput('VI').fill(values.positionVi);

    await this.activate('section-dates');
    const date = typeof values.startDate === 'string' ? new Date(values.startDate) : values.startDate;
    await this.pickMonthYear('startDate', date);

    await this.activate('section-location');
    await this.locationCountryInput.fill(values.locationCountry ?? 'Vietnam');
  }

  /**
   * Choose a month + year on a `console-month-year-picker`.
   *
   * The `<input>` is `readonly` — typing into it does nothing — so the calendar has to be
   * driven: toggle → multi-year view (a grid of years) → year → month. `controlName` works as
   * a selector only because the component deliberately mirrors it with
   * `[attr.formControlName]` for exactly this purpose.
   */
  async pickMonthYear(controlName: string, date: Date): Promise<void> {
    const field = this.control(controlName).locator('xpath=ancestor::mat-form-field[1]');
    await field.locator('mat-datepicker-toggle button').click();

    const calendar = this.page.locator('.mat-datepicker-content');
    await calendar
      .locator('.mat-calendar-body-cell', { hasText: String(date.getFullYear()) })
      .first()
      .click();

    const monthShort = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][
      date.getMonth()
    ];
    await calendar.locator('.mat-calendar-body-cell', { hasText: monthShort }).first().click();
  }

  /** Pick a skill from the autocomplete; the chip appears in the same section. */
  async selectSkill(skillName: string): Promise<void> {
    await this.activate('section-skills');
    await this.skillSearchInput.fill(skillName);
    await this.page.getByRole('option', { name: skillName, exact: true }).click();
  }

  /**
   * Click Save changes and wait for the write to land on `/api/experiences`.
   *
   * Update is **PUT**, not PATCH — `ExperienceService.update` calls `api.put`. PATCH on this
   * resource is the *restore* endpoint, so waiting on PATCH here would match the wrong call.
   */
  async save(method: 'POST' | 'PUT' = 'POST'): Promise<number> {
    return this.saveAndWait('/api/experiences', method);
  }
}
