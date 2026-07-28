import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import {
  Container,
  EmptyState,
  PageShell,
  type BreadcrumbItem,
  LandingLocaleService,
  LandingCopyPipe,
  resolveCopy,
  LandingMetaService,
} from '@portfolio/landing/shared/ui';
import { VersionService } from '@portfolio/landing/shared/data-access';
import type { VersionResult } from './version.types';

@Component({
  selector: 'landing-version',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Container, PageShell, EmptyState, LandingCopyPipe],
  templateUrl: './version.html',
  styleUrls: ['./version.scss'],
})
export class Version {
  protected readonly locale = inject(LandingLocaleService).locale;
  readonly breadcrumb = computed<readonly BreadcrumbItem[]>(() => {
    const locale = this.locale();
    return [
      { label: resolveCopy('common.page.home', locale), href: '/' },
      { label: resolveCopy('common.page.version', locale) },
    ];
  });

  private readonly seo = inject(LandingMetaService);
  private readonly versionService = inject(VersionService);

  private readonly initial: VersionResult = { status: 'loading', info: null };

  private readonly result = toSignal(
    this.versionService.getVersion().pipe(map((info): VersionResult => ({ status: info ? 'ready' : 'error', info }))),
    { initialValue: this.initial }
  );

  readonly status = computed(() => this.result().status);
  readonly info = computed(() => this.result().info);

  /** Uppercase mono strip under the hero: environment + branch, or a status note. */
  readonly metaLine = computed(() => {
    const v = this.info();
    if (v) return `${v.environment} · ${v.branch}`;
    const key = this.status() === 'error' ? 'version.meta.unreachable' : 'common.loading';
    return resolveCopy(key, this.locale());
  });

  /**
   * Rendered in UTC with a fixed format on purpose: locale/timezone formatting
   * differs between the SSR process and the browser, which would trip hydration.
   */
  readonly startedAt = computed(() => {
    const iso = this.info()?.serverStartedAt;
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
      `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ` +
      `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())} UTC`
    );
  });

  constructor() {
    effect(() => this.seo.apply({ title: resolveCopy('version.meta.title', this.locale()), noindex: true }));
  }
}
