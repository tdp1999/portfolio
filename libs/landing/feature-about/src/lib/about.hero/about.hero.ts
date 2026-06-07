import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ProfileService } from '@portfolio/landing/shared/data-access';
import { PROFILE_AVAILABILITY_LABELS } from '@portfolio/shared/enum-labels';
import { LandingLocaleService, T, StatusDot, type LandingStatusDotState } from '@portfolio/landing/shared/ui';

/**
 * Maps `ProfileAvailability` to the green/amber/grey status-dot states the
 * landing system already uses (`available` = pill green, `busy` = amber,
 * `away` = grey). Open-to-work + freelancing both signal availability;
 * employed reads as busy; not-available collapses to away.
 */
const AVAILABILITY_TO_DOT: Record<string, LandingStatusDotState> = {
  OPEN_TO_WORK: 'available',
  FREELANCING: 'available',
  EMPLOYED: 'busy',
  NOT_AVAILABLE: 'away',
};

const EN_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;
const VI_MONTHS = [
  'Tháng 1',
  'Tháng 2',
  'Tháng 3',
  'Tháng 4',
  'Tháng 5',
  'Tháng 6',
  'Tháng 7',
  'Tháng 8',
  'Tháng 9',
  'Tháng 10',
  'Tháng 11',
  'Tháng 12',
] as const;

@Component({
  selector: 'landing-about-hero',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [T, StatusDot],
  templateUrl: './about.hero.html',
  styleUrl: './about.hero.scss',
})
export class AboutHero {
  private readonly profile = toSignal(inject(ProfileService).getPublicProfile(), { initialValue: null });
  protected readonly locale = inject(LandingLocaleService).locale;

  protected readonly locationCity = computed(() => this.profile()?.locationCity ?? '');
  protected readonly primaryTimezone = computed(() => this.profile()?.timezones?.[0] ?? 'Asia/Ho_Chi_Minh');
  protected readonly timezoneOffset = computed(() => formatOffset(this.primaryTimezone()));

  protected readonly availability = computed(() => this.profile()?.availability ?? null);
  protected readonly availabilityLabel = computed(() => {
    const a = this.availability();
    if (!a) return '';
    return this.locale() === 'vi' ? (AVAILABILITY_LABELS_VI[a] ?? '') : (PROFILE_AVAILABILITY_LABELS[a] ?? '');
  });
  protected readonly availabilityDotState = computed<LandingStatusDotState>(() => {
    const a = this.availability();
    if (!a) return 'away';
    return AVAILABILITY_TO_DOT[a] ?? 'away';
  });

  /** ISO date of the last narrative content edit — pulled from
   *  `Profile.contentUpdatedAt` (set by the author via the console "Mark
   *  content as updated" action). Null until the first save. */
  private readonly contentUpdatedAt = computed(() => {
    const iso = this.profile()?.contentUpdatedAt;
    if (!iso) return null;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
  });

  protected readonly lastUpdatedIso = computed<string | null>(() => {
    const d = this.contentUpdatedAt();
    return d ? d.toISOString().slice(0, 10) : null;
  });
  protected readonly lastUpdatedLabel = computed(() => {
    const d = this.contentUpdatedAt();
    if (!d) return '';
    const months = this.locale() === 'vi' ? VI_MONTHS : EN_MONTHS;
    const monthLabel = months[d.getUTCMonth()];
    return `${monthLabel} ${d.getUTCFullYear()}`;
  });
}

const AVAILABILITY_LABELS_VI: Record<string, string> = {
  OPEN_TO_WORK: 'Sẵn sàng nhận việc',
  FREELANCING: 'Đang nhận freelance',
  EMPLOYED: 'Đang làm full-time',
  NOT_AVAILABLE: 'Không nhận thêm',
};

/**
 * IANA timezone → "GMT+7" string via `Intl.DateTimeFormat('shortOffset')`.
 * Normalizes "GMT" (offset 0) and "GMT+7" alike so the meta strip stays
 * consistent. Falls back to the literal "GMT" on browsers without `shortOffset`
 * support — Safari < 15.4 territory; acceptable for a meta-strip glyph.
 */
function formatOffset(timezone: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'shortOffset',
    }).formatToParts(new Date());
    const tz = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
    return tz.replace(/^GMT([+-]?\d+)?$/, (_, n) => `GMT${n ?? '+0'}`);
  } catch {
    return 'GMT';
  }
}
