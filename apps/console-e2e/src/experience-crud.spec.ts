import { test, expect } from './fixtures/auth.fixture';
import { ExperiencesPage } from './pages/experiences.page';
import { ExperienceFormPage } from './pages/experience-form.page';
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

/**
 * The experience create/edit dialog became a routed, tab-sectioned page. Four things the old
 * spec assumed are gone, and each one is worth stating because they are not interchangeable:
 *
 * - **No dialog.** `openCreateDialog()` on the list still carries the name but navigates to
 *   `/experiences/new`. Submit is the sticky bar's "Save changes", not a Create/Update button.
 * - **`position` is a nested group.** It renders through `console-translatable-group`, so the
 *   inputs are `formControlName="en"` / `"vi"` under `position`, never `position_en`.
 * - **Description is rich text.** `description`, `responsibilities` and `highlights` are
 *   `richTextGroup`s driven by the document-engine editor, not `<textarea>`s. All three are
 *   optional, so this file leaves them alone rather than driving the editor.
 * - **`achievements` no longer exists.** It was dropped in task 363.
 *
 * Update is **PUT** (`ExperienceService.update` → `api.put`); PATCH on this resource is restore.
 */
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

  test('Add Experience navigates instead of opening a dialog', async ({ adminPage: page }) => {
    const expPage = new ExperiencesPage(page);
    await expPage.goto();

    await expPage.addButton.click();

    await expect(page).toHaveURL(/\/experiences\/new$/);
    await expect(page.locator('mat-dialog-container')).toHaveCount(0);
  });

  // ─── Create ──────────────────────────────────────────────────────

  test('creates experience with required fields → appears in table + shows toast', async ({ adminPage: page }) => {
    await deleteTestExperiences();

    const expPage = new ExperiencesPage(page);
    await expPage.goto();

    const form = await expPage.openCreateForm();
    await form.fillRequired(TEST_EXPERIENCES.create);
    expect(await form.save('POST')).toBe(201);

    await expectToast(page, 'Experience created successfully');
    await expPage.goto();
    await expect(expPage.getRowByCompany(TEST_EXPERIENCES.create.companyName)).toBeVisible();
  });

  test('creates experience with optional team role → appears in table', async ({ adminPage: page }) => {
    const expPage = new ExperiencesPage(page);
    await expPage.goto();

    const form = await expPage.openCreateForm();
    await form.fillRequired(TEST_EXPERIENCES.createOptional);
    // Team Role is the one optional bilingual field that is still a plain text input; the
    // description fields next to it are rich-text editors and are skipped deliberately.
    await form.activate('section-role');
    await form.teamRoleInput('EN').fill(TEST_EXPERIENCES.createOptional.teamRoleEn);
    await form.teamRoleInput('VI').fill(TEST_EXPERIENCES.createOptional.teamRoleVi);

    expect(await form.save('POST')).toBe(201);

    await expectToast(page, 'Experience created successfully');
    await expPage.goto();
    await expect(expPage.getRowByCompany(TEST_EXPERIENCES.createOptional.companyName)).toBeVisible();
  });

  test('create validation: missing company blocks the save', async ({ adminPage: page }) => {
    const form = new ExperienceFormPage(page);
    await form.gotoNew();

    await form.saveButton.click();

    await expect(form.errorFor('companyName')).toHaveText(/required/i);
    await expect(page).toHaveURL(/\/experiences\/new$/);
    // The form also announces the block, rather than failing silently.
    await expectToast(page, 'Please fix validation errors before saving');
  });

  // ─── Edit ────────────────────────────────────────────────────────

  test('edit form pre-filled with current values', async ({ adminPage: page }) => {
    await deleteTestExperiences();
    await createTestExperience(TEST_EXPERIENCES.edit.companyName, TEST_EXPERIENCES.edit.positionEn, {
      positionVi: TEST_EXPERIENCES.edit.positionVi,
      startDate: new Date('2020-06-01'),
    });

    const expPage = new ExperiencesPage(page);
    await expPage.goto();
    const form = await expPage.openEditForm(TEST_EXPERIENCES.edit.companyName);

    await expect(form.companyNameInput).toHaveValue(TEST_EXPERIENCES.edit.companyName);
    await form.activate('section-role');
    await expect(form.positionInput('EN')).toHaveValue(TEST_EXPERIENCES.edit.positionEn);
    await expect(form.positionInput('VI')).toHaveValue(TEST_EXPERIENCES.edit.positionVi);
  });

  test('edits experience position → updated in table + shows toast', async ({ adminPage: page }) => {
    const expPage = new ExperiencesPage(page);
    await expPage.goto();

    const form = await expPage.openEditForm(TEST_EXPERIENCES.edit.companyName);
    await form.activate('section-role');
    await form.positionInput('EN').fill(TEST_EXPERIENCES.edit.updatedPositionEn);
    await form.positionInput('VI').fill(TEST_EXPERIENCES.edit.updatedPositionVi);
    expect(await form.save('PUT')).toBe(200);

    await expectToast(page, 'Experience updated successfully');
    await expPage.goto();
    await expect(
      expPage.getRowByCompany(TEST_EXPERIENCES.edit.companyName).getByRole('cell', {
        name: TEST_EXPERIENCES.edit.updatedPositionEn,
      })
    ).toBeVisible();
  });

  test('slug does NOT change after editing position', async ({ adminPage: page }) => {
    const token = await getAdminToken(page);
    const authHeaders = { Authorization: `Bearer ${token}` };

    const listRes = await page.request.get(`/api/experiences/admin/list`, {
      headers: authHeaders,
      params: { search: TEST_EXPERIENCES.edit.companyName },
    });
    const listBody = await listRes.json();
    const beforeSlug = listBody.data[0]?.slug;
    expect(beforeSlug).toBeDefined();

    const expPage = new ExperiencesPage(page);
    await expPage.goto();

    const form = await expPage.openEditForm(TEST_EXPERIENCES.edit.companyName);
    await form.activate('section-role');
    await form.positionInput('EN').fill('Principal Engineer');
    expect(await form.save('PUT')).toBe(200);
    await expectToast(page, 'Experience updated successfully');

    const afterRes = await page.request.get(`/api/experiences/admin/list`, {
      headers: authHeaders,
      params: { search: TEST_EXPERIENCES.edit.companyName },
    });
    const afterBody = await afterRes.json();
    expect(afterBody.data[0]?.slug).toBe(beforeSlug);
  });

  // ─── Current Position Toggle ────────────────────────────────────

  test('"Current position" toggle drives whether End Date is editable', async ({ adminPage: page }) => {
    const form = new ExperienceFormPage(page);
    await form.gotoNew();
    await form.activate('section-dates');

    // `isCurrent` defaults to true, and `setupCurrentPositionToggle` disables endDate for it.
    await expect(form.endDateInput).toBeDisabled();

    await form.isCurrentCheckbox.click();
    await expect(form.endDateInput).toBeEnabled();

    await form.isCurrentCheckbox.click();
    await expect(form.endDateInput).toBeDisabled();
  });

  // ─── Soft Delete ─────────────────────────────────────────────────

  test('soft delete: row leaves the list, and comes back dimmed under Show deleted', async ({ adminPage: page }) => {
    await deleteTestExperiences();
    await createTestExperience(TEST_EXPERIENCES.delete.companyName, TEST_EXPERIENCES.delete.positionEn, {
      startDate: new Date('2021-01-01'),
    });

    const expPage = new ExperiencesPage(page);
    await expPage.goto();

    await expPage.clickDelete(TEST_EXPERIENCES.delete.companyName);
    await clickConfirm(page);

    await expectToast(page, 'Experience deleted');

    // The row does not merely dim — it leaves the table. `showDeleted` starts `false`, so the list
    // query omits `includeDeleted` and the server never returns the deleted experience. (There is
    // no "Deleted" badge anywhere either; that lives on the detail page.)
    await expect(expPage.getRowByCompany(TEST_EXPERIENCES.delete.companyName)).toHaveCount(0);

    // With deleted rows included it reappears, dimmed, with Restore in place of Edit/Delete.
    await expPage.showDeleted();
    await expect(expPage.restoreButton(TEST_EXPERIENCES.delete.companyName)).toBeVisible();
    expect(await expPage.isRowDeleted(TEST_EXPERIENCES.delete.companyName)).toBe(true);
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

    // Deleted rows are excluded by default, so it is not on screen yet.
    await expect(expPage.getRowByCompany(TEST_EXPERIENCES.restore.companyName)).toHaveCount(0);
    await expPage.showDeleted();
    await expect(expPage.restoreButton(TEST_EXPERIENCES.restore.companyName)).toBeVisible();

    await expPage.clickRestore(TEST_EXPERIENCES.restore.companyName);
    await clickConfirm(page);

    await expectToast(page, 'Experience restored');

    await expect(expPage.restoreButton(TEST_EXPERIENCES.restore.companyName)).toHaveCount(0);
    expect(await expPage.isRowDeleted(TEST_EXPERIENCES.restore.companyName)).toBe(false);
  });

  // ─── Skills Relation ─────────────────────────────────────────────

  test('create experience with skill selected → skill still selected on re-open', async ({ adminPage: page }) => {
    await deleteTestExperiences();
    const skill = await createTestSkill('e2e-skill-for-exp', { category: 'TECHNICAL' });

    const expPage = new ExperiencesPage(page);
    await expPage.goto();

    const form = await expPage.openCreateForm();
    await form.fillRequired(TEST_EXPERIENCES.skills);
    await form.selectSkill(skill.name);
    await expect(form.selectedSkillChips.filter({ hasText: skill.name })).toBeVisible();

    expect(await form.save('POST')).toBe(201);
    await expectToast(page, 'Experience created successfully');

    await expPage.goto();
    const editForm = await expPage.openEditForm(TEST_EXPERIENCES.skills.companyName);
    await editForm.activate('section-skills');
    await expect(editForm.selectedSkillChips.filter({ hasText: skill.name })).toBeVisible();
  });

  test('update experience: remove skill → skill no longer selected', async ({ adminPage: page }) => {
    const expPage = new ExperiencesPage(page);
    await expPage.goto();

    const form = await expPage.openEditForm(TEST_EXPERIENCES.skills.companyName);
    await form.activate('section-skills');
    await form.selectedSkillChips.first().locator('button[matChipRemove]').click();
    await expect(form.selectedSkillChips).toHaveCount(0);

    expect(await form.save('PUT')).toBe(200);
    await expectToast(page, 'Experience updated successfully');

    await expPage.goto();
    const reopened = await expPage.openEditForm(TEST_EXPERIENCES.skills.companyName);
    await reopened.activate('section-skills');
    await expect(reopened.selectedSkillChips).toHaveCount(0);

    await deleteTestSkills();
  });

  // ─── Slug Collision ──────────────────────────────────────────────

  test('two experiences with same company + position get different slugs', async ({ adminPage: page }) => {
    await deleteTestExperiences();
    const token = await getAdminToken(page);
    const authHeaders = { Authorization: `Bearer ${token}` };

    const expPage = new ExperiencesPage(page);

    for (const fixture of [TEST_EXPERIENCES.slug1, TEST_EXPERIENCES.slug2]) {
      await expPage.goto();
      const form = await expPage.openCreateForm();
      await form.fillRequired(fixture);
      expect(await form.save('POST')).toBe(201);
      await expectToast(page, 'Experience created successfully');
    }

    const res = await page.request.get(`/api/experiences/admin/list`, {
      headers: authHeaders,
      params: { search: TEST_EXPERIENCES.slug1.companyName, limit: '50' },
    });
    const resData = await res.json();
    const slugs: string[] = resData.data
      .filter((e: { companyName: string }) => e.companyName === TEST_EXPERIENCES.slug1.companyName)
      .map((e: { slug: string }) => e.slug);

    expect(slugs).toHaveLength(2);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
