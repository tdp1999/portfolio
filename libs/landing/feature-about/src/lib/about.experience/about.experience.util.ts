import type { PublicExperience } from '@portfolio/landing/shared/data-access';
import { EMPLOYMENT_TYPE_LABELS, LOCATION_TYPE_LABELS } from '@portfolio/shared/enum-labels';
import type { Locale, TranslatableJson } from '@portfolio/shared/types';
import type { PortableDocument } from '@portfolio/shared/features/rte-core/portable';
import { getLocalized } from '@portfolio/shared/utils/lite';
import { formatMonthRange, resolveCopy } from '@portfolio/landing/shared/ui';
import { FRAGMENT_PREFIX } from './about.experience.data';
import type { ExperienceVm } from './about.experience.types';

/** Localize a canonical `*Canonical` envelope and drop empty docs to `null`
 *  (mirrors home `bioDoc` / project-detail `bodyDoc`), so the template renders
 *  `<rte-render>` only when there is actual content. */
function canonicalDoc(canonical: TranslatableJson | null, lang: Locale): PortableDocument | null {
  const doc = getLocalized(canonical, lang) as unknown as PortableDocument | null;
  return doc && Array.isArray(doc.content) && doc.content.length > 0 ? doc : null;
}

export function sortReverseChrono(a: PublicExperience, b: PublicExperience): number {
  const aEnd = a.endDate ? new Date(a.endDate).getTime() : Number.POSITIVE_INFINITY;
  const bEnd = b.endDate ? new Date(b.endDate).getTime() : Number.POSITIVE_INFINITY;
  if (aEnd !== bEnd) return bEnd - aEnd;
  return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
}

export function toVm(exp: PublicExperience, lang: Locale): ExperienceVm {
  const position = getLocalized(exp.position, lang);
  const teamRole = getLocalized(exp.teamRole, lang);

  return {
    id: exp.id,
    slug: exp.slug,
    companyName: exp.companyName,
    companyUrl: exp.companyUrl,
    companyLogoUrl: exp.companyLogoUrl,
    companyInitial: initialOf(exp.companyName),
    position,
    domain: exp.domain,
    dateRangeLabel: formatDateRange(exp.startDate, exp.endDate, lang),
    isCurrent: !exp.endDate,
    metaItems: buildMetaItems(exp, teamRole, lang),
    highlightsDoc: canonicalDoc(exp.highlightsCanonical, lang),
    responsibilitiesDoc: canonicalDoc(exp.responsibilitiesCanonical, lang),
    skillChips: exp.skills.map((s) => ({ id: s.id, name: getLocalized(s.name, lang) })),
    links: exp.links.map((l) => ({ url: l.url, label: l.label })),
    tabId: `${FRAGMENT_PREFIX}${exp.slug}-tab`,
    panelId: `${FRAGMENT_PREFIX}${exp.slug}-panel`,
    fragment: `${FRAGMENT_PREFIX}${exp.slug}`,
  };
}

function initialOf(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed[0].toUpperCase() : '';
}

/** "Jan 2021 - Apr 2024" / "Tháng 1 2021 tới Hiện tại". Month names and the
 *  open-ended end label both follow the active locale (task 388); the separator
 *  is a plain hyphen so no en-dash reaches the source. */
function formatDateRange(startStr: string, endStr: string | null, lang: Locale): string {
  const start = new Date(startStr);
  const end = endStr ? new Date(endStr) : null;
  return formatMonthRange(start, end, lang, resolveCopy('about.experience.present', lang));
}

/** "Team of 6 · Tech Lead · Full Time · Remote, Ho Chi Minh City, Vietnam".
 *  Collapses any missing field cleanly — never produces stray separators. */
function buildMetaItems(exp: PublicExperience, teamRole: string, lang: Locale): readonly string[] {
  const items: string[] = [];
  const team = teamSizeLabel(exp.teamSizeMin, exp.teamSizeMax, lang);
  if (team) items.push(team);
  if (teamRole) items.push(teamRole);
  const employment = EMPLOYMENT_TYPE_LABELS[exp.employmentType];
  if (employment) items.push(employment);
  const location = locationLabel(exp);
  if (location) items.push(location);
  return items;
}

function teamSizeLabel(min: number | null, max: number | null, lang: Locale): string {
  if (min && max && min !== max) {
    return resolveCopy('about.experience.teamOfRange', lang, { min, max });
  }
  const n = min ?? max;
  return n ? resolveCopy('about.experience.teamOf', lang, { n }) : '';
}

function locationLabel(exp: PublicExperience): string {
  const type = LOCATION_TYPE_LABELS[exp.locationType];
  const place = [exp.locationCity, exp.locationCountry].filter((s): s is string => Boolean(s)).join(', ');
  if (type && place) return `${type}, ${place}`;
  return type || place;
}
