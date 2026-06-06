#!/usr/bin/env node
/**
 * contrast-audit — token-driven WCAG 2.x + APCA-W3 contrast validator.
 *
 * Reads color tokens straight out of SCSS files (so it can never drift from the
 * source of truth), resolves `var()` / `hsl()` / alpha, then scores every
 * configured foreground/background pair against BOTH:
 *   - WCAG 2.x contrast ratio  (the legal floor / gate)
 *   - APCA-W3 Lc               (the perceptual quality bar — esp. dark mode)
 *
 * Zero dependencies. Run from the repo root:
 *   node .claude/skills/contrast-audit/scripts/contrast-audit.mjs
 *   node .claude/skills/contrast-audit/scripts/contrast-audit.mjs --config <path> --md <out.md> --json <out.json>
 *
 * Exit code is non-zero when any pair FAILS its WCAG floor (CI gate).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
const argv = process.argv.slice(2);
const getArg = (name, dflt) => {
  const i = argv.indexOf(name);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : dflt;
};
const ROOT = resolve(getArg('--root', process.cwd()));
const CONFIG_PATH = resolve(getArg('--config', join(__dirname, 'contrast.config.json')));
const MD_OUT = getArg('--md', null);
const JSON_OUT = getArg('--json', null);
const FAIL_ONLY = argv.includes('--fail-only');
const VERIFY = argv.includes('--verify');

// ===========================================================================
// 1. COLOR MATH
// ===========================================================================

/** Parse any supported CSS color string into {r,g,b,a} (0-255, a 0-1). */
function parseColor(raw) {
  const s = String(raw).trim();

  // hex
  if (s.startsWith('#')) {
    let h = s.slice(1);
    if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
    return { r, g, b, a };
  }

  // rgb() / rgba()  — both comma and space/slash syntax
  let m = s.match(/^rgba?\(([^)]+)\)$/i);
  if (m) {
    const body = m[1].replace(/\//g, ' ').replace(/,/g, ' ');
    const nums = body.trim().split(/\s+/).map(Number);
    const [r, g, b] = nums;
    const a = nums.length >= 4 ? nums[3] : 1;
    return { r, g, b, a };
  }

  // hsl() / hsla()
  m = s.match(/^hsla?\(([^)]+)\)$/i);
  if (m) {
    const body = m[1].replace(/\//g, ' ').replace(/,/g, ' ');
    const parts = body.trim().split(/\s+/);
    const h = parseFloat(parts[0]);
    const sat = parseFloat(parts[1]) / 100;
    const l = parseFloat(parts[2]) / 100;
    const a = parts[3] != null ? parseFloat(parts[3]) : 1;
    return { ...hslToRgb(h, sat, l), a };
  }

  throw new Error(`Cannot parse color: "${raw}"`);
}

function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const mm = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return { r: Math.round((r + mm) * 255), g: Math.round((g + mm) * 255), b: Math.round((b + mm) * 255) };
}

/** Composite a translucent foreground over an opaque backdrop. */
function composite(fg, bg) {
  if (fg.a >= 1) return fg;
  const a = fg.a;
  return {
    r: Math.round(fg.r * a + bg.r * (1 - a)),
    g: Math.round(fg.g * a + bg.g * (1 - a)),
    b: Math.round(fg.b * a + bg.b * (1 - a)),
    a: 1,
  };
}

const hex = ({ r, g, b }) => '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');

