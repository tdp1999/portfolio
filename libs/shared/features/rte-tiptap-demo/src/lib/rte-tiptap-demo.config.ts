import type { Provider } from '@angular/core';
import type { DocumentEngineConfig, DynamicFieldCategory } from '@phuong-tran-redoc/document-engine-angular';
import { RTE_ENGINE_CONFIG_OVERRIDES } from '@portfolio/shared/features/rte-tiptap';

/**
 * Fields the demo offers in the toolbar's dynamic-field menu.
 *
 * Generic lending vocabulary on purpose. The engine was built against real
 * origination work, but nothing about a specific client belongs on a public
 * page — these are the field names any lender's letter of offer would carry.
 */
export const DEMO_FIELD_CATEGORIES: readonly DynamicFieldCategory[] = [
  {
    key: 'customer',
    label: 'Customer',
    fields: [
      { id: 'customer_name', label: 'Customer name' },
      { id: 'customer_id', label: 'Customer ID' },
      { id: 'customer_address', label: 'Address' },
      { id: 'account_number', label: 'Account number' },
    ],
  },
  {
    key: 'facility',
    label: 'Facility',
    fields: [
      { id: 'loan_amount', label: 'Loan amount' },
      { id: 'loan_term', label: 'Term' },
      { id: 'interest_rate', label: 'Interest rate' },
      { id: 'start_date', label: 'Effective from' },
      { id: 'agreement_date', label: 'Agreement date' },
    ],
  },
  {
    key: 'lender',
    label: 'Lender',
    fields: [
      { id: 'lender_name', label: 'Lender' },
      { id: 'lender_email', label: 'Lender email' },
    ],
  },
];

/**
 * Engine config for the Document Engine product demo.
 *
 * The portfolio's own editor runs a deliberately narrow engine: dynamic fields,
 * tables and restricted editing are all off, because no page published on this
 * site uses them. That is the right config for *content*, and exactly the wrong
 * config for a page whose argument is "here is what this engine does" — a demo
 * that cannot show its own headline features is a demo that is lying.
 *
 * So the product page runs a second engine profile. It shares the editor
 * component, the contract and the document model with everything else; only
 * this object differs. That is the `type:rte-impl` claim made concrete: swapping
 * the engine a surface runs is a provider change, not a fork.
 */
export function documentEngineDemoConfig(): Partial<DocumentEngineConfig> {
  return {
    // The three features the product page names as headline capabilities.
    dynamicField: true,
    dynamicFieldsCategories: [...DEMO_FIELD_CATEGORIES] as DynamicFieldCategory[],
    tables: true,

    // Off, despite being a headline feature. Not every capability earns toolbar
    // space in a 30-second demo: restricted editing adds two controls whose
    // effect is invisible until someone reads what they do, and those two
    // controls were what pushed the toolbar onto a second row. The feature is
    // described in the features band instead, where there is room to say what it
    // is for. A demo's job is to be understood, not to be complete.
    restrictedEditing: false,

    // Presentation extensions stay off, as everywhere else. A demo that lets a
    // visitor recolour text would be showing off the wrong thing: the point of
    // the engine is that a document carries meaning, not styling.
  };
}

/** Drop into a route or component `providers` to run the demo engine profile. */
export function provideDocumentEngineDemo(): Provider {
  return { provide: RTE_ENGINE_CONFIG_OVERRIDES, useFactory: documentEngineDemoConfig };
}
