import { test, expect } from './fixtures/auth.fixture';
import { ProfilePage } from './pages/profile.page';
import { expectToast } from './helpers/toast';
import axios from 'axios';

const API = 'http://localhost:3000';

function seedPayload(overrides: Record<string, unknown> = {}) {
  return {
    fullName: { en: 'E2E Console User', vi: 'Nguoi Dung Console' },
    title: { en: 'QA Engineer', vi: 'Ky Su QA' },
    bioShort: { en: 'Short bio for console E2E.', vi: 'Tieu su ngan console E2E.' },
    yearsOfExperience: 5,
    availability: 'EMPLOYED',
    openTo: [],
    email: 'e2e-console@test-safe.com',
    preferredContactPlatform: 'LINKEDIN',
    preferredContactValue: 'https://linkedin.com/in/e2e-console',
    locationCountry: 'Vietnam',
    locationCity: 'Hanoi',
    socialLinks: [],
    resumeUrls: {},
    certifications: [],
    ...overrides,
  };
}

test.describe('Profile Settings', () => {
  test.describe.configure({ mode: 'serial' });

  let adminToken: string;

  test.beforeAll(async () => {
    const res = await axios.post(`${API}/api/auth/login`, {
      email: 'test-admin@e2e.local',
      password: 'TestPass1!',
      rememberMe: false,
    });
    adminToken = res.data.accessToken;
  });

  // ─── Form Load ────────────────────────────────────────────────

  test('navigate to /profile → settings form loads', async ({ adminPage: page }) => {
    const profilePage = new ProfilePage(page);
    await profilePage.goto();

    await expect(profilePage.heading).toBeVisible();
    await expect(profilePage.saveButton).toBeVisible();
    await expect(profilePage.fullNameEn).toBeVisible();
  });

  // ─── Fill & Save ──────────────────────────────────────────────

  test('fill identity section → save → success toast', async ({ adminPage: page }) => {
    const profilePage = new ProfilePage(page);
    await profilePage.goto();

    await profilePage.fillIdentity({
      fullNameEn: 'E2E Console User',
      fullNameVi: 'Nguoi Dung Console',
      titleEn: 'QA Engineer',
      titleVi: 'Ky Su QA',
      bioShortEn: 'Short bio for console E2E.',
      bioShortVi: 'Tieu su ngan console E2E.',
    });
    await profilePage.email.fill('e2e-console@test-safe.com');
    await profilePage.preferredContactValue.fill('https://linkedin.com/in/e2e-console');
    await profilePage.locationCountry.fill('Vietnam');
    await profilePage.locationCity.fill('Hanoi');

    await profilePage.save();
    await expectToast(page, 'Profile saved');
  });

  test('form prefills with existing profile data', async ({ adminPage: page }) => {
    const profilePage = new ProfilePage(page);
    await profilePage.goto();

    await expect(profilePage.fullNameEn).toHaveValue('E2E Console User');
    await expect(profilePage.fullNameVi).toHaveValue('Nguoi Dung Console');
    await expect(profilePage.titleEn).toHaveValue('QA Engineer');
    await expect(profilePage.email).toHaveValue('e2e-console@test-safe.com');
  });

  // ─── Social Links ─────────────────────────────────────────────

  test('add social link → save → verify in public API response', async ({ adminPage: page }) => {
    const profilePage = new ProfilePage(page);
    await profilePage.goto();

    await profilePage.addSocialLink('GitHub', 'https://github.com/e2e-console-test');
    await profilePage.save();
    await expectToast(page, 'Profile saved');

    // Verify via public API
    const publicRes = await axios.get(`${API}/api/profile`);
    const githubLink = publicRes.data.socialLinks.find((l: { platform: string }) => l.platform === 'GITHUB');
    expect(githubLink).toBeDefined();
    expect(githubLink.url).toBe('https://github.com/e2e-console-test');
  });

  // ─── Certifications ───────────────────────────────────────────

  test('add certification → save → verify in response', async ({ adminPage: page }) => {
    const profilePage = new ProfilePage(page);
    await profilePage.goto();

    await profilePage.addCertification('Playwright Expert', 'E2E Academy', 2025);
    await profilePage.save();
    await expectToast(page, 'Profile saved');

    // Verify via public API
    const publicRes = await axios.get(`${API}/api/profile`);
    const cert = publicRes.data.certifications.find((c: { name: string }) => c.name === 'Playwright Expert');
    expect(cert).toBeDefined();
    expect(cert.issuer).toBe('E2E Academy');
    expect(cert.year).toBe(2025);
  });

  // ─── Availability & Open To ───────────────────────────────────

  test('change availability + openTo → save → reflected in public response', async ({ adminPage: page }) => {
    const profilePage = new ProfilePage(page);
    await profilePage.goto();

    await profilePage.selectAvailability('Open to Work');
    await profilePage.toggleOpenTo('Freelance').click();
    await profilePage.toggleOpenTo('Consulting').click();

    await profilePage.save();
    await expectToast(page, 'Profile saved');

    // Verify via public API
    const publicRes = await axios.get(`${API}/api/profile`);
    expect(publicRes.data.availability).toBe('OPEN_TO_WORK');
    expect(publicRes.data.openTo).toEqual(expect.arrayContaining(['FREELANCE', 'CONSULTING']));
  });
});