// --- WCAG 2.x ---------------------------------------------------------------
function relLuminance({ r, g, b }) {
  const lin = (c) => {
    const cs = c / 255;
    return cs <= 0.04045 ? cs / 12.92 : ((cs + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
function wcagRatio(fg, bg) {
  const L1 = relLuminance(fg);
  const L2 = relLuminance(bg);
  const [hi, lo] = L1 >= L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}

// --- APCA-W3 (constants verified against Myndex/apca-w3, frozen 2021-02-15) --
function sRGBtoY({ r, g, b }) {
  const e = (c) => (c / 255) ** 2.4;
  return 0.2126729 * e(r) + 0.7151522 * e(g) + 0.0721750 * e(b);
}
function apcaLc(txt, bg) {
  const blkThrs = 0.022, blkClmp = 1.414;
  const clamp = (Y) => (Y > blkThrs ? Y : Y + (blkThrs - Y) ** blkClmp);
  let Ytxt = clamp(sRGBtoY(txt));
  let Ybg = clamp(sRGBtoY(bg));
  if (Math.abs(Ybg - Ytxt) < 0.0005) return 0;
  let SAPC, out;
  if (Ybg > Ytxt) {
    // normal polarity: dark text on light bg
    SAPC = (Ybg ** 0.56 - Ytxt ** 0.57) * 1.14;
    out = SAPC < 0.1 ? 0 : SAPC - 0.027;
  } else {
    // reverse polarity: light text on dark bg
    SAPC = (Ybg ** 0.65 - Ytxt ** 0.62) * 1.14;
    out = SAPC > -0.1 ? 0 : SAPC + 0.027;
  }
  return out * 100;
}

// ===========================================================================
// 2. SELF-TEST — cross-checked against PUBLISHED reference values
//    WCAG: WebAIM Contrast Checker. APCA: apcacontrast.com / Myndex reference.
//    Anyone can re-confirm any row by pasting the pair into those tools.
//    The engine refuses to run if any vector drifts → math can't silently rot.
// ===========================================================================
const REFERENCE_VECTORS = [
  { fg: '#000000', bg: '#ffffff', wcag: 21.0, lc: 106.0, src: 'black on white' },
  { fg: '#ffffff', bg: '#000000', wcag: 21.0, lc: -107.9, src: 'white on black' },
  { fg: '#767676', bg: '#ffffff', wcag: 4.54, lc: null, src: 'WebAIM lowest-AA gray on white' },
  { fg: '#595959', bg: '#ffffff', wcag: 7.0, lc: null, src: 'WebAIM lowest-AAA gray on white' },
  { fg: '#ffffff', bg: '#ff0000', wcag: 4.0, lc: null, src: 'white on pure red' },
  { fg: '#0000ff', bg: '#ffffff', wcag: 8.59, lc: null, src: 'blue on white' },
  { fg: '#888888', bg: '#ffffff', wcag: null, lc: 63.1, src: 'APCA #888 on white' },
  { fg: '#ffffff', bg: '#888888', wcag: null, lc: -68.5, src: 'APCA white on #888' },
];

function runVectors(print) {
  let ok = true;
  for (const v of REFERENCE_VECTORS) {
    const fg = parseColor(v.fg);
    const bg = parseColor(v.bg);
    const w = wcagRatio(fg, bg);
    const lc = apcaLc(fg, bg);
    const wOk = v.wcag == null || Math.abs(w - v.wcag) < 0.06;
    const aOk = v.lc == null || Math.abs(lc - v.lc) < 1.0;
    if (!wOk || !aOk) ok = false;
    if (print) {
      const wc = v.wcag == null ? '—' : `${w.toFixed(2)}/${v.wcag} ${wOk ? '✓' : '✗'}`;
      const ac = v.lc == null ? '—' : `${lc.toFixed(1)}/${v.lc} ${aOk ? '✓' : '✗'}`;
      console.log(`${(wOk && aOk ? 'PASS' : 'FAIL').padEnd(5)} ${`${v.fg} on ${v.bg}`.padEnd(22)} WCAG ${wc.padEnd(16)} APCA ${ac.padEnd(16)} ${v.src}`);
    }
  }
  return ok;
}

if (!runVectors(false)) throw new Error('contrast-audit: math self-test FAILED vs published reference values — aborting.');

// ===========================================================================
// 3. SCSS TOKEN LOADER
// ===========================================================================
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Return the balanced-brace body that follows a wrapper header (e.g. an
 *  `@media (prefers-color-scheme: dark)` block in plain CSS). Lets a theme be
 *  scoped to a media/supports wrapper before its selector is extracted. */
function sliceWrapper(content, header) {
  const idx = content.search(new RegExp(escapeRe(header)));
  if (idx === -1) throw new Error(`Wrapper not found: "${header}"`);
  const open = content.indexOf('{', idx);
  let depth = 0;
  for (let i = open; i < content.length; i++) {
    if (content[i] === '{') depth++;
    else if (content[i] === '}' && --depth === 0) return content.slice(open + 1, i);
  }
  throw new Error(`Unbalanced braces after wrapper "${header}"`);
}

function extractBlock(content, selector) {
  const re = new RegExp(escapeRe(selector) + '\\s*\\{([^}]*)\\}');
  const m = content.match(re);
  if (!m) throw new Error(`Selector not found: "${selector}"`);
  const out = {};
  const decl = /(--[\w-]+)\s*:\s*([^;]+);/g;
  let d;
  while ((d = decl.exec(m[1])) !== null) out[d[1]] = d[2].trim();
  return out;
}

/** Merge layers (later overrides earlier) into one raw token map.
 *  Works for SCSS and plain CSS custom-property files alike. A layer may set
 *  `within` to first scope to a wrapper block (e.g. a prefers-color-scheme media query). */
function loadThemeRaw(theme) {
  let raw = {};
  for (const layer of theme.layers) {
    let content = readFileSync(resolve(ROOT, layer.file), 'utf8');
    if (layer.within) content = sliceWrapper(content, layer.within);
    Object.assign(raw, extractBlock(content, layer.selector));
  }
  return raw;
}

/** Resolve var() chains within a raw map. */
function resolveVars(value, raw, seen = new Set()) {
  let v = value;
  let guard = 0;
  while (/var\(/.test(v) && guard++ < 20) {
    v = v.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]+))?\)/g, (_, name, fallback) => {
      if (raw[name] != null && !seen.has(name)) {
        seen.add(name);
        return resolveVars(raw[name], raw, seen);
      }
      return fallback != null ? fallback.trim() : 'transparent';
    });
  }
  return v;
}

