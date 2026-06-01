#!/usr/bin/env node
// =============================================================================
// Responsive screenshot capture — input for validation Layer 2 (Claude-driven
// review). See .context/design/responsive-contract.md §11. NOT a pixel-diff
// baseline tool: it just captures one PNG per breakpoint for a given URL so the
// `responsive-system` skill can inspect layout / type rhythm / hierarchy.
//
// Usage:
//   node scripts/responsive-screenshots.mjs <url> [--out <dir>] [--name <prefix>] [--full-page]
//
// Examples:
//   node scripts/responsive-screenshots.mjs http://localhost:4200/
//   node scripts/responsive-screenshots.mjs http://localhost:4200/about --name about --full-page
//
// Prerequisites:
//   • The landing dev server running (pnpm dev:landing).
//   • Playwright's chromium installed once: `npx playwright install chromium`.
// =============================================================================

import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

// One width per breakpoint — mirrors apps/landing-e2e/src/fixtures/viewports.ts.
const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'wide', width: 1920, height: 1080 },
];

function parseArgs(argv) {
  const args = { url: undefined, out: undefined, name: 'page', fullPage: false };
  const rest = argv.slice(2);
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === '--out') args.out = rest[++i];
    else if (a === '--name') args.name = rest[++i];
    else if (a === '--full-page') args.fullPage = true;
    else if (!a.startsWith('--') && !args.url) args.url = a;
  }
  return args;
}

function timestamp() {
  // YYYYMMDD-HHmmss in local time, filesystem-safe.
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

async function main() {
  const { url, out, name, fullPage } = parseArgs(process.argv);

  if (!url) {
    console.error('Usage: node scripts/responsive-screenshots.mjs <url> [--out <dir>] [--name <prefix>] [--full-page]');
    process.exit(1);
  }

  const outDir = out ?? join('.responsive-shots', timestamp());
  await mkdir(outDir, { recursive: true });

  // Use the full bundled chromium (channel: 'chromium') rather than the default
  // headless-shell binary, so a plain `npx playwright install chromium` suffices.
  const browser = await chromium.launch({ channel: 'chromium' });
  try {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const file = join(outDir, `${name}-${vp.name}-${vp.width}.png`);
      await page.screenshot({ path: file, fullPage });
      console.log(`  ✓ ${vp.name.padEnd(6)} ${vp.width}px → ${file}`);
      await context.close();
    }
    console.log(`\nCaptured ${VIEWPORTS.length} screenshots to ${outDir}`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
