/**
 * Generate `sitemap.xml` for the landing site.
 *
 * Runs after `nx build landing` and writes to `dist/apps/landing/browser/sitemap.xml`,
 * where `express.static` (server.ts) will serve it at `/sitemap.xml`.
 *
 * Strategy:
 *   - Static + listing routes are hard-coded (lastmod = build date).
 *   - Per-project pages enumerate `apps/landing/content/projects/*.md` and use the
 *     file's mtime for lastmod. Project content flows through the API at runtime;
 *     these markdown files are the canonical source-of-truth seed.
 *   - `/ddl/**`, `/404`, and internal routes are excluded.
 *
 * Site URL comes from `SITE_URL` env (default `https://thunderphong.com`).
 */

import { readdirSync, statSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../../..');

const SITE_URL = (process.env['SITE_URL'] || 'https://thunderphong.com').replace(/\/$/, '');
const OUTPUT_PATH = resolve(REPO_ROOT, 'dist/apps/landing/browser/sitemap.xml');
const PROJECTS_DIR = resolve(REPO_ROOT, 'apps/landing/content/projects');

type HreflangAlternate = {
  hreflang: string;
  href: string;
};

type SitemapEntry = {
  loc: string;
  lastmod: string;
  changefreq?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority?: number;
  alternates?: HreflangAlternate[];
};

const today = new Date().toISOString().split('T')[0];

// Legal pages are bilingual via `?lang=vi`; declare hreflang alternates so
// Google indexes the two languages as siblings rather than duplicate content.
const legalAlternates = (path: string): HreflangAlternate[] => [
  { hreflang: 'en', href: `${SITE_URL}${path}` },
  { hreflang: 'vi', href: `${SITE_URL}${path}?lang=vi` },
  { hreflang: 'x-default', href: `${SITE_URL}${path}` },
];

const staticRoutes: SitemapEntry[] = [
  { loc: '/', lastmod: today, changefreq: 'weekly', priority: 1.0 },
  { loc: '/projects', lastmod: today, changefreq: 'weekly', priority: 0.9 },
  { loc: '/about', lastmod: today, changefreq: 'monthly', priority: 0.8 },
  { loc: '/blog', lastmod: today, changefreq: 'weekly', priority: 0.7 },
  { loc: '/uses', lastmod: today, changefreq: 'monthly', priority: 0.5 },
  { loc: '/colophon', lastmod: today, changefreq: 'yearly', priority: 0.4 },
  { loc: '/privacy', lastmod: today, changefreq: 'yearly', priority: 0.3, alternates: legalAlternates('/privacy') },
  { loc: '/terms', lastmod: today, changefreq: 'yearly', priority: 0.3, alternates: legalAlternates('/terms') },
];

function getProjectEntries(): SitemapEntry[] {
  if (!existsSync(PROJECTS_DIR)) {
    console.warn(`[sitemap] projects dir not found: ${PROJECTS_DIR}`);
    return [];
  }
  return readdirSync(PROJECTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const slug = f.replace(/\.md$/, '');
      const mtime = statSync(join(PROJECTS_DIR, f)).mtime;
      return {
        loc: `/projects/${slug}`,
        lastmod: mtime.toISOString().split('T')[0],
        changefreq: 'monthly' as const,
        priority: 0.8,
      };
    });
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderXml(entries: SitemapEntry[]): string {
  const urls = entries
    .map((e) => {
      const parts = [`    <loc>${escapeXml(SITE_URL + e.loc)}</loc>`, `    <lastmod>${e.lastmod}</lastmod>`];
      if (e.changefreq) parts.push(`    <changefreq>${e.changefreq}</changefreq>`);
      if (e.priority !== undefined) parts.push(`    <priority>${e.priority.toFixed(1)}</priority>`);
      if (e.alternates) {
        for (const alt of e.alternates) {
          parts.push(`    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${escapeXml(alt.href)}" />`);
        }
      }
      return `  <url>\n${parts.join('\n')}\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;
}

function main() {
  const entries = [...staticRoutes, ...getProjectEntries()];
  const xml = renderXml(entries);

  const outDir = dirname(OUTPUT_PATH);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  writeFileSync(OUTPUT_PATH, xml, 'utf8');
  console.log(`[sitemap] wrote ${entries.length} urls → ${OUTPUT_PATH}`);
}

main();
