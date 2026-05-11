import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  isDevMode,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  CardComponent,
  ContainerComponent,
  CopyToClipboardDirective,
  EyebrowComponent,
  IconComponent,
  LandingBackgroundComponent,
  LandingLinkComponent,
  LandingSocialRowComponent,
  StatusDotComponent,
  TypeOutDirective,
} from '@portfolio/landing/shared/ui';
import { type SocialLink } from '@portfolio/shared/types';
import { type WorkingHours } from '@portfolio/landing/shared/data-access';
import { liveClock } from './live-clock.signal';

/**
 * §3 Bio Card Grid — landing implementation, PF2 (Aurora Mesh) glass cards
 * with PF7 (Dimensional Layers) hover, refined to E3 theme-mixed glow.
 * Aurora bleeds downward into §4 (per B5 background-bleed pick).
 *
 * Interactions:
 * - HOURS row: swap between owner's working hours and the visitor's local
 *   equivalent on click (fxTypeOut reveal). Button hidden when visitor's
 *   timezone matches the owner's primary timezone.
 * - Email: hover reveals copy icon; click copies, swaps to check 1.5s.
 * - Card C: social icon row below "Connect now" anchor (max 4).
 */
@Component({
  selector: 'landing-home-bio-card-grid',
  standalone: true,
  imports: [
    CardComponent,
    ContainerComponent,
    CopyToClipboardDirective,
    EyebrowComponent,
    IconComponent,
    LandingBackgroundComponent,
    LandingLinkComponent,
    LandingSocialRowComponent,
    StatusDotComponent,
    TypeOutDirective,
  ],
  templateUrl: './home-bio-card-grid.component.html',
  styleUrl: './home-bio-card-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeBioCardGridComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);

  readonly fullName = input<string>('');
  readonly title = input<string>('');
  readonly city = input<string>('');
  readonly email = input<string>('');
  readonly available = input<boolean>(false);
  /** Timezones array from the public profile; we render the primary one. */
  readonly timezones = input<readonly string[]>([]);
  /** Philosophy lead + emphasis (italicized closing). Authored copy. */
  readonly philosophyLead = input<string>('');
  readonly philosophyEmphasis = input<string>('');
  /** Capacity / availability sentence. */
  readonly contactNote = input<string>('');
  /** Social platforms shown under the "Connect now" link in Card C (max 4 rendered). */
  readonly socialLinks = input<readonly SocialLink[]>([]);
  /** Owner's working hours — sourced from `Profile.workingHours`. Null = fallback to defaults. */
  readonly workingHours = input<WorkingHours | null>(null);

  protected readonly primaryTimezone = computed(() => this.timezones()[0] ?? 'Asia/Ho_Chi_Minh');
  protected readonly localTime = liveClock(this.primaryTimezone);

  /** GMT offset string ("GMT+7") derived from the primary timezone. */
  protected readonly utcOffset = computed(() => formatOffset(this.primaryTimezone()));

  protected readonly statusLabel = computed(() => (this.available() ? 'AVAILABLE FOR WORK' : 'CURRENTLY BUSY'));
  protected readonly statusState = computed<'available' | 'busy'>(() => (this.available() ? 'available' : 'busy'));

  /* ─── HOURS row state ─────────────────────────────────────────────────── */

  /**
   * Owner's working hours — sourced from `Profile.workingHours` (task 322).
   * Falls back to `09:00–18:00` when the API hasn't been populated yet so
   * SSR/initial paint stays stable in fresh environments.
   */
  private readonly ownerHoursDefault = { start: '09:00', end: '18:00' } as const;
  private readonly ownerHours = computed(() => this.workingHours() ?? this.ownerHoursDefault);
  private readonly ownerHoursLabel = computed(() => {
    const tzShort = shortTimezoneLabel(this.primaryTimezone());
    const { start, end } = this.ownerHours();
    return `${start}–${end} ${tzShort}`;
  });

  private readonly visitorTimezone = computed(() => {
    if (!isPlatformBrowser(this.platformId)) return this.primaryTimezone();
    // Dev-only ?tz=<IANA> override for QA — e.g. /#who?tz=America/New_York.
    if (isDevMode()) {
      const override = this.document.defaultView?.location.search.match(/[?&]tz=([^&]+)/)?.[1];
      if (override) {
        try {
          const decoded = decodeURIComponent(override);
          new Intl.DateTimeFormat('en', { timeZone: decoded });
          return decoded;
        } catch {
          // fall through to resolved zone
        }
      }
    }
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || this.primaryTimezone();
    } catch {
      return this.primaryTimezone();
    }
  });

  /** Owner's working hours converted to the visitor's local timezone. */
  private readonly localHoursLabel = computed(() => {
    const tz = this.visitorTimezone();
    const { start, end } = this.ownerHours();
    return formatHoursInTimezone(start, end, this.primaryTimezone(), tz);
  });

  /** Hide the toggle when visitor's timezone matches the owner's primary. */
  protected readonly showHoursToggle = computed(
    () => this.visitorTimezone() !== this.primaryTimezone() && this.localHoursLabel() !== this.ownerHoursLabel()
  );

  protected readonly hoursMode = signal<'owner' | 'local'>('owner');
  protected readonly hoursDisplay = computed(() =>
    this.hoursMode() === 'owner' ? this.ownerHoursLabel() : this.localHoursLabel()
  );

  toggleHours(): void {
    this.hoursMode.update((m) => (m === 'owner' ? 'local' : 'owner'));
  }
}

