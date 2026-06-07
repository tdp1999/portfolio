/**
 * Local ESLint plugin enforcing the FE file-naming grammar from
 * `.context/patterns-file-structure.md`. Two rules:
 *
 *   fe-naming/filename-grammar     — structural shape of the filename:
 *       • no legacy `.component` / `.page` / `.container` markers
 *       • dot = structural boundary, dash = word-joiner (no `_`, no camelCase, no spaces)
 *       • (console only) every non-entity segment ∈ role ∪ variant ∪ kept-kind allowlist (§5)
 *
 *   fe-naming/decorator-name-agreement — file-base ↔ class ↔ selector agree (§6):
 *       file `project.delete-dialog.ts` → class `ProjectDeleteDialog`
 *                                       → selector `<app>-project-delete-dialog`
 *
 * Scope is set in eslint.config.mjs (landing + console only; shared/api/e2e excluded).
 */

// ── §5 controlled vocabulary ───────────────────────────────────────────────
const ROLES = new Set([
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
const VARIANTS = new Set(['create', 'edit', 'public', 'admin', 'trash', 'mobile', 'desktop']);
const KEPT_KINDS = new Set([
  'service', 'store', 'guard', 'resolver', 'interceptor', 'pipe', 'directive',
  'types', 'model', 'routes', 'constants', 'config', 'tokens',
  // recurring Angular/TS artifact kinds found in the tree (mirror §5)
  'provider', 'validator', 'util', 'server', 'data', 'matcher',
]);
const LEGACY = new Set(['component', 'page', 'container']);
const CONSOLE_ALLOWED = new Set([...ROLES, ...VARIANTS, ...KEPT_KINDS]);

const SEGMENT_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/; // lowercase, dash-joined words only

function fileBase(filename) {
  const name = filename.replace(/\\/g, '/').split('/').pop() ?? '';
  return name.replace(/\.ts$/, '').replace(/\.spec$/, '');
}
function pascal(base) {
  return base
    .split('.')
    .flatMap((s) => s.split('-'))
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}
function isConsolePath(filename) {
  return /\/(apps|libs)\/console\//.test(filename.replace(/\\/g, '/'));
}
function isLandingPath(filename) {
  return /\/(apps|libs)\/landing\//.test(filename.replace(/\\/g, '/'));
}

const filenameGrammar = {
  meta: {
    type: 'problem',
    docs: { description: 'Enforce FE filename grammar (patterns-file-structure.md §3–§5)' },
    schema: [],
    messages: {
      legacy: "Legacy marker '.{{seg}}' is banned — drop it (file → role/section, not '.component'/'.page').",
      shape: "Filename segment '{{seg}}' must be lowercase dash-joined words (dot=boundary, dash=joiner; no _, camelCase, or spaces).",
      vocab: "Console segment '{{seg}}' is not in the role/variant/kind allowlist (§5). Add it to the standard + this rule, or rename.",
    },
  },
  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (!filename || !filename.endsWith('.ts')) return {};
    const name = filename.replace(/\\/g, '/').split('/').pop();
    if (name === 'index.ts') return {}; // barrels are structural, not entities

    const base = fileBase(filename);
    const segments = base.split('.');

    return {
      Program(node) {
        for (let i = 0; i < segments.length; i++) {
          const seg = segments[i];
          // legacy markers are banned only as a *suffix segment* (i > 0); a bare entity
          // legitimately named `container` / `page` is fine.
          if (i > 0 && LEGACY.has(seg)) {
            context.report({ node, messageId: 'legacy', data: { seg } });
            return;
          }
          if (!SEGMENT_RE.test(seg)) {
            context.report({ node, messageId: 'shape', data: { seg } });
            return;
          }
        }
        // console: every segment after the entity must be a known role/variant/kind
        if (isConsolePath(filename) && !isLandingPath(filename) && segments.length > 1) {
          for (const seg of segments.slice(1)) {
            if (!CONSOLE_ALLOWED.has(seg)) {
              context.report({ node, messageId: 'vocab', data: { seg } });
              return;
            }
          }
        }
      },
    };
  },
};

const decoratorNameAgreement = {
  meta: {
    type: 'problem',
    docs: { description: 'file-base ↔ class ↔ selector must agree (patterns-file-structure.md §6)' },
    schema: [],
    messages: {
      class: "Class '{{actual}}' should be '{{expected}}' to match file base '{{base}}' (§6).",
      selectorPrefix: "Selector '{{sel}}' must start with 'landing-', 'console-', or 'ui-'.",
      selector: "Selector '{{sel}}' should be '{{expected}}' to match file base '{{base}}' (§6).",
    },
  },
  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (!filename || !filename.endsWith('.ts')) return {};
    const base = fileBase(filename);
    const expectedClass = pascal(base);
    const kebab = base.replace(/\./g, '-');

    return {
      ClassDeclaration(node) {
        const decos = node.decorators ?? [];
        const deco = decos.find((d) => {
          const e = d.expression;
          return e?.type === 'CallExpression' && (e.callee?.name === 'Component' || e.callee?.name === 'Directive');
        });
        if (!deco) return;
        const isComponent = deco.expression.callee.name === 'Component';

        // class↔base check applies to @Component only. Landing-shared directives/services
        // intentionally carry a `Landing` prefix (LandingThemeService, LandingProseAnchorsDirective)
        // to disambiguate injectables — that convention is out of scope for the file-base triad.
        if (isComponent && node.id && node.id.name !== expectedClass) {
          context.report({ node: node.id, messageId: 'class', data: { actual: node.id.name, expected: expectedClass, base } });
        }

        // selector agreement (element selectors only; skip attribute/compound directive selectors)
        const arg = deco.expression.arguments?.[0];
        if (!arg || arg.type !== 'ObjectExpression') return;
        const selProp = arg.properties.find((p) => p.key && (p.key.name === 'selector' || p.key.value === 'selector'));
        if (!selProp || selProp.value?.type !== 'Literal' || typeof selProp.value.value !== 'string') return;
        const sel = selProp.value.value;
        if (!isComponent) return;                 // directives often use attribute selectors — skip
        if (/[[\], ]/.test(sel)) return;          // compound/attribute selector — skip
        const m = sel.match(/^(landing|console|ui)-(.+)$/);
        if (!m) {
          context.report({ node: selProp.value, messageId: 'selectorPrefix', data: { sel } });
          return;
        }
        if (m[2] !== kebab) {
          context.report({ node: selProp.value, messageId: 'selector', data: { sel, expected: `${m[1]}-${kebab}`, base } });
        }
      },
    };
  },
};

export default {
  rules: {
    'filename-grammar': filenameGrammar,
    'decorator-name-agreement': decoratorNameAgreement,
  },
};
