#!/usr/bin/env node

/**
 * Network Audit Script for E2E flows
 *
 * Launches a headless browser, navigates to a URL, optionally performs actions,
 * then reports on network requests, console errors, cookies, and localStorage.
 *
 * Usage:
 *   node network-audit.mjs <url> [options]
 *
 * Options:
 *   --actions '<json>'   JSON array of actions: [{fill, value}, {click}, {wait}]
 *   --duration <ms>      Observation window after actions (default: 3000)
 *   --full               Include cookie/localStorage/console audit
 *   --api-filter <str>   Filter API requests containing string (default: "/api/")
 *
 * Examples:
 *   node network-audit.mjs http://localhost:3000/products
 *   node network-audit.mjs http://localhost:4200/dashboard --full
 *   node network-audit.mjs http://localhost:4200/search \
 *     --actions '[{"fill":"input[name=q]","value":"test"},{"click":"button[type=submit]"}]'
 */

import { chromium } from '@playwright/test';

const args = process.argv.slice(2);
const url = args.find((a) => !a.startsWith('--'));

if (!url) {
  console.log(
    'Usage: node network-audit.mjs <url> [--actions <json>] [--duration <ms>] [--full] [--api-filter <str>]'
  );
  process.exit(1);
}

function getFlag(name, defaultVal) {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1) return defaultVal;
  if (typeof defaultVal === 'boolean') return true;
  return args[idx + 1] || defaultVal;
}

const actionsJson = getFlag('actions', null);
const duration = parseInt(getFlag('duration', '3000'), 10);
const full = getFlag('full', false);
const apiFilter = getFlag('api-filter', '/api/');

const requests = [];
const consoleMessages = [];

const browser = await chromium.launch({ headless: true });
const baseURL = new URL(url).origin;
const context = await browser.newContext({ baseURL });
const page = await context.newPage();

page.on('request', (req) => {
  if (req.url().includes(apiFilter)) {
    requests.push({
      method: req.method(),
      url: req.url().replace(/https?:\/\/[^/]+/, ''),
      time: Date.now(),
    });
  }
});

page.on('console', (msg) => {
  consoleMessages.push({ type: msg.type(), text: msg.text() });
});

// Navigate
await page.goto(url);
await page.waitForLoadState('networkidle').catch(() => {
  /* empty */
});

// Execute actions
if (actionsJson) {
  const actions = JSON.parse(actionsJson);
  for (const action of actions) {
    if (action.fill) {
      await page.locator(action.fill).fill(action.value || '');
    } else if (action.click) {
      await page.locator(action.click).click();
    } else if (action.wait) {
      await page.waitForTimeout(parseInt(action.wait, 10));
    }
  }
}

// Observe
const startCount = requests.length;
await page.waitForTimeout(duration);
const observedRequests = requests.length - startCount;

// Report
console.log('\n=== NETWORK AUDIT REPORT ===\n');
console.log(`URL: ${url}`);
console.log(`Total API requests: ${requests.length}`);
console.log(`Requests during ${duration}ms observation: ${observedRequests}`);

// Detect loops
const urlCounts = {};
for (const r of requests) {
  const key = `${r.method} ${r.url}`;
  urlCounts[key] = (urlCounts[key] || 0) + 1;
}

const duplicates = Object.entries(urlCounts).filter(([, count]) => count > 2);
if (duplicates.length > 0) {
  console.log('\n--- POTENTIAL LOOPS ---');
  for (const [endpoint, count] of duplicates.sort((a, b) => b[1] - a[1])) {
    console.log(`  [${count}x] ${endpoint}`);
  }
}

// Verdict
const status = requests.length <= 10 ? 'PASS' : requests.length <= 20 ? 'WARN' : 'FAIL';
console.log(`\nVerdict: ${status} (${requests.length} total requests)`);
if (status === 'FAIL') {
  console.log('  >> REQUEST LOOP DETECTED - investigate interceptor chain');
}

// Full audit
if (full) {
  console.log('\n--- CONSOLE ERRORS ---');
  const errors = consoleMessages.filter((m) => m.type === 'error');
  if (errors.length === 0) {
    console.log('  None');
  } else {
    for (const e of errors.slice(0, 20)) {
      console.log(`  ${e.text.substring(0, 200)}`);
    }
    if (errors.length > 20) console.log(`  ... and ${errors.length - 20} more`);
  }

  console.log('\n--- COOKIES ---');
  const cookies = await context.cookies();
  for (const c of cookies) {
    const flags = [
      c.httpOnly ? 'httpOnly' : '',
      c.secure ? 'secure' : '',
      c.sameSite,
      c.expires > 0 ? `expires:${new Date(c.expires * 1000).toISOString()}` : 'session',
    ]
      .filter(Boolean)
      .join(', ');
    console.log(`  ${c.name} [${c.path}] (${flags})`);
  }

  console.log('\n--- LOCAL STORAGE ---');
  const storage = await page.evaluate(() => {
    const items = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      items[key] = localStorage.getItem(key).substring(0, 100);
    }
    return items;
  });
  const storageKeys = Object.keys(storage);
  if (storageKeys.length === 0) {
    console.log('  Empty');
  } else {
    for (const key of storageKeys) {
      const suspicious = /token|secret|password|key/i.test(key) || /eyJ/.test(storage[key]);
      console.log(`  ${suspicious ? '[!] ' : ''}${key}: ${storage[key]}`);
    }
  }
}

// Request log
console.log('\n--- ALL API REQUESTS ---');
for (const r of requests) {
  console.log(`  ${r.method} ${r.url}`);
}

await browser.close();
process.exit(status === 'FAIL' ? 1 : 0);
