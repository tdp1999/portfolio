/**
 * Local ESLint plugin enforcing the FE file-layout standard from
 * `.context/angular-style-guide.md §16`. Three rules:
 *
 *   fe-file-layout/file-purity  — module scope holds only imports + one Angular-decorated
 *                                  class export + (rare) `declare global { … }` (§16.1)
 *   fe-file-layout/export-style — `export default` only for @Component; all other Angular
 *                                  decorators (@Directive, @Injectable, @Pipe) must use
 *                                  named exports (§16.5)
 *   fe-file-layout/one-class    — at most one Angular-decorated class per file (§16.1)
 *
 * Scope is set in eslint.config.mjs (landing + console only; role files, spec, routes, etc.
 * are excluded via the `ignores` list so the rule never fires on supporting files).
 */

const ANGULAR_CLASS_DECORATORS = new Set(['Component', 'Directive', 'Injectable', 'Pipe']);

function getAngularDecoratorNames(node) {
  return (node.decorators ?? [])
    .filter(
      (d) =>
        d.expression?.type === 'CallExpression' &&
        ANGULAR_CLASS_DECORATORS.has(d.expression.callee?.name),
    )
    .map((d) => d.expression.callee.name);
}

// ── file-purity ──────────────────────────────────────────────────────────────
const filePurity = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Module scope holds only imports + one Angular-decorated class export + declare global (§16.1)',
    },
    schema: [],
    messages: {
      orphan:
        "Module-scope {{kind}} must be extracted to a sibling role file (§16.1). " +
        'Move it to a .types / .data / .util / .validator / .tokens sibling.',
    },
  },
  create(context) {
    const filename = context.filename ?? context.getFilename?.() ?? '';
    if (!filename.endsWith('.ts')) return {};

    return {
      Program(node) {
        // §16.1 governs *component files* — "A component file holds only the class". A module with
        // no Angular-decorated class (functional guard/interceptor/provider, standalone
        // type/const/util/data module) has no class to keep pure, so purity does not apply.
        const hasDecoratedClass = node.body.some((stmt) => {
          const decl =
            stmt.type === 'ExportDefaultDeclaration' || stmt.type === 'ExportNamedDeclaration'
              ? stmt.declaration
              : stmt;
          return decl?.type === 'ClassDeclaration' && getAngularDecoratorNames(decl).length > 0;
        });
        if (!hasDecoratedClass) return;

        for (const stmt of node.body) {
          if (stmt.type === 'ImportDeclaration') continue;

          // declare global { … } is the one module-scope exception (§16.1)
          if (stmt.type === 'TSModuleDeclaration' && stmt.kind === 'global') continue;

          if (
            stmt.type === 'ExportDefaultDeclaration' ||
            stmt.type === 'ExportNamedDeclaration'
          ) {
            const decl =
              stmt.type === 'ExportDefaultDeclaration' ? stmt.declaration : stmt.declaration;

            // One Angular-decorated class export is the only allowed non-import
            if (decl?.type === 'ClassDeclaration' && getAngularDecoratorNames(decl).length > 0) {
              continue;
            }

            // ExportNamedDeclaration with no inline decl is a re-export ({ foo } from '…') — OK
            if (stmt.type === 'ExportNamedDeclaration' && !stmt.declaration) continue;

            const kind = friendlyKind(decl?.type ?? stmt.type);
            context.report({ node: stmt, messageId: 'orphan', data: { kind } });
            continue;
          }

          // Bare (non-exported) const, let, var, function, type, interface, enum → orphan
          context.report({
            node: stmt,
            messageId: 'orphan',
            data: { kind: friendlyKind(stmt.type) },
          });
        }
      },
    };
  },
};

function friendlyKind(type) {
  const map = {
    VariableDeclaration: 'variable declaration',
    FunctionDeclaration: 'function declaration',
    TSTypeAliasDeclaration: 'type alias',
    TSInterfaceDeclaration: 'interface',
    TSEnumDeclaration: 'enum',
    ClassDeclaration: 'non-decorated class',
  };
  return map[type] ?? type;
}

// ── export-style ─────────────────────────────────────────────────────────────
const exportStyle = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'export default only for @Component; @Directive/@Injectable/@Pipe must use named exports (§16.5)',
    },
    schema: [],
    messages: {
      noDefaultNonComponent:
        "'export default' is reserved for lazy-loaded routed @Component classes. " +
        'Use a named export for @{{decorator}} (angular-style-guide.md §16.5).',
    },
  },
  create(context) {
    const filename = context.filename ?? context.getFilename?.() ?? '';
    if (!filename.endsWith('.ts')) return {};

    return {
      ExportDefaultDeclaration(node) {
        const decl = node.declaration;
        if (!decl || decl.type !== 'ClassDeclaration') return;

        for (const name of getAngularDecoratorNames(decl)) {
          if (name === 'Component') return; // @Component may use export default
          context.report({
            node,
            messageId: 'noDefaultNonComponent',
            data: { decorator: name },
          });
          return;
        }
      },
    };
  },
};

// ── one-class ────────────────────────────────────────────────────────────────
const oneClass = {
  meta: {
    type: 'problem',
    docs: { description: 'At most one Angular-decorated class per file (§16.1)' },
    schema: [],
    messages: {
      multipleClasses:
        "A second Angular-decorated class ('{{name}}') was found in this file. " +
        'Each decorated class must live in its own file (angular-style-guide.md §16.1).',
    },
  },
  create(context) {
    const filename = context.filename ?? context.getFilename?.() ?? '';
    if (!filename.endsWith('.ts')) return {};

    let firstSeen = false;

    return {
      ClassDeclaration(node) {
        if (getAngularDecoratorNames(node).length === 0) return;
        if (!firstSeen) {
          firstSeen = true;
        } else {
          const name = node.id?.name ?? '<anonymous>';
          context.report({ node: node.id ?? node, messageId: 'multipleClasses', data: { name } });
        }
      },
    };
  },
};

export default {
  rules: {
    'file-purity': filePurity,
    'export-style': exportStyle,
    'one-class': oneClass,
  },
};
