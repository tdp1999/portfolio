import { test, expect } from './fixtures/auth.fixture';
import { SkillsPage } from './pages/skills.page';
import { SkillFormPage } from './pages/skill-form.page';
import { TEST_SKILLS } from './data/test-skills';
import { createTestSkill, deleteTestSkills } from './helpers/db-skills';
import { expectToast } from './helpers/toast';
import { clickConfirm, clickCancel } from './helpers/dialog';

/**
 * Create and edit are routed pages (`/skills/new`, `/skills/:id/edit`) with a sticky save
 * bar, not `mat-dialog-container`s, so "cancel the dialog" is now "navigate away" and
 * "server error in the dialog" is now an error toast from the HTTP interceptor.
 *
 * Validation copy is deliberately matched loosely: `validation-messages.ts` is field-agnostic
 * ("This field is required."), so pinning an exact per-field sentence couples the suite to
 * wording it does not own — the failure mode that made these specs stale in the first place.
 */
test.describe('Skill Management', () => {
  test.describe.configure({ mode: 'serial' });

  test.afterAll(async () => {
    await deleteTestSkills();
  });

  // ─── List & Navigation ───────────────────────────────────────────

  test('can access /skills and see table + pagination', async ({ adminPage: page }) => {
    const skillsPage = new SkillsPage(page);
    await skillsPage.goto();

    await expect(skillsPage.heading).toBeVisible();
    await expect(skillsPage.table).toBeVisible();
    await expect(skillsPage.paginator).toBeVisible();
  });

  test('sees Skills link in sidebar', async ({ adminPage: page }) => {
    await page.goto('/');
    await page.waitForURL('/', { timeout: 10000 });

    const skillsLink = page.locator('a', { hasText: 'Skills' });
    await expect(skillsLink).toBeVisible();
  });

  // ─── Create ──────────────────────────────────────────────────────

  test('creates skill with all fields → appears in table + shows toast', async ({ adminPage: page }) => {
    const skillsPage = new SkillsPage(page);
    await skillsPage.goto();

    await skillsPage.createSkill(TEST_SKILLS.create.name, TEST_SKILLS.create.category, {
      description: TEST_SKILLS.create.description,
      displayOrder: TEST_SKILLS.create.displayOrder,
    });

    await expectToast(page, 'Skill created');
    await skillsPage.goto();
    await expect(skillsPage.getRowByName(TEST_SKILLS.create.name)).toBeVisible();
  });

  test('leaving the form without saving → no skill created', async ({ adminPage: page }) => {
    const skillsPage = new SkillsPage(page);
    await skillsPage.goto();

    const form = await skillsPage.openCreateForm();
    await form.activate('section-identity');
    await form.nameInput.fill(TEST_SKILLS.createCancel.name);

    await skillsPage.goto();

    await expect(skillsPage.getRowByName(TEST_SKILLS.createCancel.name)).not.toBeVisible();
  });

  test('create validation: empty name blocks the save', async ({ adminPage: page }) => {
    const form = new SkillFormPage(page);
    await form.gotoNew();
    await form.saveButton.click();

    const nameField = page.locator('mat-form-field').filter({ has: form.nameInput });
    await expect(nameField.locator('mat-error')).toHaveText(/required/i);
    // Still on the form: an invalid submit must not navigate.
    await expect(page).toHaveURL(/\/skills\/new$/);
  });

  test('create validation: name over the limit', async ({ adminPage: page }) => {
    const form = new SkillFormPage(page);
    await form.gotoNew();
    await form.activate('section-identity');
    await form.nameInput.fill('a'.repeat(101));
    await form.saveButton.click();

    const nameField = page.locator('mat-form-field').filter({ has: form.nameInput });
    await expect(nameField.locator('mat-error')).toHaveText(/characters or less/i);
  });

  test('create server error: duplicate name → error toast', async ({ adminPage: page }) => {
    await createTestSkill(TEST_SKILLS.duplicate.name, { category: TEST_SKILLS.duplicate.category });

    const form = new SkillFormPage(page);
    await form.gotoNew();
    await form.fillRequired(TEST_SKILLS.duplicate.name);
    await form.saveButton.click();

    await expectToast(page, 'A skill with this name already exists.');
  });

  // ─── Create with Parent ─────────────────────────────────────────

  test('creates child skill with parent → parent shown in table', async ({ adminPage: page }) => {
    await deleteTestSkills();
    await createTestSkill(TEST_SKILLS.parent.name, { category: TEST_SKILLS.parent.category });

    const skillsPage = new SkillsPage(page);
    await skillsPage.goto();

    await skillsPage.createSkill(TEST_SKILLS.child.name, TEST_SKILLS.child.category, {
      parentSkillName: TEST_SKILLS.parent.name,
    });

    await expectToast(page, 'Skill created');
    await skillsPage.goto();
    // Child row has "└" prefix in name cell, so use non-exact match
    const childRow = page.locator('tr', { hasText: TEST_SKILLS.child.name });
    await expect(childRow).toBeVisible();
    await expect(childRow.getByRole('cell', { name: TEST_SKILLS.parent.name })).toBeVisible();
  });

  // ─── Edit ────────────────────────────────────────────────────────

  test('edit form pre-filled with current values', async ({ adminPage: page }) => {
    await deleteTestSkills();
    await createTestSkill(TEST_SKILLS.edit.name, {
      category: TEST_SKILLS.edit.category,
      description: TEST_SKILLS.edit.description,
      displayOrder: TEST_SKILLS.edit.displayOrder,
    });
    await createTestSkill(TEST_SKILLS.duplicate.name, { category: TEST_SKILLS.duplicate.category });

    const skillsPage = new SkillsPage(page);
    await skillsPage.goto();
    const form = await skillsPage.openEditForm(TEST_SKILLS.edit.name);

    await form.activate('section-identity');
    await expect(form.nameInput).toHaveValue(TEST_SKILLS.edit.name);
    await expect(form.descriptionInput).toHaveValue(TEST_SKILLS.edit.description);

    await form.activate('section-settings');
    await expect(form.section('section-settings').getByLabel('Display Order')).toHaveValue(
      String(TEST_SKILLS.edit.displayOrder)
    );
  });

  test('edits skill → updated in table + shows toast', async ({ adminPage: page }) => {
    const skillsPage = new SkillsPage(page);
    await skillsPage.goto();

    await skillsPage.editSkill(TEST_SKILLS.edit.name, {
      name: TEST_SKILLS.edit.updated,
      category: TEST_SKILLS.edit.updatedCategory,
      description: TEST_SKILLS.edit.updatedDescription,
      displayOrder: TEST_SKILLS.edit.updatedDisplayOrder,
    });

    await expectToast(page, 'Skill updated');
    await skillsPage.goto();
    await expect(skillsPage.getRowByName(TEST_SKILLS.edit.updated)).toBeVisible();
  });

  test('edit server error: duplicate name → error toast', async ({ adminPage: page }) => {
    const skillsPage = new SkillsPage(page);
    await skillsPage.goto();

    const form = await skillsPage.openEditForm(TEST_SKILLS.edit.updated);
    await form.activate('section-identity');
    await form.nameInput.fill(TEST_SKILLS.duplicate.name);
    await form.saveButton.click();

    await expectToast(page, 'A skill with this name already exists.');
  });

  // ─── Delete ──────────────────────────────────────────────────────

  test('cancel on confirm dialog → skill remains', async ({ adminPage: page }) => {
    await deleteTestSkills();
    await createTestSkill(TEST_SKILLS.delete.name, { category: TEST_SKILLS.delete.category });
    await createTestSkill(TEST_SKILLS.deleteCancel.name, { category: TEST_SKILLS.deleteCancel.category });

    const skillsPage = new SkillsPage(page);
    await skillsPage.goto();

    await skillsPage.clickDeleteOnRow(TEST_SKILLS.deleteCancel.name);
    await clickCancel(page);

    await expect(skillsPage.getRowByName(TEST_SKILLS.deleteCancel.name)).toBeVisible();
  });

  test('deletes skill after confirm → disappears + shows toast', async ({ adminPage: page }) => {
    const skillsPage = new SkillsPage(page);
    await skillsPage.goto();

    await skillsPage.clickDeleteOnRow(TEST_SKILLS.delete.name);
    await clickConfirm(page);

    await expectToast(page, 'Skill deleted successfully');
    await expect(skillsPage.getRowByName(TEST_SKILLS.delete.name)).not.toBeVisible();
  });

  test('delete guard: server rejects deleting parent with children → shows error toast', async ({
    adminPage: page,
  }) => {
    await deleteTestSkills();
    const parent = await createTestSkill(TEST_SKILLS.parent.name, { category: TEST_SKILLS.parent.category });
    await createTestSkill(TEST_SKILLS.child.name, {
      category: TEST_SKILLS.child.category,
      parentSkillId: parent.id,
    });

    const skillsPage = new SkillsPage(page);
    await skillsPage.goto();

    // Parent name appears in both parent row (name cell) and child row (parent cell),
    // so target the row where the FIRST cell matches the parent name
    const parentRow = page
      .locator('tr')
      .filter({
        has: page.locator('td:first-child', { hasText: TEST_SKILLS.parent.name }),
      })
      .filter({
        hasNot: page.locator('td:first-child', { hasText: TEST_SKILLS.child.name }),
      });
    await parentRow.getByRole('button', { name: 'Delete' }).click();
    await clickConfirm(page);

    // Server rejects — interceptor shows dictionary error toast
    await expectToast(page, 'Cannot delete a skill that has child skills');

    // Parent should still exist in table. Re-uses the locator built above rather than matching
    // the row's accessible name: the category cell renders `skill.category | enumLabel`, so it
    // reads "Technical", never the raw `TECHNICAL` the old regex looked for.
    await expect(parentRow).toBeVisible();
  });

  // ─── Search ──────────────────────────────────────────────────────

  test('search filters skills by name', async ({ adminPage: page }) => {
    await deleteTestSkills();
    await createTestSkill(TEST_SKILLS.search.name, { category: TEST_SKILLS.search.category });
    await createTestSkill(TEST_SKILLS.searchOther.name, { category: TEST_SKILLS.searchOther.category });

    const skillsPage = new SkillsPage(page);
    await skillsPage.goto();

    await skillsPage.search('skill-search');

    await expect(skillsPage.getRowByName(TEST_SKILLS.search.name)).toBeVisible();
    await expect(skillsPage.getRowByName(TEST_SKILLS.searchOther.name)).not.toBeVisible();
  });

  test('clear search shows all skills', async ({ adminPage: page }) => {
    const skillsPage = new SkillsPage(page);
    await skillsPage.goto();

    await skillsPage.search('skill-search');
    await expect(skillsPage.getRowByName(TEST_SKILLS.searchOther.name)).not.toBeVisible();

    await skillsPage.clearSearch();

    await expect(skillsPage.getRowByName(TEST_SKILLS.search.name)).toBeVisible();
    await expect(skillsPage.getRowByName(TEST_SKILLS.searchOther.name)).toBeVisible();
  });

  // ─── Category Filter ────────────────────────────────────────────

  test('category filter shows only matching skills', async ({ adminPage: page }) => {
    const skillsPage = new SkillsPage(page);
    await skillsPage.goto();

    await skillsPage.filterByCategory('TECHNICAL');

    await expect(skillsPage.getRowByName(TEST_SKILLS.search.name)).toBeVisible();
    await expect(skillsPage.getRowByName(TEST_SKILLS.searchOther.name)).not.toBeVisible();
  });

  test('clear category filter shows all skills', async ({ adminPage: page }) => {
    const skillsPage = new SkillsPage(page);
    await skillsPage.goto();

    await skillsPage.filterByCategory('TECHNICAL');
    await expect(skillsPage.getRowByName(TEST_SKILLS.searchOther.name)).not.toBeVisible();

    // Navigate fresh and verify all skills are shown (default = All)
    await skillsPage.goto();

    await expect(skillsPage.getRowByName(TEST_SKILLS.search.name)).toBeVisible();
    await expect(skillsPage.getRowByName(TEST_SKILLS.searchOther.name)).toBeVisible();
  });

  // ─── Hierarchy Validation ───────────────────────────────────────

  test('a skill that already has a parent is not offered as a parent', async ({ adminPage: page }) => {
    await deleteTestSkills();
    const parent = await createTestSkill(TEST_SKILLS.parent.name, { category: TEST_SKILLS.parent.category });
    await createTestSkill(TEST_SKILLS.child.name, {
      category: TEST_SKILLS.child.category,
      parentSkillId: parent.id,
    });

    // `parentSkillsForSelect` filters to top-level skills only, so the child must be absent.
    const form = new SkillFormPage(page);
    await form.gotoNew();
    await form.activate('section-classification');
    await form.parentSkillSelect.click();

    await expect(page.getByRole('option', { name: TEST_SKILLS.parent.name, exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: TEST_SKILLS.child.name, exact: true })).toHaveCount(0);

    await page.keyboard.press('Escape');
  });

  // ─── Access Control ──────────────────────────────────────────────

  test('non-admin redirected away from /skills', async ({ authenticatedPage: page }) => {
    await page.goto('/');
    await page.waitForURL('/');

    await page.goto('/skills');
    await page.waitForURL('/', { timeout: 10000 });
  });

  test('non-admin does not see Skills in sidebar', async ({ authenticatedPage: page }) => {
    await page.goto('/');
    await page.waitForURL('/');

    const skillsLink = page.locator('a', { hasText: 'Skills' });
    await expect(skillsLink).not.toBeVisible();
  });
});
