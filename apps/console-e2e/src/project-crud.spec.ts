import { test, expect } from './fixtures/auth.fixture';
import { ProjectsPage } from './pages/projects.page';
import { expectToast } from './helpers/toast';
import { clickConfirm } from './helpers/dialog';
import axios from 'axios';

const API = 'http://localhost:3000';
const PREFIX = 'e2e-console-proj-';

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

function validPayload(title: string) {
  return {
    title,
    oneLiner: { en: 'One liner EN', vi: 'One liner VI' },
    description: { en: 'Description EN', vi: 'Mo ta VI' },
    motivation: { en: 'Motivation EN', vi: 'Dong luc VI' },
    role: { en: 'Developer', vi: 'Lap trinh vien' },
    startDate: '2024-01-01T00:00:00.000Z',
    skillIds: [],
    imageIds: [],
    highlights: [],
  };
}

/**
 * Seeding stays on the API on purpose. A project needs title, one-liner, motivation,
 * description and role in **both** locales, and the last three are document-engine rich-text
 * editors — driving them through the UI would make this file a test of the editor rather than
 * of project CRUD. Everything that is genuinely UI (list, edit, delete, restore) is driven
 * through the console.
 *
 * The list page lost its All/Published/Draft/Trash tabs; deleted projects are revealed by the
 * "Show deleted" chip instead, and they are *absent* from the table until it is on rather than
 * merely dimmed. Update is **PUT**; PATCH on this resource is restore/reorder.
 */
test.describe('Projects CRUD', () => {
  test.describe.configure({ mode: 'serial' });

  let adminToken: string;

  test.beforeAll(async () => {
    const res = await axios.post(`${API}/api/auth/login`, {
      email: 'test-admin@e2e.local',
      password: 'TestPass1!',
      rememberMe: false,
    });
    adminToken = res.data.accessToken;

    await purgeTestProjects();
  });

  test.afterAll(async () => {
    await purgeTestProjects();
  });

  async function purgeTestProjects(): Promise<void> {
    const list = await axios.get(`${API}/api/projects/admin/list`, {
      headers: authHeaders(adminToken),
      params: { includeDeleted: true, limit: 100 },
    });
    const testProjects = list.data.data.filter((p: { title: string }) => p.title.startsWith(PREFIX));
    for (const p of testProjects) {
      // A soft-deleted project has to be restored before `DELETE` will hard-delete it.
      if (p.deletedAt) {
        await axios.patch(`${API}/api/projects/${p.id}/restore`, {}, { headers: authHeaders(adminToken) });
      }
      await axios.delete(`${API}/api/projects/${p.id}`, { headers: authHeaders(adminToken) });
    }
  }

  test('navigate to Projects page → list visible', async ({ adminPage: page }) => {
    const projectsPage = new ProjectsPage(page);
    await projectsPage.goto();

    await expect(projectsPage.heading).toBeVisible();
    await expect(projectsPage.createButton).toBeVisible();
    await expect(projectsPage.table).toBeVisible();
    // The tabs this spec used to click no longer exist anywhere on the page.
    await expect(page.getByRole('tab')).toHaveCount(0);
  });

  test('Create Project navigates instead of opening a dialog', async ({ adminPage: page }) => {
    const projectsPage = new ProjectsPage(page);
    await projectsPage.goto();

    await projectsPage.createButton.click();

    await expect(page).toHaveURL(/\/projects\/new$/);
    await expect(page.locator('mat-dialog-container')).toHaveCount(0);
  });

  test('create project via API → appears in list', async ({ adminPage: page }) => {
    await axios.post(`${API}/api/projects`, validPayload(`${PREFIX}crud-test`), {
      headers: authHeaders(adminToken),
    });

    const projectsPage = new ProjectsPage(page);
    await projectsPage.goto();

    await expect(projectsPage.getRow(`${PREFIX}crud-test`)).toBeVisible({ timeout: 5000 });
  });

  test('edit project title via the routed form → change reflected in the list', async ({ adminPage: page }) => {
    const projectsPage = new ProjectsPage(page);
    await projectsPage.goto();

    const form = await projectsPage.openEditForm(`${PREFIX}crud-test`);
    await form.activate('section-basic');
    await form.titleInput.fill(`${PREFIX}crud-test-edited`);
    expect(await form.save('PUT')).toBe(200);

    await expectToast(page, 'Project updated successfully');

    await projectsPage.goto();
    await expect(projectsPage.getRow(`${PREFIX}crud-test-edited`)).toBeVisible({ timeout: 5000 });
  });

  test('delete project → gone from the list, visible under Show deleted', async ({ adminPage: page }) => {
    const projectsPage = new ProjectsPage(page);
    await projectsPage.goto();

    await projectsPage.clickDelete(`${PREFIX}crud-test-edited`);
    await clickConfirm(page);
    await expectToast(page, 'Project deleted');

    await expect(projectsPage.getRow(`${PREFIX}crud-test-edited`)).toHaveCount(0);

    await projectsPage.showDeleted(true);
    const row = projectsPage.getRow(`${PREFIX}crud-test-edited`);
    await expect(row).toBeVisible({ timeout: 5000 });
    await expect(row.getByText('Deleted')).toBeVisible();
  });

  test('restore from Show deleted → back in the default list', async ({ adminPage: page }) => {
    const projectsPage = new ProjectsPage(page);
    await projectsPage.goto();

    await projectsPage.showDeleted(true);
    await expect(projectsPage.getRow(`${PREFIX}crud-test-edited`)).toBeVisible({ timeout: 5000 });

    await projectsPage.clickRestore(`${PREFIX}crud-test-edited`);
    await expectToast(page, 'Project restored');

    await projectsPage.goto();
    await expect(projectsPage.getRow(`${PREFIX}crud-test-edited`)).toBeVisible({ timeout: 5000 });
  });
});