/** Produce {token: {r,g,b,a}} for a theme, compositing translucent tokens. */
function resolveTheme(theme, config) {
  const raw = loadThemeRaw(theme);
  const colors = {};
  for (const [name, val] of Object.entries(raw)) {
    const resolved = resolveVars(val, raw);
    try {
      colors[name] = parseColor(resolved);
    } catch {
      /* non-color token (e.g. --accent-hue: 210) — skip */
    }
  }
  // composite translucent tokens over their declared backdrop
  for (const [name, spec] of Object.entries(config.translucent || {})) {
    if (colors[name] && colors[name].a < 1) {
      const over = colors[spec.over];
      if (over) colors[name] = composite(colors[name], over);
    }
  }
  return colors;
}

// ===========================================================================
// 4. EVALUATION
// ===========================================================================
function colorOf(ref, colors) {
  if (ref.startsWith('#') || /^(rgb|hsl)/i.test(ref)) return parseColor(ref);
  const c = colors[ref];
  if (!c) throw new Error(`Token not found in theme: ${ref}`);
  return c;
}

function evaluate(config) {
  const results = [];
  for (const theme of config.themes) {
    const colors = resolveTheme(theme, config);
    const pairs = config.pairs[theme.system] || [];
    for (const p of pairs) {
      const role = config.roles[p.role];
      let fg, bg;
      try {
        fg = colorOf(p.fg, colors);
        bg = colorOf(p.bg, colors);
      } catch (e) {
        results.push({ theme: theme.id, ...p, error: e.message });
        continue;
      }
      // composite a translucent fg over its bg (e.g. text over glass)
      const fgC = fg.a < 1 ? composite(fg, bg) : fg;
      const wcag = wcagRatio(fgC, bg);
      const lc = apcaLc(fgC, bg);
      const wcagPass = wcag >= role.wcag;
      const apcaPass = Math.abs(lc) >= role.apca;
      let status = 'PASS';
      if (!wcagPass) status = 'FAIL';
      else if (!apcaPass) status = 'WARN';
      results.push({
        theme: theme.id, role: p.role, roleLabel: role.label,
        fg: p.fg, bg: p.bg, fgHex: hex(fgC), bgHex: hex(bg),
        wcag: +wcag.toFixed(2), wcagMin: role.wcag, wcagPass,
        lc: +lc.toFixed(1), lcMin: role.apca, apcaPass,
        status, note: p.note || role.note || '',
      });
    }
  }
  return results;
}

