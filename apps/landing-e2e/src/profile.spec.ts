import { test, expect } from '@playwright/test';
import axios from 'axios';

const API_BASE = 'http://localhost:3000';

// ── Helpers ───────────────────────────────────────────────

async function loginAsAdmin(): Promise<string> {
  const res = await axios.post(`${API_BASE}/api/auth/login`, {
    email: 'test-admin@e2e.local',
    password: 'TestPass1!',
    rememberMe: false,
  });
  return res.data.accessToken;
}

function seedPayload() {
  return {
    fullName: { en: 'E2E Landing User', vi: 'Nguoi Dung Landing' },
    title: { en: 'Full Stack Developer', vi: 'Lap Trinh Vien Full Stack' },
    bioShort: { en: 'Building great web apps.', vi: 'Xay dung ung dung web tuyet voi.' },
    bioLong: null,
    yearsOfExperience: 8,
    availability: 'OPEN_TO_WORK',
    openTo: ['FREELANCE', 'CONSULTING'],
    email: 'e2e-landing@test-safe.com',
    preferredContactPlatform: 'GITHUB',
    preferredContactValue: 'https://github.com/e2e-landing',
    locationCountry: 'Vietnam',
    locationCity: 'Da Nang',
    socialLinks: [
      { platform: 'GITHUB', url: 'https://github.com/e2e-landing', handle: 'e2e-landing' },
      { platform: 'LINKEDIN', url: 'https://linkedin.com/in/e2e-landing' },
    ],
    resumeUrls: {
      en: 'https://example.com/resume-en.pdf',
      vi: 'https://example.com/resume-vi.pdf',
    },
    certifications: [],
  };
}

// ── Tests ─────────────────────────────────────────────────

test.describe('Landing Page - Profile Display', () => {
  test.beforeAll(async () => {
    const token = await loginAsAdmin();
    await axios.put(`${API_BASE}/api/admin/profile`, seedPayload(), {
      headers: { Authorization: `Bearer ${token}` },
    });
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for profile data to render
    await page.locator('h1').filter({ hasText: "Hi, I'm" }).waitFor({ state: 'visible', timeout: 10000 });
  });

  test('hero shows fullName from profile (not hardcoded)', async ({ page }) => {
    const heroName = page.locator('h1 span.text-primary');
    await expect(heroName).toHaveText('E2E Landing User');
  });

  test('hero shows title from profile', async ({ page }) => {
    const subtitle = page.locator('p.text-xl.font-medium');
    await expect(subtitle).toHaveText('Full Stack Developer');
  });

  test('avatar renders (placeholder icon when no image uploaded)', async ({ page }) => {
    // Without an actual media upload, the fallback icon should show
    const avatarPlaceholder = page.locator('.w-64.h-64.rounded-full');
    await expect(avatarPlaceholder).toBeVisible();
  });

  test('social link icons appear and link correctly', async ({ page }) => {
    const githubLink = page.locator('a[href="https://github.com/e2e-landing"]');
    await expect(githubLink).toBeVisible();
    await expect(githubLink).toHaveAttribute('target', '_blank');
    await expect(githubLink).toHaveAttribute('rel', /noopener/);

    const linkedinLink = page.locator('a[href="https://linkedin.com/in/e2e-landing"]');
    await expect(linkedinLink).toBeVisible();
  });

  test('resume download button links to correct URL', async ({ page }) => {
    const resumeLink = page.locator('a[download]').filter({ hasText: 'Download Resume' });
    await expect(resumeLink).toBeVisible();
    await expect(resumeLink).toHaveAttribute('href', 'https://example.com/resume-en.pdf');
  });

  test('JSON-LD in page source contains correct profile data', async ({ page }) => {
    // JSON-LD is injected server-side in SSR — check raw page content
    const content = await page.content();
    const jsonLdMatch = content.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);

    expect(jsonLdMatch).not.toBeNull();
    const jsonLd = JSON.parse((jsonLdMatch as RegExpMatchArray)[1]);

    expect(jsonLd['@context']).toBe('https://schema.org');
    expect(jsonLd['@type']).toBe('Person');
    expect(jsonLd.name).toBe('E2E Landing User');
    expect(jsonLd.jobTitle).toBe('Full Stack Developer');
    expect(jsonLd.sameAs).toEqual(
      expect.arrayContaining(['https://github.com/e2e-landing', 'https://linkedin.com/in/e2e-landing'])
    );
  });

  test('open to work badges are visible', async ({ page }) => {
    const badges = page.locator('landing-badge');
    await expect(badges.first()).toBeVisible();
  });

  test('experience and location displayed', async ({ page }) => {
    const experienceText = page.locator('p.text-sm').filter({ hasText: /years of experience/ });
    await expect(experienceText).toContainText('8+ years of experience');
    await expect(experienceText).toContainText('Da Nang, Vietnam');
  });
});
