import type { MediaRefMap } from '@portfolio/shared/features/rte-core/image-refs';
import type { TranslatableJson } from '@portfolio/shared/types';

export const PROJECT_LIFECYCLE_STATUSES = ['LIVE', 'SHIPPED', 'ARCHIVED', 'BETA', 'ONGOING'] as const;
export type ProjectLifecycleStatus = (typeof PROJECT_LIFECYCLE_STATUSES)[number];

export type ProjectSkillRef = {
  name: string;
  slug: string;
  /** Skill category — TECHNICAL / SOFT / TOOL / etc. Used by archive filter grouping. */
  category: string;
};

export type ProjectListItem = {
  slug: string;
  title: string;
  oneLiner: TranslatableJson;
  startDate: string;
  endDate: string | null;
  thumbnailUrl: string | null;
  skills: ProjectSkillRef[];
  featured: boolean;
  lifecycleStatus: ProjectLifecycleStatus;
};

export type ProjectHighlight = {
  /** Optional short bilingual label; null when unset. Renders as `// 01 · <title>`. */
  title: TranslatableJson | null;
  challenge: TranslatableJson;
  approach: TranslatableJson;
  outcome: TranslatableJson;
  /** Sanitized rich-text HTML cache per locale (RTE epic Phase 6). Null until the
   *  field is saved through the editor; render via `<rte-render-html>`. The plain
   *  `challenge`/`approach`/`outcome` above stay as the legacy/fallback text. */
  challengeHtml: TranslatableJson | null;
  approachHtml: TranslatableJson | null;
  outcomeHtml: TranslatableJson | null;
  codeUrl: string | null;
};

export type ProjectImage = {
  url: string;
  alt: string | null;
};

export type ProjectLinkType = 'repo' | 'demo' | 'case-study' | 'doc' | 'post';

export type ProjectLink = {
  label: string;
  url: string;
  type: ProjectLinkType;
};

export type ProjectDetailData = {
  slug: string;
  title: string;
  oneLiner: TranslatableJson;
  description: TranslatableJson;
  motivation: TranslatableJson;
  role: TranslatableJson;
  /** Legacy long-form markdown body. Kept until task 363 drops it; superseded by
   *  `bodyHtml` for rendering. */
  body: TranslatableJson | null;
  /** Sanitized rich-text HTML cache per locale (RTE epic Phase 6) — the rendered
   *  case-study body. Null until saved through the editor. */
  bodyHtml: TranslatableJson | null;
  /** Canonical `PortableDocument` per locale (prose-block renderer epic) — the AST
   *  render source for `<rte-render [doc]>`. Null until the body is (re)saved through
   *  the editor; the detail page falls back to `bodyHtml` + `<rte-render-html>`. */
  bodyCanonical: TranslatableJson | null;
  /** Resolved media for the `image-ref` blocks in `bodyHtml`, keyed by
   *  `data-image-id` (RTE epic Phase 7, task 315). Locale-independent. The body is
   *  stored URL-free; the renderer injects `<img>` from this map at read-time. */
  mediaRefs: MediaRefMap;
  startDate: string;
  endDate: string | null;
  links: ProjectLink[];
  thumbnailUrl: string | null;
  featured: boolean;
  lifecycleStatus: ProjectLifecycleStatus;
  highlights: ProjectHighlight[];
  images: ProjectImage[];
  skills: ProjectSkillRef[];
};
