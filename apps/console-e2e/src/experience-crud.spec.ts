import { test, expect } from './fixtures/auth.fixture';
import { ExperiencesPage } from './pages/experiences.page';
import { TEST_EXPERIENCES } from './data/test-experiences';
import { TEST_USERS } from './data/test-users';
import { createTestExperience, deleteTestExperiences, softDeleteTestExperience } from './helpers/db-experiences';
import { createTestSkill, deleteTestSkills } from './helpers/db-skills';
import { expectToast } from './helpers/toast';
import { clickConfirm } from './helpers/dialog';

/** Login via page.request (shares browser cookie jar) and return Bearer token for API calls. */
async function getAdminToken(page: import('@playwright/test').Page): Promise<string> {
  const res = await page.request.post('/api/auth/login', {
    data: { email: TEST_USERS.admin.email, password: TEST_USERS.admin.password, rememberMe: false },
  });
  const body = await res.json();
  return body.accessToken;
}

test.describe('Experience Management', () => {
  test.describe.configure({ mode: 'serial' });

  test.afterAll(async () => {
    await deleteTestExperiences();
  });

  // ─── Navigation ──────────────────────────────────────────────────

  test('can access /experiences and see table + paginator', async ({ adminPage: page }) => {
    const expPage = new ExperiencesPage(page);
    await expPage.goto();

    await expect(expPage.heading).toBeVisible();
    await expect(expPage.table).toBeVisible();
    await expect(expPage.paginator).toBeVisible();
  });

  // ─── Create — Required Fields Only ──────────────────────────────

  test('creates experience with required fields → appears in table + shows toast', async ({ adminPage: page }) => {
    const expPage = new ExperiencesPage(page);
    await expPage.goto();

    await expPage.addButton.click();
    await expPage.fillRequiredFields({
      companyName: TEST_EXPERIENCES.create.companyName,
      positionEn: TEST_EXPERIENCES.create.positionEn,
      positionVi: TEST_EXPERIENCES.create.positionVi,
      startDate: TEST_EXPERIENCES.create.startDate,
    });

    await expect(expPage.dialog.submitButton).toBeEnabled({ timeout: 3000 });
    await expPage.dialog.submitButton.click();

    await expectToast(page, 'Experience created successfully');
    await expect(expPage.getRowByCompany(TEST_EXPERIENCES.create.companyName)).toBeVisible();
  });

  // ─── Create — Optional Fields ────────────────────────────────────

  test('creates experience with optional fields → appears in table', async ({ adminPage: page }) => {
    const expPage = new ExperiencesPage(page);
    await expPage.goto();

    await expPage.addButton.click();
    await expPage.fillRequiredFields({
      companyName: TEST_EXPERIENCES.createOptional.companyName,
      positionEn: TEST_EXPERIENCES.createOptional.positionEn,
      positionVi: TEST_EXPERIENCES.createOptional.positionVi,
      startDate: TEST_EXPERIENCES.createOptional.startDate,
    });

    // Fill description
    await expPage.dialog.descriptionEnTextarea.fill(TEST_EXPERIENCES.createOptional.descriptionEn);
    await expPage.dialog.descriptionViTextarea.fill(TEST_EXPERIENCES.createOptional.descriptionVi);

    // Fill team role
    await expPage.dialog.teamRoleEnInput.fill(TEST_EXPERIENCES.createOptional.teamRoleEn);
    await expPage.dialog.teamRoleViInput.fill(TEST_EXPERIENCES.createOptional.teamRoleVi);

    // Add achievement
    await expPage.addEnglishAchievement(TEST_EXPERIENCES.createOptional.achievementEn);

    await expPage.dialog.submitButton.click();

    await expectToast(page, 'Experience created successfully');
    await expect(expPage.getRowByCompany(TEST_EXPERIENCES.createOptional.companyName)).toBeVisible();
  });

  // ─── Edit ────────────────────────────────────────────────────────

  test('edit dialog pre-filled with current position', async ({ adminPage: page }) => {
    await deleteTestExperiences();
    await createTestExperience(TEST_EXPERIENCES.edit.companyName, TEST_EXPERIENCES.edit.positionEn, {
      positionVi: TEST_EXPERIENCES.edit.positionVi,
      startDate: new Date('2020-06-01'),
    });

    const expPage = new ExperiencesPage(page);
    await expPage.goto();

    await expPage.clickEdit(TEST_EXPERIENCES.edit.companyName);

    await expect(expPage.dialog.companyNameInput).toHaveValue(TEST_EXPERIENCES.edit.companyName);
    await expect(expPage.dialog.positionEnInput).toHaveValue(TEST_EXPERIENCES.edit.positionEn);
    await expPage.dialog.cancelButton.click();
  });

  test('edits experience position → updated in table + shows toast', async ({ adminPage: page }) => {
    const expPage = new ExperiencesPage(page);
    await expPage.goto();

    await expPage.clickEdit(TEST_EXPERIENCES.edit.companyName);

    await expPage.dialog.positionEnInput.selectText();
    await expPage.dialog.positionEnInput.fill(TEST_EXPERIENCES.edit.updatedPositionEn);
    await expPage.dialog.positionViInput.selectText();
    await expPage.dialog.positionViInput.fill(TEST_EXPERIENCES.edit.updatedPositionVi);

    await expPage.dialog.submitButton.click();

    await expectToast(page, 'Experience updated successfully');
    await expect(
      expPage.getRowByCompany(TEST_EXPERIENCES.edit.companyName).locator('td', {
        hasText: TEST_EXPERIENCES.edit.updatedPositionEn,
      })
    ).toBeVisible();
  });

  test('slug does NOT change after editing position', async ({ adminPage: page }) => {
    const token = await getAdminToken(page);
    const authHeaders = { Authorization: `Bearer ${token}` };

    // Get the current slug before editing
    const listRes = await page.request.get(`/api/experiences/admin/list`, {
      headers: authHeaders,
      params: { search: TEST_EXPERIENCES.edit.companyName },
    });
    const listBody = await listRes.json();
    const beforeSlug = listBody.data[0]?.slug;
    expect(beforeSlug).toBeDefined();

    const expPage = new ExperiencesPage(page);
    await expPage.goto();

    // Edit position again (different value)
    await expPage.clickEdit(TEST_EXPERIENCES.edit.companyName);
    const newPosition = 'Principal Engineer';
    await expPage.dialog.positionEnInput.selectText();
    await expPage.dialog.positionEnInput.fill(newPosition);
    await expPage.dialog.submitButton.click();
    await expectToast(page, 'Experience updated successfully');

    // Verify slug is unchanged
    const afterRes = await page.request.get(`/api/experiences/admin/list`, {
      headers: authHeaders,
      params: { search: TEST_EXPERIENCES.edit.companyName },
    });
    const afterBody = await afterRes.json();
    const afterSlug = afterBody.data[0]?.slug;
    expect(afterSlug).toBe(beforeSlug);
  });

  // ─── Current Position Toggle ────────────────────────────────────

  test('"Current position" toggle: check → endDate disabled; uncheck → endDate enabled', async ({
    adminPage: page,
  }) => {
    const expPage = new ExperiencesPage(page);
    await expPage.goto();

    await expPage.addButton.click();
    const d = expPage.dialog;

    // By default isCurrent is checked (no end date → current)
    // Check that endDate is disabled
    await expect(d.endDateInput).toBeDisabled();

    // Uncheck isCurrent → endDate should enable
    await d.isCurrentCheckbox.click();
    await expect(d.endDateInput).toBeEnabled();

    // Re-check isCurrent → endDate disabled again
    await d.isCurrentCheckbox.click();
    await expect(d.endDateInput).toBeDisabled();

    await d.cancelButton.click();
  });

  // ─── Soft Delete ─────────────────────────────────────────────────

  test('soft delete: experience shows "Deleted" indicator after delete', async ({ adminPage: page }) => {
    await deleteTestExperiences();
    await createTestExperience(TEST_EXPERIENCES.delete.companyName, TEST_EXPERIENCES.delete.positionEn, {
      startDate: new Date('2021-01-01'),
    });

    const expPage = new ExperiencesPage(page);
    await expPage.goto();

    await expPage.clickDelete(TEST_EXPERIENCES.delete.companyName);
    await clickConfirm(page);

    await expectToast(page, 'Experience deleted');

    // Row should still appear but with deleted indicator
    const row = expPage.getRowByCompany(TEST_EXPERIENCES.delete.companyName);
    await expect(row).toBeVisible();
    await expect(row.locator('span', { hasText: 'Deleted' })).toBeVisible();
  });

  // ─── Restore ─────────────────────────────────────────────────────

  test('restore: soft-deleted experience can be restored', async ({ adminPage: page }) => {
    await deleteTestExperiences();
    const created = await createTestExperience(
      TEST_EXPERIENCES.restore.companyName,
      TEST_EXPERIENCES.restore.positionEn,
      { startDate: new Date('2019-06-01') }
    );
    await softDeleteTestExperience(created.id);

    const expPage = new ExperiencesPage(page);
    await expPage.goto();

    // Confirm deleted indicator is shown
    const row = expPage.getRowByCompany(TEST_EXPERIENCES.restore.companyName);
    await expect(row.locator('span', { hasText: 'Deleted' })).toBeVisible();

    await expPage.clickRestore(TEST_EXPERIENCES.restore.companyName);
    await clickConfirm(page);

    await expectToast(page, 'Experience restored');

    // Deleted indicator should be gone
    await expect(row.locator('span', { hasText: 'Deleted' })).not.toBeVisible();
  });

  // ─── Skills Relation ─────────────────────────────────────────────

  test('create experience with skill selected → skill shown in edit view', async ({ adminPage: page }) => {
    await deleteTestExperiences();

    // Create a test skill to use
    const skill = await createTestSkill('e2e-skill-for-exp', { category: 'TECHNICAL' });

    const expPage = new ExperiencesPage(page);
    await expPage.goto();

    await expPage.addButton.click();
    await expPage.fillRequiredFields({
      companyName: TEST_EXPERIENCES.skills.companyName,
      positionEn: TEST_EXPERIENCES.skills.positionEn,
      positionVi: TEST_EXPERIENCES.skills.positionVi,
      startDate: TEST_EXPERIENCES.skills.startDate,
    });

    // Select the skill via autocomplete
    await expPage.selectSkill(skill.name);

    // Skill chip should appear
    await expect(expPage.dialog.selectedSkillChips.filter({ hasText: skill.name })).toBeVisible();

    await expPage.dialog.submitButton.click();
    await expectToast(page, 'Experience created successfully');

    // Open edit dialog — skill should still be pre-selected
    await expPage.clickEdit(TEST_EXPERIENCES.skills.companyName);
    await expect(expPage.dialog.selectedSkillChips.filter({ hasText: skill.name })).toBeVisible();
    await expPage.dialog.cancelButton.click();
  });

  test('update experience: remove skill → skill no longer in edit view', async ({ adminPage: page }) => {
    const expPage = new ExperiencesPage(page);
    await expPage.goto();

    await expPage.clickEdit(TEST_EXPERIENCES.skills.companyName);

    // The skill chip should be present; click remove (matChipRemove button inside chip)
    const chip = expPage.dialog.selectedSkillChips.first();
    await chip.locator('button[matChipRemove]').click();

    await expect(expPage.dialog.selectedSkillChips).toHaveCount(0);

    await expPage.dialog.submitButton.click();
    await expectToast(page, 'Experience updated successfully');

    // Verify skill removed on re-open
    await expPage.clickEdit(TEST_EXPERIENCES.skills.companyName);
    await expect(expPage.dialog.selectedSkillChips).toHaveCount(0);
    await expPage.dialog.cancelButton.click();

    // Cleanup test skill after both skill tests are done
    await deleteTestSkills();
  });

  // ─── Slug Collision ──────────────────────────────────────────────

  test('two experiences with same company + position get different slugs', async ({ adminPage: page }) => {
    const token = await getAdminToken(page);
    const authHeaders = { Authorization: `Bearer ${token}` };

    const expPage = new ExperiencesPage(page);
    await expPage.goto();

    // Create first experience
    await expPage.addButton.click();
    await expPage.fillRequiredFields({
      companyName: TEST_EXPERIENCES.slug1.companyName,
      positionEn: TEST_EXPERIENCES.slug1.positionEn,
      positionVi: TEST_EXPERIENCES.slug1.positionVi,
      startDate: TEST_EXPERIENCES.slug1.startDate,
    });
    await expPage.dialog.submitButton.click();
    await expectToast(page, 'Experience created successfully');

    // Create second experience with same company + position
    await expPage.addButton.click();
    await expPage.fillRequiredFields({
      companyName: TEST_EXPERIENCES.slug2.companyName,
      positionEn: TEST_EXPERIENCES.slug2.positionEn,
      positionVi: TEST_EXPERIENCES.slug2.positionVi,
      startDate: TEST_EXPERIENCES.slug2.startDate,
    });
    await expPage.dialog.submitButton.click();
    await expectToast(page, 'Experience created successfully');

    // Both should exist and have different slugs
    const res = await page.request.get(`/api/experiences/admin/list`, {
      headers: authHeaders,
      params: { search: TEST_EXPERIENCES.slug1.companyName, limit: '50' },
    });
    const resData = await res.json();
    const slugEntries = resData.data.filter(
      (e: { companyName: string }) => e.companyName === TEST_EXPERIENCES.slug1.companyName
    );
    const slugs: string[] = slugEntries.map((e: { slug: string }) => e.slug);
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(slugs.length);
  });
});
