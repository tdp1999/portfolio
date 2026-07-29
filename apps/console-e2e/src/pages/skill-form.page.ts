import { type Locator, type Page } from '@playwright/test';
import { SectionFormPage } from './section-form.page';

/** Rail label for each section id — `skill.form.ts` `sections` is the source of truth. */
const SECTION_LABELS = {
  'section-identity': 'Identity',
  'section-classification': 'Classification',
  'section-experience': 'Experience',
  'section-icon': 'Icon',
  'section-settings': 'Settings',
} as const;

export type SkillSectionId = keyof typeof SECTION_LABELS;

/**
 * `/skills/new` and `/skills/:id/edit`.
 *
 * The skill editor is a routed full page, not a dialog — `skills.html` reaches it through
 * `<a mat-flat-button routerLink="./new">`, and `openCreateDialog()` in the sibling project
 * list is a leftover method name that also just navigates. Any spec still scoping to
 * `mat-dialog-container` here is describing a shape that no longer exists.
 *
 * Note this page ships `showAll = signal(true)`, so its sections are all on screen from the
 * start; `activate()` is still safe to call and short-circuits.
 */
export class SkillFormPage extends SectionFormPage<SkillSectionId> {
  protected readonly labels = SECTION_LABELS;

  readonly heading: Locator;
  readonly nameInput: Locator;
  readonly descriptionInput: Locator;
  readonly categorySelect: Locator;
  readonly tierSelect: Locator;
  readonly parentSkillSelect: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: /^(New|Edit) Skill$/ });
    this.nameInput = page.locator('input[formControlName="name"]');
    this.descriptionInput = page.locator('textarea[formControlName="description"]');
    this.categorySelect = page.locator('mat-select[formControlName="category"]');
    this.tierSelect = page.locator('mat-select[formControlName="tier"]');
    this.parentSkillSelect = page.locator('mat-select[formControlName="parentSkillId"]');
  }

  // ── Icon section ────────────────────────────────────────────────────
  //
  // There is no `input[formControlName="iconId"]`: the icon lives in an `iconId` signal and
  // surfaces only as a preview `<img>` plus a trigger whose label flips between "Pick Icon"
  // and "Change Icon". Assert on the preview, never on a form control.

  get iconSection(): Locator {
    return this.section('section-icon');
  }

  get iconTrigger(): Locator {
    return this.iconSection.getByRole('button', { name: /(Pick|Change) Icon/ });
  }

  get iconPreview(): Locator {
    return this.iconSection.locator('img[alt="Icon preview"]');
  }

  get iconRemoveButton(): Locator {
    return this.iconSection.locator('button[mattooltip="Remove icon"]');
  }

  /** True while no icon is chosen — the dashed placeholder stands in for the preview. */
  get iconPlaceholder(): Locator {
    return this.iconSection.locator('.border-dashed');
  }

  async gotoNew(): Promise<void> {
    await this.page.goto('/skills/new');
    await this.heading.waitFor({ state: 'visible', timeout: 10_000 });
  }

  async gotoEdit(skillId: string): Promise<void> {
    await this.page.goto(`/skills/${skillId}/edit`);
    await this.heading.waitFor({ state: 'visible', timeout: 10_000 });
  }

  /** Fill the fields the API requires, so `save()` is not rejected on validation. */
  async fillRequired(name: string, category: 'Technical' | 'Tools' | 'Additional' = 'Technical'): Promise<void> {
    await this.activate('section-identity');
    await this.nameInput.fill(name);
    await this.activate('section-classification');
    await this.categorySelect.click();
    await this.page.getByRole('option', { name: category, exact: true }).click();
  }

  /** Click Save changes and wait for the write to land on `/api/skills`. */
  async save(method: 'POST' | 'PATCH' = 'POST'): Promise<number> {
    return this.saveAndWait('/api/skills', method);
  }
}
