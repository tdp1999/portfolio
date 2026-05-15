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
  challenge: TranslatableJson;
  approach: TranslatableJson;
  outcome: TranslatableJson;
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

export type ProjectDetail = {
  slug: string;
  title: string;
  oneLiner: TranslatableJson;
  description: TranslatableJson;
  motivation: TranslatableJson;
  role: TranslatableJson;
  body: TranslatableJson | null;
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