/** Returns a "GMT±N" string for the given IANA timezone, computed from now. */
function formatOffset(timezone: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      timeZoneName: 'shortOffset',
    }).formatToParts(new Date());
    const tz = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
    return tz.replace(/^GMT([+-]?\d+)?$/, (_, n) => `GMT${n ?? '+0'}`);
  } catch {
    return 'GMT';
  }
}

/** "Asia/Ho_Chi_Minh" → "ICT". Falls back to the offset (e.g. "GMT+7") when no abbr is available. */
function shortTimezoneLabel(timezone: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    }).formatToParts(new Date());
    return parts.find((p) => p.type === 'timeZoneName')?.value ?? formatOffset(timezone);
  } catch {
    return formatOffset(timezone);
  }
}

/**
 * Converts a "HH:mm" range from sourceTz → targetTz using today's date as the
 * reference (handles DST as of "now"). Returns `"HH:mm–HH:mm TZS"`.
 */
function formatHoursInTimezone(start: string, end: string, sourceTz: string, targetTz: string): string {
  const ref = new Date();
  const startInTarget = convertWallClock(start, sourceTz, targetTz, ref);
  const endInTarget = convertWallClock(end, sourceTz, targetTz, ref);
  const tzShort = shortTimezoneLabel(targetTz);
  return `${startInTarget}–${endInTarget} ${tzShort}`;
}

/**
 * Treat `hhmm` as a wall-clock time in `sourceTz` today, then format the
 * equivalent wall-clock time in `targetTz`. Naive but good-enough for the
 * "what's 09:00 ICT in my zone" widget.
 */
function convertWallClock(hhmm: string, sourceTz: string, targetTz: string, ref: Date): string {
  const [hh, mm] = hhmm.split(':').map(Number);
  // Build a Date that represents `ref`'s date with the given wall-clock time in sourceTz.
  // Approach: compute the UTC instant such that, formatted in sourceTz, it reads HH:mm.
  // Walk minutes back/forward by the source TZ offset at `ref` vs UTC.
  const yyyy = ref.getUTCFullYear();
  const month = ref.getUTCMonth();
  const day = ref.getUTCDate();
  // Assume UTC time first, then shift by source offset.
  const utcCandidate = new Date(Date.UTC(yyyy, month, day, hh, mm));
  const sourceOffsetMin = offsetMinutes(utcCandidate, sourceTz);
  const instant = new Date(utcCandidate.getTime() - sourceOffsetMin * 60_000);
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: targetTz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(instant);
}

/** Minutes east of UTC for the given IANA zone at instant `at`. */
function offsetMinutes(at: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    timeZoneName: 'shortOffset',
  }).formatToParts(at);
  const raw = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
  const match = raw.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/);
  if (!match) return 0;
  const sign = match[1] === '-' ? -1 : 1;
  const hours = Number(match[2] ?? 0);
  const minutes = Number(match[3] ?? 0);
  return sign * (hours * 60 + minutes);
}
