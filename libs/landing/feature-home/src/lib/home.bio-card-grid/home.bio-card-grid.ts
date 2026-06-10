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
  Card,
  Container,
  CopyToClipboardDirective,
  Eyebrow,
  Icon,
  Background,
  Link,
  SocialRow,
  StatusDot,
  TypeOutDirective,
} from '@portfolio/landing/shared/ui';
import { type SocialLink } from '@portfolio/shared/types';
import { type WorkingHours } from '@portfolio/landing/shared/data-access';
import { liveClock } from '../bio-card-grid/live-clock.signal';
import { formatOffset, shortTimezoneLabel, formatHoursInTimezone } from './home.bio-card-grid.util';

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
    Card,
    Container,
    CopyToClipboardDirective,
    Eyebrow,
    Icon,
    Background,
    Link,
    SocialRow,
    StatusDot,
    TypeOutDirective,
  ],
  templateUrl: './home.bio-card-grid.html',
  styleUrl: './home.bio-card-grid.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeBioCardGrid {
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
  /** True once the public profile HTTP call has resolved. When false, card bodies are hidden but shells + eyebrows remain. */
  readonly profileLoaded = input<boolean>(false);

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
