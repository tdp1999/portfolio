import type { Locale } from '@portfolio/shared/types';
import { resolveCopy, type LandingCopyKey } from '@portfolio/landing/shared/ui';

/**
 * Static structure for the /document-engine page.
 *
 * Every field a reader sees resolves out of `LANDING_COPY` — the inline
 * `{ en, vi }` objects this file used to carry were an interim wiring, replaced
 * by the dictionary in task 388. What stays here is the shape: ids the template
 * branches on, package names, npm URLs, and the one-word badge keys. Those are
 * technical identifiers, not copy.
 */

export interface HeroFact {
  /** Stable key the template branches on — the Status fact gets a live dot. */
  readonly id: 'licence' | 'status';
  readonly label: string;
  readonly value: string;
}

/**
 * The hero's bottom row. The live facts (versions, downloads, last commit) are
 * NOT here — they are fetched, and a hardcoded copy would only ever be a number
 * waiting to go stale.
 */
export function heroFacts(locale: Locale): readonly HeroFact[] {
  return [
    {
      id: 'licence',
      label: resolveCopy('documentEngine.fact.licence.label', locale),
      value: resolveCopy('documentEngine.fact.licence.value', locale),
    },
    {
      id: 'status',
      label: resolveCopy('documentEngine.fact.status.label', locale),
      value: resolveCopy('documentEngine.fact.status.value', locale),
    },
  ];
}

/**
 * Stands in for the logo wall a commercial product page opens with. There are no
 * customer logos to show, so this says only what is true and verifiable instead.
 */
export function proofClaims(locale: Locale): readonly string[] {
  return [
    resolveCopy('documentEngine.proof.npm', locale),
    resolveCopy('documentEngine.proof.powersSite', locale),
    resolveCopy('documentEngine.proof.frameworkFree', locale),
    resolveCopy('documentEngine.proof.structuredJson', locale),
  ];
}

/** Public source. Both packages ship from this one repository. */
export const REPO_SLUG = 'phuong-tran-redoc/document-engine';
export const REPO_URL = `https://github.com/${REPO_SLUG}`;

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

/**
 * The two published packages.
 *
 * Version and download numbers are deliberately NOT hardcoded. A pinned version
 * is a number that starts rotting the moment it is written, and on a page whose
 * entire argument is "these are real, published packages" a stale badge does
 * active damage. They are fetched live from the npm registry in the browser
 * instead, and simply do not render if the lookup fails.
 */
const PACKAGE_IDS: readonly (Omit<EnginePackage, 'role'> & { readonly roleKey: LandingCopyKey })[] = [
  {
    name: '@phuong-tran-redoc/document-engine-core',
    shortName: 'document-engine-core',
    label: 'core',
    roleKey: 'documentEngine.package.core.role',
    npmUrl: 'https://www.npmjs.com/package/@phuong-tran-redoc/document-engine-core',
  },
  {
    name: '@phuong-tran-redoc/document-engine-angular',
    shortName: 'document-engine-angular',
    label: 'angular',
    roleKey: 'documentEngine.package.angular.role',
    npmUrl: 'https://www.npmjs.com/package/@phuong-tran-redoc/document-engine-angular',
  },
];

/** Registry ids only — what the npm/GitHub fetchers need, with no locale involved. */
export const PACKAGE_NAMES: readonly string[] = PACKAGE_IDS.map((p) => p.name);

export function packages(locale: Locale): readonly EnginePackage[] {
  return PACKAGE_IDS.map(({ roleKey, ...rest }) => ({ ...rest, role: resolveCopy(roleKey, locale) }));
}

export interface EngineProblem {
  readonly title: string;
  readonly body: string;
}

/**
 * Why it exists. Deliberately generic: the problem is common to any regulated
 * industry that generates documents from templates, and naming a client would
 * add nothing a reader needs. Ordered so the one the author lived with first —
 * customisation — leads.
 */
export function problems(locale: Locale): readonly EngineProblem[] {
  return [
    {
      title: resolveCopy('documentEngine.problem.customisation.title', locale),
      body: resolveCopy('documentEngine.problem.customisation.body', locale),
    },
    {
      title: resolveCopy('documentEngine.problem.licenceCost.title', locale),
      body: resolveCopy('documentEngine.problem.licenceCost.body', locale),
    },
    {
      title: resolveCopy('documentEngine.problem.opacity.title', locale),
      body: resolveCopy('documentEngine.problem.opacity.body', locale),
    },
  ];
}

export interface EngineFeature {
  readonly name: string;
  readonly body: string;
}

/** Verified against the published packages, not aspirational. */
export function features(locale: Locale): readonly EngineFeature[] {
  return [
    {
      name: resolveCopy('documentEngine.feature.dynamicFields.name', locale),
      body: resolveCopy('documentEngine.feature.dynamicFields.body', locale),
    },
    {
      name: resolveCopy('documentEngine.feature.restrictedEditing.name', locale),
      body: resolveCopy('documentEngine.feature.restrictedEditing.body', locale),
    },
    {
      name: resolveCopy('documentEngine.feature.readOnly.name', locale),
      body: resolveCopy('documentEngine.feature.readOnly.body', locale),
    },
    {
      name: resolveCopy('documentEngine.feature.tables.name', locale),
      body: resolveCopy('documentEngine.feature.tables.body', locale),
    },
    {
      name: resolveCopy('documentEngine.feature.templates.name', locale),
      body: resolveCopy('documentEngine.feature.templates.body', locale),
    },
    {
      name: resolveCopy('documentEngine.feature.structuredModel.name', locale),
      body: resolveCopy('documentEngine.feature.structuredModel.body', locale),
    },
  ];
}

export interface DemoPreset {
  readonly id: 'field' | 'table' | 'reset' | 'clear';
  readonly label: string;
  readonly hint: string;
}

/** Preset actions on the live demo, for readers who are not going to explore a toolbar. */
export function demoPresets(locale: Locale): readonly DemoPreset[] {
  return [
    {
      id: 'field',
      label: resolveCopy('documentEngine.preset.field.label', locale),
      hint: resolveCopy('documentEngine.preset.field.hint', locale),
    },
    {
      id: 'table',
      label: resolveCopy('documentEngine.preset.table.label', locale),
      hint: resolveCopy('documentEngine.preset.table.hint', locale),
    },
    // A prepared document is a good opening, and a bad place to *try* something.
    // Blank is the only state where what appears in the stored panel is provably
    // the reader's own typing rather than something that was already there.
    {
      id: 'clear',
      label: resolveCopy('documentEngine.preset.clear.label', locale),
      hint: resolveCopy('documentEngine.preset.clear.hint', locale),
    },
    {
      id: 'reset',
      label: resolveCopy('documentEngine.preset.reset.label', locale),
      hint: resolveCopy('documentEngine.preset.reset.hint', locale),
    },
  ];
}
