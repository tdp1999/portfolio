import { LANDING_COPY } from '@portfolio/landing/shared/ui';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

/**
 * Guardrail for the landing i18n contract (task 388 / ADR-028).
 *
 * The point of consolidating copy into `LANDING_COPY` was that a wording fix
 * should never again mean hunting for which of four mechanisms a string used.
 * That only holds if new copy keeps going into the dictionary — so the two
 * mechanisms this replaced are pinned here with explicit allowlists.
 *
 * A failure means one of two things:
 * - a new plain string was written as a locale ternary or an EN/VI constant
 *   pair → move it into `LANDING_COPY` (see `.context/landing-i18n.md`);
 * - a genuinely new piece of *logic* branches on locale → add it to the
 *   allowlist below with a note saying why it is not copy.
 */

const WORKSPACE = resolve(__dirname, '../../../..');
const SCAN_ROOTS = ['apps/landing/src', 'libs/landing'];

/**
 * Locale branches that are **logic**, not copy. Each picks a resource or a data
 * shape rather than choosing between two pieces of wording.
 */
const LOGIC_BRANCH_ALLOWLIST: ReadonlyArray<readonly [string, string]> = [
  ['apps/landing/src/app/app.ts', 'picks the resume URL for the active locale'],
  [
    'apps/landing/src/app/pages/document-engine/document-engine.util.ts',
    'relativeTime() — count-sensitive relative dates ("2 days ago" / "2 ngày trước"). ' +
      'This one IS copy, but it needs both interpolation and singular/plural selection, ' +
      'which a flat key map cannot express. Kept here deliberately, not by oversight.',
  ],
  ['apps/landing/src/app/pages/contact/contact.ts', 'gates the Zalo channel to the VN audience'],
  [
    'libs/landing/shared/ui/src/services/copy/date-format.util.ts',
    'picks the month-name array (index-addressed list) — excluded as a mechanism file, listed for the record',
  ],
];

/**
 * Files holding an `{ en, vi }` literal that is **not copy**.
 *
 * The shape is the same, the meaning is not: these are values keyed by locale
 * that nobody reads as language. Each entry needs the reason spelled out, because
 * "it looked like a code" is exactly the excuse that would let real copy back in.
 */
const NON_COPY_PAIR_ALLOWLIST: ReadonlyArray<readonly [string, string]> = [
  [
    'libs/landing/shared/ui/src/services/meta/landing-meta.data.ts',
    'OG_LOCALE — the Open Graph locale codes (`en_US` / `vi_VN`). A protocol value ' +
      'read by crawlers, not a string rendered to anyone.',
  ],
];

/** Files allowed to mention the pattern because they document or implement it. */
const MECHANISM_FILES = [
  'libs/landing/shared/ui/src/components/t/t.ts',
  'libs/landing/shared/ui/src/pipes/landing-copy.pipe.ts',
  'libs/landing/shared/ui/src/services/copy/',
  'apps/landing/src/app/pages/ddl/',
  'apps/landing/src/app/landing-copy-contract.spec.ts',
];

/**
 * Every `resolveCopy(...)` call in a file, with its key and top-level argument
 * count.
 *
 * Written as a paren walker rather than a regex because the third argument is an
 * object literal: `resolveCopy(k, l, { n, total })` contains commas and braces
 * that a regex would either miss or miscount. Quotes are tracked so a comma
 * inside a string is not read as an argument separator.
 */
