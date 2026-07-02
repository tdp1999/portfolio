import type { PortableDocument } from '@portfolio/shared/features/rte-core/portable';

export type ExperienceVm = {
  id: string;
  slug: string;
  companyName: string;
  companyUrl: string | null;
  companyLogoUrl: string | null;
  companyInitial: string;
  position: string;
  domain: string | null;
  dateRangeLabel: string;
  isCurrent: boolean;
  metaItems: readonly string[];
  highlightsDoc: PortableDocument | null;
  responsibilitiesDoc: PortableDocument | null;
  skillChips: readonly { id: string; name: string }[];
  links: readonly { url: string; label: string }[];
  tabId: string;
  panelId: string;
  fragment: string;
};