// ===========================================================================
// 4b. HARMONY — beyond compliance: is the contrast *well distributed*?
//     Computable proxies for "legible & easy on the eye": hierarchy steps are
//     distinct & monotonic, a role feels consistent across themes, text isn't
//     pure-white-on-dark (halation), surfaces read as distinct layers.
//     Taste (is it beautiful / on-brand) is NOT here — that needs the eye
//     (rendered-screenshot review) + reference-scale conformance (Radix/Carbon).
// ===========================================================================
function evaluateHarmony(config) {
  const H = config.harmony || {};
  const minGap = H.minTierGapLc ?? 3;
  const maxSpread = H.maxThemeSpreadLc ?? 30;
  const minSurfRatio = H.minSurfaceRatio ?? 1.05;
  const rows = [];
  const themeColors = {};
  for (const t of config.themes) themeColors[t.id] = resolveTheme(t, config);
  const short = (id) => id.split('-').slice(1).join('-') || id;

  for (const scale of config.scales || []) {
    const themes = config.themes.filter((t) => t.system === scale.system);
    if (!themes.length) continue;

    if (scale.type === 'surface') {
      for (const t of themes) {
        const cols = scale.tokens.map((tok) => colorOf(tok, themeColors[t.id]));
        for (let i = 1; i < cols.length; i++) {
          const r = wcagRatio(cols[i - 1], cols[i]);
          if (r < minSurfRatio)
            rows.push({ check: 'surface-merge', scope: `${scale.id}·${short(t.id)}`, status: 'FAIL',
              msg: `${scale.tokens[i - 1]} & ${scale.tokens[i]} nearly identical (ratio ${r.toFixed(2)}) — layers won't read; nudge one's lightness` });
        }
      }
      continue;
    }

    // type: text — per-theme tier Lc on the scale's bg
    const perTheme = {};
    for (const t of themes) {
      const bg = colorOf(scale.on, themeColors[t.id]);
      perTheme[t.id] = scale.tokens.map((tok) => {
        const c = colorOf(tok, themeColors[t.id]);
        const pureWhite = c.r === 255 && c.g === 255 && c.b === 255;
        return { token: tok, lc: Math.abs(apcaLc(c, bg)), pureWhite, reverse: apcaLc(c, bg) < 0 };
      });
      // halation: pure #fff text on a dark bg
      for (const tier of perTheme[t.id])
        if (tier.pureWhite && tier.reverse)
          rows.push({ check: 'halation', scope: `${scale.id}·${short(t.id)}`, status: 'FAIL',
            msg: `${tier.token} is pure #ffffff on dark — use ~87% (e.g. #e2e8f0) to avoid halation/glare` });
      // hierarchy: monotonic + min gap
      const tiers = perTheme[t.id];
      for (let i = 1; i < tiers.length; i++) {
        const hi = tiers[i - 1].lc, lo = tiers[i].lc;
        if (lo >= hi)
          rows.push({ check: 'tier-inversion', scope: `${scale.id}·${short(t.id)}`, status: 'FAIL',
            msg: `${tiers[i].token} (Lc ${lo.toFixed(0)}) not weaker than ${tiers[i - 1].token} (Lc ${hi.toFixed(0)}) — hierarchy inverted` });
        else if (hi - lo < minGap)
          rows.push({ check: 'tier-collapse', scope: `${scale.id}·${short(t.id)}`, status: 'FAIL',
            msg: `${tiers[i - 1].token} & ${tiers[i].token} differ by only ${(hi - lo).toFixed(1)} Lc — perceptually identical (need ≥${minGap}); separate them or drop a tier` });
      }
    }
    // cross-theme parity per tier index
    if (themes.length > 1) {
      for (let i = 0; i < scale.tokens.length; i++) {
        const vals = themes.map((t) => ({ id: t.id, lc: perTheme[t.id][i].lc }));
        const spread = Math.max(...vals.map((v) => v.lc)) - Math.min(...vals.map((v) => v.lc));
        if (spread > maxSpread)
          rows.push({ check: 'theme-parity', scope: `${scale.id}·${scale.tokens[i].replace('--', '')}`, status: 'FAIL',
            msg: `reads very differently per theme (${vals.map((v) => `${short(v.id)} Lc${v.lc.toFixed(0)}`).join(' vs ')}, spread ${spread.toFixed(0)}>${maxSpread}) — lift the weaker theme's tier` });
      }
    }
  }
  return rows;
}

