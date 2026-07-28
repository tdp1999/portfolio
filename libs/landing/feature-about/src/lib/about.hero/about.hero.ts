import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ProfileService } from '@portfolio/landing/shared/data-access';
import {
  formatMonthYear,
  LandingCopyPipe,
  LandingLocaleService,
  resolveCopy,
  StatusDot,
  type LandingStatusDotState,
} from '@portfolio/landing/shared/ui';
import { AVAILABILITY_COPY_KEYS, AVAILABILITY_TO_DOT } from './about.hero.data';
import { formatOffset } from './about.hero.util';

@Component({
  selector: 'landing-about-hero',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatusDot, LandingCopyPipe],
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
    const key = AVAILABILITY_COPY_KEYS[a];
    return key ? resolveCopy(key, this.locale()) : '';
  });
  protected readonly availabilityDotState = computed<LandingStatusDotState>(() => {
    const a = this.availability();
    if (!a) return 'away';
    return AVAILABILITY_TO_DOT[a] ?? 'away';
  });

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
    return d ? formatMonthYear(d, this.locale()) : '';
  });
}
