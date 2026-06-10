import type { PublicExperience } from '@portfolio/landing/shared/data-access';
import { EMPLOYMENT_TYPE_LABELS, LOCATION_TYPE_LABELS } from '@portfolio/shared/enum-labels';
import type { Locale } from '@portfolio/shared/types';
import { getLocalized } from '@portfolio/shared/utils/lite';
import { FRAGMENT_PREFIX } from './about.experience.data';
import type { ExperienceVm } from './about.experience.types';

export function sortReverseChrono(a: PublicExperience, b: PublicExperience): number {
  const aEnd = a.endDate ? new Date(a.endDate).getTime() : Number.POSITIVE_INFINITY;
  const bEnd = b.endDate ? new Date(b.endDate).getTime() : Number.POSITIVE_INFINITY;
  if (aEnd !== bEnd) return bEnd - aEnd;
  return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
}

export function toVm(exp: PublicExperience, lang: Locale): ExperienceVm {
  const position = getLocalized(exp.position, lang);
  const teamRole = getLocalized(exp.teamRole, lang);
  const highlights = exp.highlights?.[lang] ?? [];
  const responsibilities = exp.responsibilities?.[lang] ?? [];

  return {
    id: exp.id,
    slug: exp.slug,
    companyName: exp.companyName,
    companyUrl: exp.companyUrl,
    companyLogoUrl: exp.companyLogoUrl,
    companyInitial: initialOf(exp.companyName),
    position,
    domain: exp.domain,
    dateRangeLabel: formatDateRange(exp.startDate, exp.endDate),
    isCurrent: !exp.endDate,
    metaItems: buildMetaItems(exp, teamRole),
    highlights,
    responsibilities,
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

/** "May 2024 – Present" / "Jan 2021 – Apr 2024". Locale-agnostic English month abbrevs;
 *  the surrounding meta strip is the only English-locked label and it reads consistently
 *  in both EN and VI shells (mirrors prior career-history component). */
function formatDateRange(startStr: string, endStr: string | null): string {
  const start = formatMonth(startStr);
  const end = endStr ? formatMonth(endStr) : 'Present';
  return `${start} – ${end}`;
}

function formatMonth(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/** "Team of 6 · Tech Lead · Full Time · Remote, Ho Chi Minh City, Vietnam".
 *  Collapses any missing field cleanly — never produces stray separators. */
function buildMetaItems(exp: PublicExperience, teamRole: string): readonly string[] {
  const items: string[] = [];
  const team = teamSizeLabel(exp.teamSizeMin, exp.teamSizeMax);
  if (team) items.push(team);
  if (teamRole) items.push(teamRole);
  const employment = EMPLOYMENT_TYPE_LABELS[exp.employmentType];
  if (employment) items.push(employment);
  const location = locationLabel(exp);
  if (location) items.push(location);
  return items;
}

function teamSizeLabel(min: number | null, max: number | null): string {
  if (min && max && min !== max) return `Team of ${min}–${max}`;
  const n = min ?? max;
  return n ? `Team of ${n}` : '';
}

function locationLabel(exp: PublicExperience): string {
  const type = LOCATION_TYPE_LABELS[exp.locationType];
  const place = [exp.locationCity, exp.locationCountry].filter((s): s is string => Boolean(s)).join(', ');
  if (type && place) return `${type}, ${place}`;
  return type || place;
}
