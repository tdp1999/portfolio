import { test, expect } from './fixtures/auth.fixture';
import { ProjectsPage, ProjectDialog } from './pages/projects.page';
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

    // Cleanup leftover test projects
    const list = await axios.get(`${API}/api/projects/admin/list`, {
      headers: authHeaders(adminToken),
      params: { includeDeleted: true },
    });
    const testProjects = list.data.data.filter((p: { title: string }) => p.title.startsWith(PREFIX));
    for (const p of testProjects) {
      if (p.deletedAt) {
        await axios.patch(
          `${API}/api/projects/${p.id}/restore`,
          {},
          {
            headers: authHeaders(adminToken),
          }
        );
      }
      await axios.delete(`${API}/api/projects/${p.id}`, {
        headers: authHeaders(adminToken),
      });
    }
  });

  test('navigate to Projects page → list visible', async ({ adminPage: page }) => {
    const projectsPage = new ProjectsPage(page);
    await projectsPage.goto();

    await expect(projectsPage.heading).toBeVisible();
    await expect(projectsPage.createButton).toBeVisible();
    await expect(projectsPage.tabs.all).toBeVisible();
  });

  test('create project via API → appears in list', async ({ adminPage: page }) => {
    // Seed via API (translatable fields are hard to fill through UI)
    await axios.post(`${API}/api/projects`, validPayload(`${PREFIX}crud-test`), {
      headers: authHeaders(adminToken),
    });

    const projectsPage = new ProjectsPage(page);
    await projectsPage.goto();

    await expect(projectsPage.getRow(`${PREFIX}crud-test`)).toBeVisible({ timeout: 5000 });
  });

  test('edit project via dialog → changes reflected', async ({ adminPage: page }) => {
    const projectsPage = new ProjectsPage(page);
    await projectsPage.goto();

    await projectsPage.openActionsMenu(`${PREFIX}crud-test`);
    await projectsPage.clickEdit();

    const dialog = new ProjectDialog(page);
    await expect(dialog.dialog).toBeVisible();

    await dialog.fillTitle(`${PREFIX}crud-test-edited`);
    await dialog.updateButton.click();
    await expect(dialog.dialog).toBeHidden({ timeout: 10000 });

    await expect(projectsPage.getRow(`${PREFIX}crud-test-edited`)).toBeVisible({ timeout: 5000 });
  });

  test('delete project → moved to trash', async ({ adminPage: page }) => {
    const projectsPage = new ProjectsPage(page);
    await projectsPage.goto();

    await projectsPage.openActionsMenu(`${PREFIX}crud-test-edited`);
    await projectsPage.clickDelete();

    await clickConfirm(page);
    await expectToast(page, 'Project deleted');

    // Should disappear from All tab
    await expect(projectsPage.getRow(`${PREFIX}crud-test-edited`)).toBeHidden({ timeout: 5000 });

    // Should appear in Trash tab
    await projectsPage.tabs.trash.click();
    await expect(projectsPage.getRow(`${PREFIX}crud-test-edited`)).toBeVisible({ timeout: 5000 });
  });

  test('restore from trash → back in list', async ({ adminPage: page }) => {
    const projectsPage = new ProjectsPage(page);
    await projectsPage.goto();

    await projectsPage.tabs.trash.click();
    await expect(projectsPage.getRow(`${PREFIX}crud-test-edited`)).toBeVisible({ timeout: 5000 });

    await projectsPage.clickRestore(`${PREFIX}crud-test-edited`);
    await expectToast(page, 'Project restored');

    await projectsPage.tabs.all.click();
    await expect(projectsPage.getRow(`${PREFIX}crud-test-edited`)).toBeVisible({ timeout: 5000 });
  });
});
