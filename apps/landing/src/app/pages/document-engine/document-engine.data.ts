/**
 * Static facts for the hero's bottom row. The live ones (versions, downloads,
 * last commit) are NOT here — they are fetched, and a hardcoded copy would only
 * ever be a number waiting to go stale.
 */
export const HERO_FACTS: readonly { label: string; value: string }[] = [
  { label: 'Licence', value: 'MIT' },
  { label: 'Status', value: 'Live' },
];

/**
 * Stands in for the logo wall a commercial product page opens with. There are no
 * customer logos to show, so this says only what is true and verifiable instead.
 */
export const PROOF_CLAIMS: readonly string[] = [
  'Published on npm',
  'Powers every word on this site',
  'Framework-free document core',
  'Structured JSON, never an HTML blob',
];

/** Public source. Both packages ship from this one repository. */
export const REPO_SLUG = 'phuong-tran-redoc/document-engine';
export const REPO_URL = `https://github.com/${REPO_SLUG}`;

/**
 * The two published packages.
 *
 * Version and download numbers are deliberately NOT hardcoded here. A pinned
 * version is a number that starts rotting the moment it is written, and on a
 * page whose entire argument is "these are real, published packages" a stale
 * badge does active damage. They are fetched live from the npm registry in the
 * browser instead, and simply do not render if the lookup fails.
 */
export interface EnginePackage {
  readonly name: string;
  /** Scope-free name, for places where the full string would dominate the line. */
  readonly shortName: string;
  /**
   * The one word that distinguishes this package from the other one, for the
   * hero badges. Both published names share the `document-engine-` stem, so in a
   * badge that already sits under a `Packages` label on a page called Document
   * Engine, the stem is nine characters of pure repetition — it pushed the live
   * version and download figures, which are the only part a reader is scanning
   * for, out past the badge's own edge.
   */
  readonly label: string;
  readonly role: string;
  readonly npmUrl: string;
}

export const PACKAGES: readonly EnginePackage[] = [
  {
    name: '@phuong-tran-redoc/document-engine-core',
    shortName: 'document-engine-core',
    label: 'core',
    role: 'Framework-free. Owns the document model, the schema versioning, and the migration path between versions.',
    npmUrl: 'https://www.npmjs.com/package/@phuong-tran-redoc/document-engine-core',
  },
  {
    name: '@phuong-tran-redoc/document-engine-angular',
    shortName: 'document-engine-angular',
    label: 'angular',
    role: 'The Angular binding. Editor component, directives, and configuration. Swap this layer to target another framework.',
    npmUrl: 'https://www.npmjs.com/package/@phuong-tran-redoc/document-engine-angular',
  },
];

/**
 * Why it exists. Deliberately generic: the problem is common to any regulated
 * industry that generates documents from templates, and naming a client would
 * add nothing a reader needs.
 */
export interface EngineProblem {
  readonly title: string;
  readonly body: string;
}

export const PROBLEMS: readonly EngineProblem[] = [
  {
    title: 'Recurring licence cost',
    body: 'Commercial rich-text editors bill annually, per seat or per domain, for the rest of the product’s life. That line item never gets smaller.',
  },
  {
    title: 'A ceiling on customisation',
    body: 'Document work in regulated industries is full of rules that no general-purpose editor ships: which fields a user may touch, what has to stay locked, how a placeholder resolves. You end up fighting the vendor’s feature set.',
  },
  {
    title: 'A black box in the critical path',
    body: 'When the component that produces your legally binding documents is one you cannot read, every integration is a negotiation and every upgrade is a risk.',
  },
];

export interface EngineFeature {
  readonly name: string;
  readonly body: string;
}

/** Verified against the published packages, not aspirational. */
export const FEATURES: readonly EngineFeature[] = [
  {
    name: 'Dynamic fields',
    body: 'Placeholders such as {{customer_name}} live in the document as real nodes, not as text a regex has to find later.',
  },
  {
    name: 'Restricted editing',
    body: 'Mark regions the author may change and regions they may not. The lock is part of the document, so it survives a round-trip.',
  },
  {
    name: 'Read-only presentation',
    body: 'The same document renders as a finished, non-editable artefact without a second renderer to keep in sync.',
  },
  {
    name: 'Tables',
    body: 'Create and edit tables inline, stored structurally rather than as nested markup.',
  },
  {
    name: 'Templates',
    body: 'Start from a prepared document instead of an empty page, which is how document work actually begins.',
  },
  {
    name: 'Structured data model',
    body: 'A document is JSON with a schema version, so it can be queried, diffed, migrated, and rendered anywhere. Not an HTML string.',
  },
];

/** Preset actions on the live demo, for readers who are not going to explore a toolbar. */
export interface DemoPreset {
  readonly id: 'field' | 'table' | 'reset' | 'clear';
  readonly label: string;
  readonly hint: string;
}

export const DEMO_PRESETS: readonly DemoPreset[] = [
  { id: 'field', label: 'Insert a dynamic field', hint: 'Adds a {{customer_name}} placeholder' },
  { id: 'table', label: 'Load a template', hint: 'Replaces the document with a prepared one' },
  // A prepared document is a good opening, and a bad place to *try* something.
  // Blank is the only state where what appears in the stored panel is provably
  // the reader's own typing rather than something that was already there.
  { id: 'clear', label: 'Clear all', hint: 'Empties the editor so you can type your own' },
  { id: 'reset', label: 'Reset', hint: 'Back to the starting document' },
];
