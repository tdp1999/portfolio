import type { Provider } from '@angular/core';
import { provideBlockRenderers } from '@portfolio/shared/features/rte-contract';
import { provideDocumentEngineDemo } from '@portfolio/shared/features/rte-tiptap-demo';
import { DocumentEngineFieldChip } from './document-engine.field-chip/document-engine.field-chip';

/**
 * Route-scoped providers for the product page.
 *
 * Two swaps, both deliberately local to this route:
 *
 * 1. The demo engine profile — the rest of the site runs an engine with dynamic
 *    fields, tables and restricted editing switched off, because no published
 *    page uses them. This page advertises all three.
 * 2. A renderer for the `dynamicField` node, so the read-only view can draw a
 *    placeholder instead of reporting an unknown block.
 *
 * Lives outside the `@Component` decorator because an object literal with an
 * `inputs` key inside `providers` trips `@angular-eslint/no-inputs-metadata-property`.
 */
export function documentEngineProviders(): Provider[] {
  return [
    provideDocumentEngineDemo(),
    ...provideBlockRenderers({
      type: 'dynamicField',
      component: DocumentEngineFieldChip,
      inputs: (node) => ({
        fieldId: String(node.attrs?.['fieldId'] ?? ''),
        label: String(node.attrs?.['label'] ?? ''),
      }),
    }),
  ];
}