// ===========================================================================
// 5. REPORTING
// ===========================================================================
const C = { reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', dim: '\x1b[2m', bold: '\x1b[1m' };
const statusColor = (s) => (s === 'FAIL' ? C.red : s === 'WARN' ? C.yellow : C.green);
const pad = (s, n) => String(s).padEnd(n);

function printConsole(results) {
  const byTheme = {};
  for (const r of results) (byTheme[r.theme] ||= []).push(r);
  for (const [theme, rows] of Object.entries(byTheme)) {
    console.log(`\n${C.bold}── ${theme} ${'─'.repeat(Math.max(0, 52 - theme.length))}${C.reset}`);
    console.log(C.dim + pad('status', 7) + pad('role', 14) + pad('pair', 42) + pad('WCAG', 14) + 'APCA' + C.reset);
    for (const r of rows) {
      if (FAIL_ONLY && r.status === 'PASS') continue;
      if (r.error) { console.log(`${C.red}ERROR  ${r.fg} on ${r.bg}: ${r.error}${C.reset}`); continue; }
      const wc = `${r.wcag}:1 ${r.wcagPass ? '✓' : '✗'}/${r.wcagMin}`;
      const ac = `${r.lc} ${r.apcaPass ? '✓' : '✗'}/${r.lcMin}`;
      const pairLabel = `${r.fg.replace('--', '')} → ${r.bg.replace('--', '')}`;
      console.log(
        statusColor(r.status) + pad(r.status, 7) + C.reset +
        pad(r.role, 14) + pad(pairLabel, 42) + pad(wc, 14) + ac
      );
    }
  }
  const fails = results.filter((r) => r.status === 'FAIL').length;
  const warns = results.filter((r) => r.status === 'WARN').length;
  const errs = results.filter((r) => r.error).length;
  console.log(`\n${C.bold}Summary:${C.reset} ${results.length} pairs · ` +
    `${C.red}${fails} FAIL${C.reset} (WCAG floor) · ${C.yellow}${warns} WARN${C.reset} (APCA) · ` +
    `${C.green}${results.length - fails - warns - errs} PASS${C.reset}` + (errs ? ` · ${errs} ERR` : ''));
  return fails;
}

function printHarmony(rows) {
  console.log(`\n${C.bold}── harmony (hierarchy · cross-theme · halation · layers) ${'─'.repeat(2)}${C.reset}`);
  if (!rows.length) { console.log(`${C.green}No legibility/harmony issues.${C.reset}`); return 0; }
  for (const r of rows)
    console.log(statusColor(r.status) + pad(r.status, 7) + C.reset + pad(r.check, 16) + pad(r.scope, 30) + ' ' + r.msg);
  const fails = rows.filter((r) => r.status === 'FAIL').length;
  console.log(`${C.bold}Harmony:${C.reset} ${C.red}${fails} FAIL${C.reset} of ${rows.length} flagged`);
  return fails;
}

function harmonyMd(rows) {
  if (!rows.length) return '\n## Harmony\n\n_No legibility/harmony issues._\n';
  let md = '\n## Harmony (hierarchy · cross-theme · halation · layers)\n\n| Status | Check | Scope | Issue |\n|---|---|---|---|\n';
  for (const r of rows) md += `| ${r.status} | ${r.check} | ${r.scope} | ${r.msg} |\n`;
  return md;
}

function toMarkdown(results) {
  const byTheme = {};
  for (const r of results) (byTheme[r.theme] ||= []).push(r);
  let md = `# Contrast Audit\n\nGate = WCAG 2.x ratio (legal floor). APCA Lc = perceptual quality bar.\nStatus: **FAIL** = below WCAG min · **WARN** = passes WCAG but below APCA target · **PASS** = both.\n`;
  for (const [theme, rows] of Object.entries(byTheme)) {
    md += `\n## ${theme}\n\n| Status | Role | Foreground | Background | Swatch | WCAG (min) | APCA Lc (min) | Note |\n|---|---|---|---|---|---|---|---|\n`;
    for (const r of rows) {
      if (r.error) { md += `| ERROR | ${r.role} | \`${r.fg}\` | \`${r.bg}\` | | | | ${r.error} |\n`; continue; }
      md += `| ${r.status} | ${r.role} | \`${r.fg}\` | \`${r.bg}\` | ${r.fgHex} on ${r.bgHex} | ${r.wcag}:1 (${r.wcagMin}) ${r.wcagPass ? '✅' : '❌'} | ${r.lc} (${r.lcMin}) ${r.apcaPass ? '✅' : '⚠️'} | ${r.note} |\n`;
    }
  }
  const fails = results.filter((r) => r.status === 'FAIL');
  md += `\n## FAIL list (WCAG floor)\n\n`;
  md += fails.length ? fails.map((r) => `- **${r.theme}** · ${r.role} · \`${r.fg}\` on \`${r.bg}\` (${r.fgHex}/${r.bgHex}) → ${r.wcag}:1 < ${r.wcagMin}, APCA ${r.lc} < ${r.lcMin}`).join('\n') : '_None_';
  md += '\n';
  return md;
}

// ===========================================================================
// MAIN
// ===========================================================================
if (VERIFY) {
  console.log('Cross-check vs published reference values (WebAIM / APCA):\n');
  process.exit(runVectors(true) ? 0 : 1);
}

const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
const results = evaluate(config);
const harmonyRows = evaluateHarmony(config);
const failCount = printConsole(results);
const harmonyFails = printHarmony(harmonyRows);
if (MD_OUT) { writeFileSync(resolve(ROOT, MD_OUT), toMarkdown(results) + harmonyMd(harmonyRows)); console.log(`\nMarkdown → ${MD_OUT}`); }
if (JSON_OUT) { writeFileSync(resolve(ROOT, JSON_OUT), JSON.stringify({ pairs: results, harmony: harmonyRows }, null, 2)); console.log(`JSON → ${JSON_OUT}`); }
process.exit(failCount + harmonyFails > 0 ? 1 : 0);
