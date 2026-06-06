// FE naming migration — INVENTORY (read-only).
// Scans FE Angular classes (@Component/@Directive/@Pipe), extracts the facts
// (path, class, selector, templateUrl, styleUrls) and emits a cũ→mới mapping CSV
// with a heuristic proposal + a confidence flag for the human-review gate.
//
// Run: node tools/codemods/fe-naming-inventory.mjs
// Out: tools/codemods/fe-naming-map.csv
//
// This does NOT rename anything. See .context/patterns-file-structure.md for the target grammar
// and .context/tasks/360-fe-file-naming-standard-migration.md for the plan.

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, basename, dirname } from 'node:path';
import ts from 'typescript';

const ROOT = process.cwd();
const SCAN_DIRS = [
  'libs/landing',
  'libs/console',
  'libs/shared',
  'apps/landing/src',
  'apps/console/src',
];

// Controlled role vocabulary mirroring patterns-file-structure.md §5 (closed set).
// Multi-word roles listed too so trailing tokens match.
const ROLE_VOCAB = new Set([
  // screen
  'list', 'detail', 'form',
  // overlay
  'dialog', 'drawer', 'panel', 'sheet', 'menu', 'popover',
  // presentational
  'card', 'row', 'item', 'cell', 'badge', 'chip', 'tag', 'header', 'toolbar', 'filter-bar', 'section',
  // state
  'empty', 'skeleton', 'fallback', 'error',
  // layout
  'layout', 'shell',
]);
const VARIANT_VOCAB = new Set(['create', 'edit', 'public', 'admin', 'trash', 'mobile', 'desktop']);

function walk(dir, acc = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return acc; }
  for (const e of entries) {
    const p = join(dir, e);
    let st;
    try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) {
      if (e === 'node_modules' || e === 'dist' || e.startsWith('.')) continue;
      walk(p, acc);
    } else if (e.endsWith('.ts') && !e.endsWith('.spec.ts') && !e.endsWith('.d.ts')) {
      acc.push(p);
    }
  }
  return acc;
}

function getDecorators(node) {
  // TS 5+: decorators live on node.modifiers (or via getDecorators helper)
  return (ts.canHaveDecorators?.(node) ? ts.getDecorators(node) : node.decorators) || [];
}

function literalText(node) {
  if (!node) return undefined;
  if (ts.isStringLiteralLike(node)) return node.text;
  return undefined;
}

function readDecoratorMeta(dec) {
  const meta = {};
  if (!ts.isCallExpression(dec.expression)) return meta;
  const name = dec.expression.expression.getText();
  meta.__decorator = name; // Component | Directive | Pipe | Injectable
  const arg = dec.expression.arguments[0];
  if (arg && ts.isObjectLiteralExpression(arg)) {
    for (const prop of arg.properties) {
      if (!ts.isPropertyAssignment(prop)) continue;
      const key = prop.name.getText();
      if (key === 'selector') meta.selector = literalText(prop.initializer);
      if (key === 'templateUrl') meta.templateUrl = literalText(prop.initializer);
      if (key === 'name') meta.pipeName = literalText(prop.initializer);
      if (key === 'styleUrl') meta.styleUrls = [literalText(prop.initializer)].filter(Boolean);
      if (key === 'styleUrls' && ts.isArrayLiteralExpression(prop.initializer)) {
        meta.styleUrls = prop.initializer.elements.map(literalText).filter(Boolean);
      }
    }
  }
  return meta;
}