function resolveCopyCalls(src: string): { key: string; args: number; line: number }[] {
  const NEEDLE = 'resolveCopy(';
  const out: { key: string; args: number; line: number }[] = [];

  for (let at = src.indexOf(NEEDLE); at >= 0; at = src.indexOf(NEEDLE, at + 1)) {
    const open = at + NEEDLE.length;
    const key = /^\s*'([^']+)'/.exec(src.slice(open))?.[1];
    if (!key) continue; // a dynamic key — nothing static to check

    let depth = 1;
    let quote = '';
    let commas = 0;
    for (let i = open; i < src.length && depth > 0; i++) {
      const c = src[i];
      if (quote) {
        if (c === '\\') i++;
        else if (c === quote) quote = '';
        continue;
      }
      if (c === "'" || c === '"' || c === '`') quote = c;
      else if (c === '(' || c === '[' || c === '{') depth++;
      else if (c === ')' || c === ']' || c === '}') depth--;
      else if (c === ',' && depth === 1) commas++;
    }
    out.push({ key, args: commas + 1, line: src.slice(0, at).split('\n').length });
  }
  return out;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === 'node_modules') continue;
      walk(full, out);
    } else if (/\.(ts|html)$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

const FILES = SCAN_ROOTS.flatMap((root) => walk(join(WORKSPACE, root)))
  .map((f) => relative(WORKSPACE, f).split('\\').join('/'))
  .filter((f) => !MECHANISM_FILES.some((m) => f.startsWith(m)))
  .filter((f) => !f.endsWith('.spec.ts'));

describe('landing i18n contract', () => {
  it('has no locale ternary outside the allowlisted logic branches', () => {
    const allowed = new Set(LOGIC_BRANCH_ALLOWLIST.map(([file]) => file));
    const offenders = FILES.filter((f) => {
      const src = readFileSync(join(WORKSPACE, f), 'utf8');
      return /locale\(\) === '(vi|en)'/.test(src) && !allowed.has(f);
    });
    expect(offenders).toEqual([]);
  });

  it('has no parallel EN/VI constant pairs', () => {
    // The shape the dictionary replaced: `FOO_EN` / `FOO_VI`, `EN_FOO` / `VI_FOO`,
    // a `fooEn` / `fooVi` class-field pair, or `DEFAULT_X_BY_LOCALE`.
    //
    // The class-field pattern requires a type annotation on purpose — that is
    // what separates a declared pair of localized constants from ordinary locals
    // like `const contextEn = f.context?.en` (reading API content) or
    // `const urlEn = ...` (building hreflang URLs), neither of which is copy.
    const PAIR_PATTERNS = [
      /\b(?:const|readonly)\s+[A-Z][A-Z0-9_]*_(?:EN|VI)\b/,
      /\b(?:const|readonly)\s+(?:EN|VI)_[A-Z0-9_]+\b/,
      /\breadonly\s+\w+(?:En|Vi)\s*:/,
      /_BY_LOCALE\b/,
    ];
    const offenders = FILES.filter((f) => {
      const src = readFileSync(join(WORKSPACE, f), 'utf8');
      return PAIR_PATTERNS.some((re) => re.test(src));
    });
    // No exceptions left in feature code. The month-name arrays are the one
    // index-addressed list, and they now live in `services/copy/date-format.util.ts`
    // alongside the dictionary — inside MECHANISM_FILES, so not scanned here.
    expect(offenders).toEqual([]);
  });

  it('has no inline { en, vi } copy literals outside the dictionary', () => {
    // The third mechanism, and the one the first two tests never saw: a literal
    // `{ en: '…', vi: '…' }` object resolved through `getLocalized`. It is the
    // right shape for *authored* content arriving from the API (`TranslatableJson`),
    // and the wrong one for static copy — which is why /document-engine carried a
    // parallel copy source for months without tripping this spec.
    //
    // Matches only when both halves are string literals on the same line, so a
    // type annotation (`label: TranslatableJson`) or an API read (`{ en: row.en }`)
    // does not register.
    const INLINE_PAIR = /\{\s*en:\s*(['"`]).*?\1\s*,\s*vi:\s*(['"`])/;
    const allowed = new Set(NON_COPY_PAIR_ALLOWLIST.map(([file]) => file));
    const offenders = FILES.filter(
      (f) => !allowed.has(f) && INLINE_PAIR.test(readFileSync(join(WORKSPACE, f), 'utf8'))
    );
    expect(offenders).toEqual([]);
  });

  it('never reads a {slot} key without the values that fill it', () => {
    // `CopyValues<K>` types the values object against the entry, so a misspelled
    // or missing slot is a compile error. What the type cannot enforce is the
    // *absence* of the argument: `values` has to stay optional, because a
    // dynamic key (`config.titleKey`) widens to the whole union. That leaves
    // exactly one hole — `resolveCopy('blog.readTime', locale)` — and this is it.
    //
    // `{{customer_name}}` is not a slot: /document-engine quotes its own template
    // syntax in prose. Stripping the double-brace form first is the same split
    // `fillSlots` makes at runtime.
    const hasSlot = (s: string) => /\{\w+\}/.test(s.replace(/\{\{\w+\}\}/g, ''));
    const SLOT_KEYS = new Set(
      Object.entries(LANDING_COPY)
        .filter(([, v]) => hasSlot(v.en) || hasSlot(v.vi))
        .map(([k]) => k)
    );
    const offenders: string[] = [];

    for (const file of FILES) {
      const src = readFileSync(join(WORKSPACE, file), 'utf8');

      if (file.endsWith('.html')) {
        // A slot key is banned from templates outright. Filling one there means
        // an object literal inside a binding, and the values it needs already
        // live in the component — so the component resolves it into a computed
        // and the template reads that. No occurrence has ever needed the
        // exception, which is why the rule can be this blunt.
        for (const key of SLOT_KEYS) {
          if (src.includes(`'${key}'`)) offenders.push(`${file} → '${key}' belongs in a component computed`);
        }
        continue;
      }

      for (const { key, args, line } of resolveCopyCalls(src)) {
        if (SLOT_KEYS.has(key) && args < 3) offenders.push(`${file}:${line} → '${key}' resolved without values`);
      }
    }

    expect(offenders).toEqual([]);
  });

  it('keeps the dictionary inside the size the eager-load decision assumes', () => {
    // `LANDING_COPY` is one object, both locales, in a chunk `index.csr.html`
    // references — so every visitor downloads the language they are not reading.
    // At the current size that is cheaper than any alternative: splitting per
    // locale costs a second network round trip before first paint, and splitting
    // per route costs the synchronous `resolveCopy` that makes SSR trivial.
    //
    // That trade only holds while the payload is small. This ceiling is set at
    // roughly 1.5× today's size, so it fires while there is still room to think
    // rather than after the decision has already gone bad. If it fails, the
    // answer is not to raise the number: it is to split per *route* (a page's
    // keys ship with the page's chunk) and keep both locales together, because
    // route is the axis along which the reads actually cluster. See ADR-028.
    const entries = Object.entries(LANDING_COPY);
    const bytes = entries.reduce((n, [k, v]) => n + k.length + v.en.length + v.vi.length, 0);

    expect(entries.length).toBeLessThan(700);
    expect(bytes).toBeLessThan(64 * 1024);
  });

  it('has no em-dash or en-dash in rendered template prose', () => {
    // `landing-copy.spec.ts` bans both dashes in `LANDING_COPY` values. That covers
    // every plain string — and none of the HTML-rich copy in `<landing-t>`, which is
    // where the longest prose on the site lives. The legal pages carried eleven
    // em-dashes for months because no spec looked at templates.
    //
    // Two things are legitimately allowed to hold a dash:
    // - HTML comments, which never render;
    // - a decorative glyph inside `aria-hidden="true"` (the role separator on the
    //   Home hero, the empty-thumbnail placeholder on /projects). Those are
    //   typography, not copy, and no screen reader reads them.
    //
    // Anything else is prose, and prose follows the dash rule.
    const HTML_FILES = FILES.filter((f) => f.endsWith('.html'));
    const offenders: string[] = [];

    for (const file of HTML_FILES) {
      // Both comment syntaxes: `index.html` carries inline `<style>`/`<script>`, so
      // `/* … */` shows up in a .html file too. Blank each one out in place rather
      // than deleting it, so reported line numbers still match the file on disk.
      const withoutComments = readFileSync(join(WORKSPACE, file), 'utf8')
        .replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '))
        .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
      withoutComments.split('\n').forEach((line, i) => {
        if (!/[—–]/.test(line)) return;
        if (line.includes('aria-hidden="true"')) return;
        offenders.push(`${file}:${i + 1}`);
      });
    }

    expect(offenders).toEqual([]);
  });
});
