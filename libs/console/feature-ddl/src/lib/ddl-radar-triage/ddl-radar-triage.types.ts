/** Where a post sits in the triage flow. `inbox` = not decided yet. */
export type TriageStatus = 'inbox' | 'saved' | 'done';

export type TriageSort = 'newest' | 'oldest' | 'score' | 'source';

export type TriageDensity = 'comfortable' | 'compact';

export interface TriageImage {
  /** Placeholder label; the study has no real images. */
  label: string;
  ratio: string;
}

export interface TriageItem {
  id: string;
  score: number | null;
  type: string;
  providers: string[];
  /** Days since publishing; drives the newest/oldest sort. */
  ageDays: number;
  published: string;
  source: string;
  relevant: boolean;
  promo: boolean;
  tldr: string;
  applyNote: string | null;
  text: string;
  images: TriageImage[];
  links: { host: string; summary: string | null }[];
  comments: { count: number; digest: string; links: string[] } | null;
  status: TriageStatus;
}

/** A viewport the study simulates: the frame takes the content width the shell would leave. */
export interface TriageScreen {
  value: string;
  label: string;
  width: number;
}
