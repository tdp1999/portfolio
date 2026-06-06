#!/usr/bin/env node
/**
 * scaffold-config — the `init` step. Scans a project's style files for CSS
 * custom-property blocks, detects theme selectors, classifies COLOR tokens by
 * name, and emits a DRAFT contrast.config.json (themes + starter pairs) to review.
 *
 * It does NOT overwrite an existing config. Output is a best-effort draft with
 * `$todo` markers — a human (or Claude, in the skill's init mode) prunes/labels it.
 *
 *   node .claude/skills/contrast-audit/scripts/scaffold-config.mjs libs src
 *   node .claude/skills/contrast-audit/scripts/scaffold-config.mjs <dir|file> ... --out draft.config.json
 *
 * Zero dependencies. Works on .scss and .css alike. Strips comments and keeps
 * only tokens whose value is a color (literal or a var() chain to one).
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, relative, sep } from 'node:path';

const ROOT = process.cwd();
const rawArgs = process.argv.slice(2);
let OUT = null;
const paths = [];
for (let i = 0; i < rawArgs.length; i++) {
  if (rawArgs[i] === '--out') { OUT = rawArgs[++i]; continue; }
  paths.push(rawArgs[i]);
}
if (!paths.length) paths.push('.');

const SKIP = /(^|[\\/])(node_modules|\.git|dist|coverage|\.nx|\.angular|tmp|out-tsc)([\\/]|$)/;

// ---- find candidate style files --------------------------------------------
function walk(p, acc) {
  const abs = resolve(ROOT, p);
  let st;
  try { st = statSync(abs); } catch { return acc; }
  if (SKIP.test(abs)) return acc;
  if (st.isDirectory()) for (const e of readdirSync(abs)) walk(join(p, e), acc);
  else if (/\.(scss|css)$/.test(abs)) acc.push(abs);
  return acc;
}
const files = [...new Set(paths.flatMap((p) => walk(p, [])))];

// ---- token name → pair-role heuristics (first match wins) ------------------
const RULES = [
  [/(^|-)on-(primary|accent|brand|action|inverse)/i, 'onAccent'],
  [/(bg|background|surface|ink|canvas|paper|backdrop|elevated|container)/i, 'BG'],
  [/(placeholder|disabled|hint)/i, 'placeholder'],
  [/(border|outline|divider|stroke|hairline|rule)/i, 'border'],
  [/(success|error|danger|warning|warn|info|positive|negative|caution|notice)/i, 'nonText'],
  [/(primary|accent|brand|link|action|interactive|focus)/i, 'link'],
  [/(muted|secondary|tertiary|subtle|dim|caption|meta|faint|text|fg|foreground|label|heading|title|body|content|copy)/i, 'body'],
];
const classify = (name) => { for (const [re, role] of RULES) if (re.test(name)) return role; return null; };

const COLOR_RE = /#[0-9a-fA-F]{3,8}\b|\b(rgba?|hsla?|hwb|oklch|oklab|lab|lch|color)\(/;
const isTranslucent = (v) => /rgba\(|hsla\(|\/\s*0?\.\d|\/\s*0\b/.test(v);
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');

// ---- collect raw blocks (comments stripped) --------------------------------
const BLOCK = /([.:#\[][^{}]*?)\{([^{}]*?)\}/g;
const rawBlocks = [];
const globalVals = new Map();
for (const abs of files) {
  const content = stripComments(readFileSync(abs, 'utf8'));
  const rel = relative(ROOT, abs).split(sep).join('/');
  let m;
  while ((m = BLOCK.exec(content)) !== null) {
    const tokens = [...m[2].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((d) => [d[1], d[2].trim()]);
    if (!tokens.length) continue;
    for (const [n, v] of tokens) if (!globalVals.has(n)) globalVals.set(n, v);
    rawBlocks.push({ selector: m[1].trim().replace(/\s+/g, ' '), tokens, file: rel });
  }
}

// ---- which tokens are colors? literal, or var() chained to a color ---------
const colorNames = new Set();
for (const [n, v] of globalVals) if (COLOR_RE.test(v)) colorNames.add(n);
for (let changed = true; changed; ) {
  changed = false;
  for (const [n, v] of globalVals) {
    if (colorNames.has(n)) continue;
    const mm = v.match(/^var\(\s*(--[\w-]+)/);
    if (mm && colorNames.has(mm[1])) { colorNames.add(n); changed = true; }
  }
}

// ---- build themes (only blocks with ≥1 color token) + per-system buckets ---
const SYSTEMS = ['landing', 'console', 'shared', 'admin', 'app', 'ui', 'web'];
const guessSystem = (file) => SYSTEMS.find((s) => file.toLowerCase().split('/').includes(s)) || 'app';
const guessMode = (sel) => (/dark/i.test(sel) ? 'dark' : /light/i.test(sel) ? 'light' : '???');

const themes = [];
const bySystem = {};
const translucent = {};
for (const blk of rawBlocks) {
  const colorTokens = blk.tokens.filter(([n]) => colorNames.has(n));
  if (!colorTokens.length) continue; // not a theme block (spacing/typography/mixin)
  const system = guessSystem(blk.file);
  const mode = guessMode(blk.selector);
  themes.push({
    id: `${system}-${mode}-${themes.length}`, system, mode,
    layers: [{ file: blk.file, selector: blk.selector }],
    $todo: 'verify id/system/mode; if this theme only OVERRIDES another, add the base file+selector as an earlier layer',
  });
  const buckets = (bySystem[system] ||= { fg: new Map(), bg: new Set() });
  for (const [name, val] of colorTokens) {
    const role = classify(name);
    if (role === 'BG') buckets.bg.add(name);
    else if (role) buckets.fg.set(name, role);
    if (isTranslucent(val)) translucent[name] = { over: '__FIRST_BG__', $todo: 'set `over` to the backdrop this composites onto' };
  }
}

// ---- starter pairs: fg × bg per system -------------------------------------
const pairs = {};
for (const [system, b] of Object.entries(bySystem)) {
  const bgs = [...b.bg];
  for (const k of Object.keys(translucent)) if (translucent[k].over === '__FIRST_BG__') translucent[k].over = bgs[0] || '--bg';
  const list = [];
  for (const [fg, role] of b.fg) {
    if (role === 'onAccent') {
      const fill = [...b.fg].find(([n]) => /primary|accent|brand/i.test(n));
      if (fill) list.push({ fg, bg: fill[0], role, $todo: 'confirm filled-button label↔fill pair' });
      continue;
    }
    for (const bg of bgs) list.push({ fg, bg, role });
  }
  pairs[system] = list;
}

// ---- draft harmony scales (ordered ramps) ----------------------------------
const scales = [];
for (const [system, b] of Object.entries(bySystem)) {
  const bgs = [...b.bg];
  if (bgs.length >= 2)
    scales.push({ id: `${system}-surface`, system, type: 'surface', tokens: bgs, $todo: 'order base→most-elevated' });
  const texts = [...b.fg].filter(([, r]) => r === 'body').map(([n]) => n);
  texts.sort((a, x) => (+(a.match(/(\d+)$/)?.[1] ?? 0)) - (+(x.match(/(\d+)$/)?.[1] ?? 0)));
  if (texts.length >= 2)
    scales.push({ id: `${system}-text`, system, type: 'text', on: bgs[0] || '--bg', tokens: texts, $todo: 'order strongest→weakest; set `on` to the page bg' });
}

const config = {
  $comment: 'DRAFT from scaffold-config.mjs. Review every $todo, prune pairs that never occur in the UI, fix ids/systems/modes, merge inherited theme layers, and order/trim the scales. Then save as contrast.config.json.',
  harmony: { minTierGapLc: 3, maxThemeSpreadLc: 30, minSurfaceRatio: 1.05 },
  scales,
  roles: {
    body: { label: 'Body text', wcag: 4.5, apca: 75, note: '' },
    large: { label: 'Large / secondary text', wcag: 3.0, apca: 60, note: '' },
    caption: { label: 'Caption / small meta', wcag: 4.5, apca: 60, note: 'small text — body floor' },
    placeholder: { label: 'Placeholder / disabled', wcag: 4.5, apca: 30, note: 'exempt only if truly disabled' },
    link: { label: 'Link / inline accent text', wcag: 4.5, apca: 75, note: '' },
    onAccent: { label: 'Label on accent fill', wcag: 4.5, apca: 75, note: '' },
    nonText: { label: 'Icon / UI graphic', wcag: 3.0, apca: 45, note: 'WCAG 1.4.11' },
    focus: { label: 'Focus indicator', wcag: 3.0, apca: 45, note: 'WCAG 1.4.11 / 2.4.11' },
    border: { label: 'Delimiting border', wcag: 3.0, apca: 30, note: 'only if border alone marks a control' },
  },
  translucent,
  themes,
  pairs,
};

const json = JSON.stringify(config, null, 2);
if (OUT) writeFileSync(resolve(ROOT, OUT), json + '\n');
else console.log(json);

const err = (s) => process.stderr.write(s + '\n');
err(`\nscaffold-config: scanned ${files.length} style file(s).`);
err(`  themes drafted : ${themes.length}  (selector blocks containing color custom-properties)`);
for (const [system, b] of Object.entries(bySystem))
  err(`  system "${system}": ${b.fg.size} fg + ${b.bg.size} bg color token(s) → ${pairs[system].length} starter pair(s)`);
if (Object.keys(translucent).length) err(`  translucent: ${Object.keys(translucent).join(', ')} (set each "over" backdrop)`);
err('\nNEXT: review "$todo"s, prune pairs, label theme id/system/mode, merge inherited layers,');
err('save as contrast.config.json, then run:  node <skill>/scripts/contrast-audit.mjs');
