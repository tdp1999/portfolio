import { expect, test, type Page } from '@playwright/test';
import axios from 'axios';
import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

import { ConsoleItemFormPage, ConsoleLoginPage } from './pages/console-item-form.page';
import { LandingSignInPage } from './pages/landing-sign-in.page';
import { MedicineLookupPage } from './pages/medicine-lookup.page';

config({ path: resolve(process.cwd(), '.env') });

// Expected values come from R8.6, 'DT-3 Phân quyền' (page column), R16.3, R16.7 and R16.10 of the
// medicine cabinet epic. The local database may hold the Owner's real items, so the seeded data carries
// a per-run token: the keyword "simethicone" of the examples becomes `simethicone<run>` and "Mẹ" becomes
// `Mẹ <run>`, which only the seeded rows match.

const API_BASE = 'http://localhost:3000';
const ADMIN = { email: 'test-admin@e2e.local', password: 'TestPass1!' };
const PREFIX = 'e2e-landing-mc-';
const RUN = Date.now().toString(36);
const KEYWORD = `simethicone${RUN}`;
const PERSON = `${PREFIX}Mẹ ${RUN}`;
const TARGET = `${PREFIX}Thuốc 8`;
// R16.10 needs a keyword that only Air-X matches, so it does not reuse KEYWORD.
const AIR_X_INGREDIENT = `Airx${RUN}`;

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env['DATABASE_URL'] as string }) });

let token: string;
let personId: string;
const api = (method: 'POST' | 'GET', url: string, data?: unknown) =>
  axios.request({ baseURL: API_BASE, method, url, data, headers: { Authorization: `Bearer ${token}` } });

test.describe.configure({ mode: 'serial' });
// S6 renders in VI, as the expected copy of the examples is VI. Landing picks its locale from
// `navigator.languages` when nothing is stored, and that survives R16.7 clearing the cookies.
test.use({ locale: 'vi-VN' });

test.beforeAll(async () => {
  token = (await axios.post(`${API_BASE}/api/auth/login`, { ...ADMIN, rememberMe: false })).data.accessToken;
  const person = await api('POST', '/api/medicine-cabinet/profiles', { name: PERSON });
  personId = person.data.id;
  // Eight items of the person match the keyword through their purpose, so their primary name is the product name.
  for (let n = 1; n <= 8; n++) {
    await api('POST', '/api/medicine-cabinet/items', {
      kind: 'MEDICINE',
      profileId: person.data.id,
      name: `${PREFIX}Thuốc ${n}`,
      strength: '10mg',
      dose: '1 viên x 3 lần/ngày',
      purpose: `Đầy hơi ${KEYWORD}`,
    });
  }
});

test.afterAll(async () => {
  await prisma.$executeRawUnsafe(`DELETE FROM medical_items WHERE name LIKE $1`, `${PREFIX}%`);
  await prisma.$executeRawUnsafe(`DELETE FROM health_profiles WHERE name LIKE $1`, `${PREFIX}%`);
  await prisma.$disconnect();
});

/**
 * Opens S6 signed in. Landing and console share one session locally: both run on host `localhost`,
 * cookies ignore the port, so the refresh cookie serves both apps. S6 asks for a sign-in only when
 * neither app holds a session yet.
 */
async function signInLanding(page: Page): Promise<MedicineLookupPage> {
  const lookup = new MedicineLookupPage(page);
  const signIn = new LandingSignInPage(page);
  await lookup.goto();
  await expect(lookup.results.or(signIn.emailInput)).toBeVisible();
  if (new URL(page.url()).pathname === '/sign-in') {
    await signIn.signIn(ADMIN.email, ADMIN.password);
    await page.waitForURL((url) => url.pathname === '/medicine-cabinet');
  }
  await lookup.waitForResults();
  return lookup;
}

