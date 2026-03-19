import { test, expect } from './fixtures/auth.fixture';
import { SkillsPage } from './pages/skills.page';
import { TEST_SKILLS } from './data/test-skills';
import { createTestSkill, deleteTestSkills } from './helpers/db-skills';
import { expectToast } from './helpers/toast';
import { clickConfirm, clickCancel } from './helpers/dialog';

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

    await expectToast(page, 'Skill created successfully');
    await expect(skillsPage.getRowByName(TEST_SKILLS.create.name)).toBeVisible();
  });

  test('dialog cancel → no skill created', async ({ adminPage: page }) => {
    const skillsPage = new SkillsPage(page);
    await skillsPage.goto();

    await skillsPage.createButton.click();
    await skillsPage.dialog.nameInput.fill(TEST_SKILLS.createCancel.name);
    await skillsPage.dialog.cancelButton.click();

    await expect(skillsPage.dialog.container).not.toBeVisible();
    await expect(skillsPage.getRowByName(TEST_SKILLS.createCancel.name)).not.toBeVisible();
  });

  test('create validation: empty name', async ({ adminPage: page }) => {
    const skillsPage = new SkillsPage(page);
    await skillsPage.goto();

    await skillsPage.createButton.click();
    const createBtn = skillsPage.dialog.container.getByRole('button', { name: 'Create' });
    await createBtn.click();

    await expect(skillsPage.dialog.container.getByText('Name is required')).toBeVisible();
    await skillsPage.dialog.cancelButton.click();
  });

  test('create validation: name > 100 chars', async ({ adminPage: page }) => {
    const skillsPage = new SkillsPage(page);
    await skillsPage.goto();

    await skillsPage.createButton.click();
    await skillsPage.dialog.nameInput.fill('a'.repeat(101));
    const createBtn = skillsPage.dialog.container.getByRole('button', { name: 'Create' });
    await createBtn.click();

    await expect(skillsPage.dialog.container.getByText('Name must be 100 characters or less')).toBeVisible();
    await skillsPage.dialog.cancelButton.click();
  });

  test('create server error: duplicate name', async ({ adminPage: page }) => {
    const skillsPage = new SkillsPage(page);
    await skillsPage.goto();

    await createTestSkill(TEST_SKILLS.duplicate.name, { category: TEST_SKILLS.duplicate.category });

    await skillsPage.createSkill(TEST_SKILLS.duplicate.name, TEST_SKILLS.duplicate.category);

    await expect(skillsPage.dialog.serverError).toBeVisible();
    await skillsPage.dialog.cancelButton.click();
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

    await expectToast(page, 'Skill created successfully');
    // Child row has "└" prefix in name cell, so use non-exact match
    const childRow = page.locator('tr', { hasText: TEST_SKILLS.child.name });
    await expect(childRow).toBeVisible();
    await expect(childRow.getByRole('cell', { name: TEST_SKILLS.parent.name })).toBeVisible();
  });

  // ─── Edit ────────────────────────────────────────────────────────

  test('edit dialog pre-filled with current values', async ({ adminPage: page }) => {
    await deleteTestSkills();
    await createTestSkill(TEST_SKILLS.edit.name, {
      category: TEST_SKILLS.edit.category,
      description: TEST_SKILLS.edit.description,
      displayOrder: TEST_SKILLS.edit.displayOrder,
    });
    await createTestSkill(TEST_SKILLS.duplicate.name, { category: TEST_SKILLS.duplicate.category });

    const skillsPage = new SkillsPage(page);
    await skillsPage.goto();

    const row = skillsPage.getRowByName(TEST_SKILLS.edit.name);
    await row.locator('button', { has: page.locator('mat-icon', { hasText: 'edit' }) }).click();

    await expect(skillsPage.dialog.nameInput).toHaveValue(TEST_SKILLS.edit.name);
    await expect(skillsPage.dialog.descriptionInput).toHaveValue(TEST_SKILLS.edit.description);
    await expect(skillsPage.dialog.displayOrderInput).toHaveValue(String(TEST_SKILLS.edit.displayOrder));
    await skillsPage.dialog.cancelButton.click();
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

    await expectToast(page, 'Skill updated successfully');
    await expect(skillsPage.getRowByName(TEST_SKILLS.edit.updated)).toBeVisible();
  });

  test('edit server error: duplicate name', async ({ adminPage: page }) => {
    const skillsPage = new SkillsPage(page);
    await skillsPage.goto();

    await skillsPage.editSkill(TEST_SKILLS.edit.updated, {
      name: TEST_SKILLS.duplicate.name,
    });

    await expect(skillsPage.dialog.serverError).toBeVisible();
    await skillsPage.dialog.cancelButton.click();
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
    await parentRow.locator('button', { has: page.locator('mat-icon', { hasText: 'delete' }) }).click();
    await clickConfirm(page);

    // Server rejects — interceptor shows dictionary error toast
    await expectToast(page, 'Cannot delete a skill that has child skills');

    // Parent should still exist in table
    await expect(page.getByRole('row', { name: /e2e-skill-parent TECHNICAL/ })).toBeVisible();
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

  test('cannot set child as parent of another skill → server error', async ({ adminPage: page }) => {
    await deleteTestSkills();
    const parent = await createTestSkill(TEST_SKILLS.parent.name, { category: TEST_SKILLS.parent.category });
    await createTestSkill(TEST_SKILLS.child.name, {
      category: TEST_SKILLS.child.category,
      parentSkillId: parent.id,
    });

    const skillsPage = new SkillsPage(page);
    await skillsPage.goto();

    // Try to create a new skill with the child as parent — child shouldn't appear in parent dropdown
    // since it already has a parent (only top-level skills shown)
    await skillsPage.createButton.click();
    const dialog = skillsPage.dialog.container;
    await dialog.locator('mat-select[formControlName="parentSkillId"]').click();

    // Verify child skill is NOT in the parent dropdown options
    const childOption = page.locator('mat-option', { hasText: TEST_SKILLS.child.name });
    await expect(childOption).not.toBeVisible();

    // Parent skill should be available
    const parentOption = page.locator('mat-option', { hasText: TEST_SKILLS.parent.name });
    await expect(parentOption).toBeVisible();

    // Close dropdown and dialog
    await page.keyboard.press('Escape');
    await skillsPage.dialog.cancelButton.click();
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