function pascalToKebab(s) {
  return s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Z])([A-Z][a-z])/g, '$1-$2').toLowerCase();
}
function kebabToPascal(s) {
  return s.split(/[-.]/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join('');
}

// Heuristic proposal from the selector (most-normalized existing signal).
function propose(meta, filePath) {
  const scope = filePath.includes('/landing/') ? 'landing'
    : filePath.includes('/console/') ? 'console'
    : 'shared';
  const isSharedUi = /\/shared\/ui\//.test(filePath);
  const isAppRoot = /\/app\/app\.ts$/.test(filePath) || meta.selector === 'landing-root' || meta.selector === 'console-root';

  let confidence = 'high';
  const notes = [];

  // Pipes & directives keep their kind-suffix; most already conform. Propose the existing base.
  if (meta.__decorator === 'Pipe' || meta.__decorator === 'Directive') {
    const cur = basename(filePath).replace(/\.ts$/, '');
    const kind = meta.__decorator === 'Pipe' ? 'pipe' : 'directive';
    const conforms = cur.endsWith(`.${kind}`);
    return {
      scope, isSharedUi, confidence: conforms ? 'high' : 'low',
      proposedBase: cur, proposedClass: meta.className,
      proposedSelector: meta.selector || meta.pipeName || '',
      notes: conforms ? `keep-${kind}` : `${kind}-base-review`,
    };
  }

  // App root bootstrap component — out of scope, never renamed.
  if (isAppRoot) {
    return { scope, isSharedUi, confidence: 'high', proposedBase: basename(filePath).replace(/\.ts$/, ''),
      proposedClass: meta.className, proposedSelector: meta.selector || '', notes: 'app-root-OUT-OF-SCOPE' };
  }

  // tokens from selector, minus app prefix
  let tokens = [];
  if (meta.selector) {
    tokens = meta.selector.split('-');
    if (tokens[0] === 'landing' || tokens[0] === 'console') tokens = tokens.slice(1);
  } else {
    tokens = pascalToKebab(meta.className.replace(/Component$/, '')).split('-');
    confidence = 'low';
    notes.push('no-selector→from-class');
  }

  // drop legacy "feature" prefix token (landing-feature-about → about)
  if (tokens[0] === 'feature') tokens = tokens.slice(1);

  // shared/ui primitive: self-named, no entity/role split
  if (isSharedUi) {
    const base = tokens.join('-');
    return { scope, isSharedUi, confidence, proposedBase: base, proposedClass: kebabToPascal(base),
      proposedSelector: `${scope}-${base}`, notes: notes.join(';') };
  }

  const isDdl = /\/pages\/ddl\//.test(filePath);
  const isLandingFeature = /libs\/landing\/feature/.test(filePath);

  // drop legacy "-page" marker (decided: no page marker → degenerate container)
  let wasPage = false;
  if (tokens.slice(-1)[0] === 'page') { tokens = tokens.slice(0, -1); wasPage = true; notes.push('page-dropped'); }

  // -vN showcase variant (trailing): currently-shipping-v2 → variant=v2
  let variant = '';
  const vMatch = tokens.slice(-1)[0];
  if (vMatch && /^v\d+$/.test(vMatch)) { variant = vMatch; tokens = tokens.slice(0, -1); notes.push('vN-variant'); }

  let entity = '';
  let role = '';

  if (isDdl) {
    // showcase widget/page: whole remaining name is the concept; namespace under ddl- to avoid
    // colliding with the production primitive it demos (carousel-page vs the real carousel).
    entity = tokens.join('-');
    if (entity !== 'ddl' && !entity.startsWith('ddl-')) entity = `ddl-${entity}`;
    notes.push('ddl-showcase');
  } else if (scope === 'landing' && isLandingFeature && tokens.length >= 2) {
    // landing feature section: entity = page (first token), rest = open-vocab section name
    entity = tokens[0];
    role = tokens.slice(1).join('-');
    notes.push('landing-section');
  } else if (scope === 'console') {
    // console: closed-vocab role detection
    const last2 = tokens.slice(-2).join('-');
    const last1 = tokens.slice(-1)[0];
    if (ROLE_VOCAB.has(last2)) { role = last2; tokens = tokens.slice(0, -2); }
    else if (ROLE_VOCAB.has(last1)) { role = last1; tokens = tokens.slice(0, -1); }
    if (!variant) {
      const maybeVar = tokens.slice(-1)[0];
      if (maybeVar && VARIANT_VOCAB.has(maybeVar)) { variant = maybeVar; tokens = tokens.slice(0, -1); }
    }
    entity = tokens.join('-');
    // guard: a role word used AS the entity (e.g. error-page → error) — restore it
    if (!entity && role) { entity = role; role = ''; }
    if (!role) { notes.push(wasPage ? 'page-container' : 'container'); if (entity) confidence = 'med'; }
  } else {
    // landing top-level page (apps/landing pages, non-ddl) — entity-only container
    entity = tokens.join('-');
    notes.push(wasPage ? 'page-container' : 'container');
    if (entity) confidence = 'med';
  }

  if (!entity) { confidence = 'low'; notes.push('empty-entity→REVIEW'); }

  const segs = [entity, variant, role].filter(Boolean);
  const proposedBase = segs.join('.');
  const proposedSelector = `${scope}-${[entity, variant, role].filter(Boolean).join('-')}`;
  const proposedClass = kebabToPascal(segs.join('-'));

  return { scope, isSharedUi, confidence, proposedBase, proposedClass, proposedSelector, notes: notes.join(';') };
}

const files = SCAN_DIRS.flatMap((d) => walk(join(ROOT, d)));
const rows = [];

for (const file of files) {
  const src = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  ts.forEachChild(src, (node) => {
    if (!ts.isClassDeclaration(node) || !node.name) return;
    for (const dec of getDecorators(node)) {
      const meta = readDecoratorMeta(dec);
      if (!['Component', 'Directive', 'Pipe'].includes(meta.__decorator)) continue;
      meta.className = node.name.text;
      const rel = relative(ROOT, file);
      const dir = dirname(rel);
      const p = propose(meta, rel);
      const tmpl = meta.templateUrl ? join(dir, meta.templateUrl).replace(/\\/g, '/') : '';
      const styles = (meta.styleUrls || []).map((s) => join(dir, s).replace(/\\/g, '/')).join('|');
      const curBase = basename(rel).replace(/\.ts$/, '').replace(/\.component$/, '');
      const selOk = (meta.selector || meta.pipeName || '') === (p.proposedSelector || '');
      const action = (curBase === p.proposedBase && selOk && meta.className === p.proposedClass) ? 'keep' : 'rename';
      rows.push({
        kind: meta.__decorator,
        scope: p.scope,
        sharedUi: p.isSharedUi ? 'Y' : '',
        action,
        currentFile: rel,
        currentClass: meta.className,
        currentSelector: meta.selector || meta.pipeName || '',
        templateUrl: tmpl,
        styleUrls: styles,
        proposedBase: p.proposedBase || '',
        proposedClass: p.proposedClass || '',
        proposedSelector: p.proposedSelector || '',
        confidence: p.confidence,
        notes: p.notes,
      });
    }
  });
}

const cols = ['kind', 'scope', 'sharedUi', 'action', 'currentFile', 'currentClass', 'currentSelector',
  'templateUrl', 'styleUrls', 'proposedBase', 'proposedClass', 'proposedSelector', 'confidence', 'notes'];
const csv = [cols.join(',')]
  .concat(rows.sort((a, b) => a.currentFile.localeCompare(b.currentFile))
    .map((r) => cols.map((c) => {
      const v = String(r[c] ?? '');
      return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
    }).join(',')))
  .join('\n');

writeFileSync(join(ROOT, 'tools/codemods/fe-naming-map.csv'), csv + '\n');

const total = rows.length;
const low = rows.filter((r) => r.confidence === 'low').length;
const med = rows.filter((r) => r.confidence === 'med').length;
const renames = rows.filter((r) => r.action === 'rename').length;
const byKind = rows.reduce((m, r) => ((m[r.kind] = (m[r.kind] || 0) + 1), m), {});
const byScope = rows.reduce((m, r) => ((m[r.scope] = (m[r.scope] || 0) + 1), m), {});
console.log('Inventory written: tools/codemods/fe-naming-map.csv');
console.log('Total artifacts:', total, JSON.stringify(byKind), JSON.stringify(byScope));
console.log('Action: rename =', renames, '| keep =', total - renames);
console.log('Confidence: high =', total - low - med, '| med =', med, '| low(REVIEW) =', low);

// Collision safety: a proposed selector must stay globally unique (Angular enforces this).
const selMap = {};
for (const r of rows) if (r.proposedSelector) (selMap[r.proposedSelector] ||= []).push(r.currentFile);
const selDupes = Object.entries(selMap).filter(([, v]) => v.length > 1);
const baseMap = {};
for (const r of rows) { const k = `${dirname(dirname(r.currentFile))}|${r.proposedBase}`; (baseMap[k] ||= []).push(r.currentFile); }
const baseDupes = Object.entries(baseMap).filter(([, v]) => v.length > 1);
console.log('COLLISIONS — selector:', selDupes.length, '| same-folder base:', baseDupes.length);
for (const [s, fs] of selDupes) console.log('  SELECTOR DUP', s, '←', fs.join(' , '));
for (const [k, fs] of baseDupes) console.log('  BASE DUP', k, '←', fs.join(' , '));