test.describe('Medicine cabinet lookup (S6)', () => {
  test('R8.6: for the signed-in Owner, the server response is noindex and its HTML holds no item data', async ({
    page,
  }) => {
    await signInLanding(page);
    // The page request shares the signed-in browser context.
    const res = await page.request.get('/medicine-cabinet');
    expect(res.headers()['x-robots-tag']).toBe('noindex, nofollow');
    const html = await res.text();
    expect(html).not.toContain(PREFIX);
    expect(html).not.toContain(KEYWORD);
  });

  test('DT-3 signed out: opening S6 goes to the landing sign-in page', async ({ page }) => {
    await new MedicineLookupPage(page).goto();
    await expect(page).toHaveURL(/\/sign-in\?next=/);
  });

  test('R16.3: edit from S6, save, and come back with the keyword, the chip, the scroll position and the new dose', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 480 });
    // Signing in to S6 signs in to the console too (shared session, see `signInLanding`).
    const lookup = await signInLanding(page);
    await lookup.search(KEYWORD);
    await lookup.selectChip(PERSON);
    await lookup.item(TARGET).scrollIntoViewIfNeeded();
    const scrollBefore = await lookup.scrollY();
    expect(scrollBefore).toBeGreaterThan(0);

    await lookup.edit(TARGET);
    const form = new ConsoleItemFormPage(page);
    await form.waitForForm();
    await form.setDose('2 viên x 3 lần/ngày');
    await form.save();

    await page.waitForURL((url) => url.pathname === '/medicine-cabinet');
    await lookup.waitForResults();
    const url = new URL(page.url());
    expect(url.searchParams.get('q')).toBe(KEYWORD);
    expect(url.searchParams.get('person')).toBe(personId);
    await expect(lookup.chip(PERSON)).toHaveAttribute('aria-pressed', 'true');
    await expect(lookup.item(TARGET).getByTestId('item-dose')).toHaveText('2 viên x 3 lần/ngày');
    await expect.poll(() => lookup.scrollY()).toBeGreaterThanOrEqual(scrollBefore - 4);
    await expect.poll(() => lookup.scrollY()).toBeLessThanOrEqual(scrollBefore + 4);
  });

  test('R16.7: console signed out: edit, sign in at S9, save, and come back to S6 as it was', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 480 });
    const lookup = await signInLanding(page);
    await lookup.search(KEYWORD);
    await lookup.selectChip(PERSON);
    await lookup.item(TARGET).scrollIntoViewIfNeeded();
    const scrollBefore = await lookup.scrollY();
    expect(scrollBefore).toBeGreaterThan(0);
    // S6 keeps its access token in memory. Clearing the cookies ends the shared session, so the
    // console opens signed out while S6 stays loaded.
    await page.context().clearCookies();
    await lookup.edit(TARGET);

    await page.waitForURL((url) => url.pathname.startsWith('/auth/login'));
    await new ConsoleLoginPage(page).login(ADMIN.email, ADMIN.password);
    const form = new ConsoleItemFormPage(page);
    await form.waitForForm();
    await form.setDose('3 viên x 3 lần/ngày');
    await form.save();

    await page.waitForURL((url) => url.pathname === '/medicine-cabinet');
    await lookup.waitForResults();
    const url = new URL(page.url());
    expect(url.searchParams.get('q')).toBe(KEYWORD);
    expect(url.searchParams.get('person')).toBe(personId);
    await expect(lookup.chip(PERSON)).toHaveAttribute('aria-pressed', 'true');
    await expect(lookup.item(TARGET).getByTestId('item-dose')).toHaveText('3 viên x 3 lần/ngày');
    await expect.poll(() => lookup.scrollY()).toBeGreaterThanOrEqual(scrollBefore - 4);
    await expect.poll(() => lookup.scrollY()).toBeLessThanOrEqual(scrollBefore + 4);
  });

  test('R16.10: removing the only matching ingredient sends the Owner back to "Không tìm thấy sản phẩm nào"', async ({
    page,
  }) => {
    const person = await api('POST', '/api/medicine-cabinet/profiles', { name: `${PREFIX}Owner ${RUN}` });
    await api('POST', '/api/medicine-cabinet/items', {
      kind: 'MEDICINE',
      profileId: person.data.id,
      name: `${PREFIX}Air-X`,
      strength: '80mg',
      activeIngredients: [AIR_X_INGREDIENT],
    });
    const lookup = await signInLanding(page);
    await lookup.search(AIR_X_INGREDIENT.toLowerCase());
    await expect(lookup.item(AIR_X_INGREDIENT)).toHaveCount(1);

    await lookup.edit(AIR_X_INGREDIENT);
    const form = new ConsoleItemFormPage(page);
    await form.waitForForm();
    await form.removeIngredient(AIR_X_INGREDIENT).click();
    await form.save();

    await page.waitForURL((url) => url.pathname === '/medicine-cabinet');
    expect(new URL(page.url()).searchParams.get('q')).toBe(AIR_X_INGREDIENT.toLowerCase());
    await expect(lookup.emptyResult).toBeVisible();
    await expect(lookup.item(`${PREFIX}Air-X`)).toHaveCount(0);
  });
});
