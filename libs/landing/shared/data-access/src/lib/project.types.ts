import type { TranslatableJson } from '@portfolio/shared/types';

export type ProjectListItem = {
  slug: string;
  title: string;
  oneLiner: TranslatableJson;
  startDate: string;
  thumbnailUrl: string | null;
  skills: { name: string; slug: string }[];
  featured: boolean;
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

export type ProjectDetail = {
  slug: string;
  title: string;
  oneLiner: TranslatableJson;
  description: TranslatableJson;
  motivation: TranslatableJson;
  role: TranslatableJson;
  startDate: string;
  endDate: string | null;
  sourceUrl: string | null;
  projectUrl: string | null;
  thumbnailUrl: string | null;
  featured: boolean;
  highlights: ProjectHighlight[];
  images: ProjectImage[];
  skills: { name: string; slug: string }[];
};
