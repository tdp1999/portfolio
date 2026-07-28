import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  Injector,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { merge, startWith } from 'rxjs';
import {
  CONTACT_PURPOSES,
  ContactFormService,
  type ContactPurpose,
  isContactPurpose,
  ProfileService,
} from '@portfolio/landing/shared/data-access';
import {
  Checkbox,
  Container,
  FormField,
  Globe,
  Input,
  LandingCopyPipe,
  LandingCopyService,
  LandingLocaleService,
  Link,
  PageShell,
  Segmented,
  T,
  Textarea,
  resolveCopy,
  type BreadcrumbItem,
  type LandingCopyKey,
  type SegmentOption,
  mapContactSubmitError,
  LandingMetaService,
} from '@portfolio/landing/shared/ui';
import type { SocialPlatform } from '@portfolio/shared/types';
import { LIMITS } from '@portfolio/shared/validation';
import { TURNSTILE_SITE_KEY } from './contact.data';
import type { FormState, TurnstileRenderOptions } from './contact.types';
import { prettyChannelValue } from './contact.util';

declare global {
  interface Window {
    turnstile?: {
      render: (container: Element | string, options: TurnstileRenderOptions) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

/**
 * /contact — dedicated contact hub.
 *
 * Hero (heading + SLA) → form (purpose chips + name/email/message + consent +
 * Turnstile slot) → channels card → globe section. `?purpose=<chip>` preselects
 * the matching purpose segment. Submit is wired through `ContactFormService`;
 * Turnstile token is currently a placeholder string until the widget is wired
 * in a follow-up task.
 */
@Component({
  selector: 'landing-contact',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    Container,
    Globe,
    Link,
    PageShell,
    T,
    Segmented,
    Input,
    Textarea,
    Checkbox,
    FormField,
    LandingCopyPipe,
  ],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class Contact {
  // ── Constants ─────────────────────────────────────────────────────
  protected readonly LIMITS = LIMITS;

  // ── DI ────────────────────────────────────────────────────────────
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly route = inject(ActivatedRoute);
  private readonly contactService = inject(ContactFormService);
  protected readonly locale = inject(LandingLocaleService).locale;
  private readonly copy = inject(LandingCopyService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly injector = inject(Injector);
  private readonly seo = inject(LandingMetaService);

  // ── Writable signals ──────────────────────────────────────────────
  protected readonly state = signal<FormState>('idle');
  protected readonly errorMessage = signal<string>('');
  protected readonly purpose = signal<ContactPurpose>('hi');
  private readonly turnstileToken = signal<string | null>(null);

  /**
   * Lifecycle of the Turnstile widget — surfaced in the template so the user
   * sees a meaningful status (and a retry affordance) when the challenge
   * fails. See `renderTurnstile` for the state transitions.
   */
  protected readonly turnstileStatus = signal<'loading' | 'ready' | 'error' | 'expired' | 'idle'>('idle');
  protected readonly copiedChannel = signal<string | null>(null);

  // ── Forms ─────────────────────────────────────────────────────────
  // Declared before derived signals that observe form events (formEvents depends on this.form).
  protected readonly form = this.fb.group({
    name: this.fb.control('', { validators: [Validators.required, Validators.maxLength(LIMITS.CONTACT_NAME_MAX)] }),
    email: this.fb.control('', { validators: [Validators.required, Validators.email] }),
    message: this.fb.control('', {
      validators: [
        Validators.required,
        Validators.minLength(LIMITS.CONTACT_MESSAGE_MIN),
        Validators.maxLength(LIMITS.CONTACT_MESSAGE_MAX),
      ],
    }),
    consent: this.fb.control(false, { validators: [Validators.requiredTrue] }),
    /** Honeypot — bots fill hidden fields; legitimate users don't see it. */
    website: this.fb.control(''),
  });

  // ── Derived ───────────────────────────────────────────────────────
  /** Initial purpose from `?purpose=<chip>`; defaults to `'hi'`. */
  private readonly queryPurpose = toSignal(this.route.queryParamMap, { initialValue: null });

  private readonly profile = toSignal(inject(ProfileService).getPublicProfile(), { initialValue: null });

  /**
   * Reactive bridge so the `*Error()` computeds tick on every blur / status
   * flip across the whole form. `FormGroup.events` only emits when the group's
   * own state changes — once the group has any touched child it stays touched,
   * so subsequent child blurs are silent at the group level. Merging every
   * child control's events stream catches each blur individually.
   */
  private readonly formEvents = toSignal(
    merge(this.form.events, ...Object.values(this.form.controls).map((c) => c.events)).pipe(
      startWith(null),
      takeUntilDestroyed()
    ),
    { initialValue: null }
  );

  /**
   * Validation messages, one per control.
   *
   * These call `resolveCopy` rather than `copy.t()`: `t()` *creates* a computed,
   * so calling it inside a computed allocates a fresh reactive node on every
   * recomputation and throws it away. Inside a computed that already tracks
   * `locale()`, the pure function is the whole job.
   */
  protected readonly nameError = computed(() => {
    void this.formEvents();
    const c = this.form.controls.name;
    if (c.valid || !c.touched) return null;
    return resolveCopy('contact.form.name.error', this.locale());
  });

  protected readonly emailError = computed(() => {
    void this.formEvents();
    const c = this.form.controls.email;
    if (c.valid || !c.touched) return null;
    return resolveCopy('contact.form.email.error', this.locale());
  });

  protected readonly messageError = computed(() => {
    void this.formEvents();
    const c = this.form.controls.message;
    if (c.valid || !c.touched) return null;
    return resolveCopy('contact.form.message.error', this.locale());
  });

  protected readonly consentError = computed(() => {
    void this.formEvents();
    const c = this.form.controls.consent;
    if (c.valid || !c.touched) return null;
    return resolveCopy('contact.form.consent.error', this.locale());
  });

  protected readonly messageHint = this.copy.t('contact.form.message.hint');

  /**
   * Attribute-bound strings. `<landing-t>` is content projection, and an
   * attribute (label, aria-label) cannot host a component — so these resolve
   * through the copy dictionary instead.
   */
  protected readonly purposeAriaLabel = this.copy.t('contact.form.purposeAria');
  protected readonly nameLabel = this.copy.t('contact.form.name.label');
  protected readonly messageLabel = this.copy.t('contact.form.message.label');
  protected readonly copyAriaLabel = this.copy.t('contact.channels.copyAria');

  protected readonly purposeSegments = computed<readonly SegmentOption[]>(() => {
    const locale = this.locale();
    const labels: Record<ContactPurpose, LandingCopyKey> = {
      hire: 'contact.purpose.hire',
      freelance: 'contact.purpose.freelance',
      collab: 'contact.purpose.collab',
      press: 'contact.purpose.press',
      hi: 'contact.purpose.hi',
    };
    // 'hi' (the default-active purpose) leads so the chip strip opens at its
    // start on mobile — otherwise the horizontal-scroll strip auto-scrolls to
    // the active chip at the far end, hiding the other purposes behind a
    // back-chevron and half-cutting the last visible one.
    const order: readonly ContactPurpose[] = ['hi', ...CONTACT_PURPOSES.filter((id) => id !== 'hi')];
    return order.map((id) => ({ id, label: resolveCopy(labels[id], locale) }));
  });

  protected readonly heroCopy = this.copy.t('contact.hero.lede');

  /** Consent label text — the "Privacy Policy" link is rendered separately in
   *  the template (so it routes via Angular). The signal copy intentionally
   *  ends before that phrase to avoid "...per the Privacy Policy. Privacy
   *  Policy" double-text alongside the link. */
  protected readonly consentLabel = this.copy.t('contact.form.consent.label');

  private readonly submitIdle = this.copy.t('contact.form.submit.idle');
  private readonly submitBusy = this.copy.t('contact.form.submit.busy');
  protected readonly submitLabel = computed(() =>
    this.state() === 'submitting' ? this.submitBusy() : this.submitIdle()
  );

  /**
   * Channels surfaced beside the form. Profile-driven — `Profile.email` is the
   * primary channel, the rest come from `Profile.socialLinks` filtered to the
   * platforms we choose to surface here. Zalo is gated to VN locale per the
   * audience decision; everything else shows when the link exists.
   */
  protected readonly channels = computed(() => {
    const profile = this.profile();
    if (!profile) return [];

    const isVi = this.locale() === 'vi'; // Zalo is gated to the VN audience — logic, not copy
    const linksByPlatform = new Map<SocialPlatform, string>(
      profile.socialLinks.map((s) => [s.platform, s.url] as const)
    );

    const rows: Array<{ id: string; label: string; value: string; href: string }> = [];

    if (profile.email) {
      rows.push({
        id: 'email',
        label: 'Email',
        value: profile.email,
        href: `mailto:${profile.email}`,
      });
    }

    const surface: ReadonlyArray<{ platform: SocialPlatform; label: string; viOnly?: boolean }> = [
      { platform: 'GITHUB', label: 'GitHub' },
      { platform: 'LINKEDIN', label: 'LinkedIn' },
      { platform: 'TELEGRAM', label: 'Telegram' },
    ];

    for (const { platform, label, viOnly } of surface) {
      if (viOnly && !isVi) continue;
      const url = linksByPlatform.get(platform);
      if (!url) continue;
      rows.push({
        id: platform.toLowerCase(),
        label,
        value: prettyChannelValue(url),
        href: url,
      });
    }

    // Zalo — VN-locale only. Stored as a phone number (not a URL) on the
    // dedicated `phoneZalo` field, surfaced via `zalo.me/<digits>`.
    if (isVi && profile.phoneZalo) {
      const digits = profile.phoneZalo.replace(/[^\d]/g, '');
      if (digits) {
        rows.push({
          id: 'zalo',
          label: 'Zalo',
          value: profile.phoneZalo,
          href: `https://zalo.me/${digits}`,
        });
      }
    }

    return rows;
  });

  private readonly turnstileError = this.copy.t('contact.turnstile.error');
  private readonly turnstileExpired = this.copy.t('contact.turnstile.expired');
  protected readonly turnstileMessage = computed(() => {
    switch (this.turnstileStatus()) {
      case 'error':
        return this.turnstileError();
      case 'expired':
        return this.turnstileExpired();
      default:
        return '';
    }
  });

  protected readonly turnstileRetryLabel = this.copy.t('contact.turnstile.retry');

  // ── Plain state ───────────────────────────────────────────────────
  private turnstileWidgetId: string | null = null;
  protected readonly breadcrumb = computed<readonly BreadcrumbItem[]>(() => {
    const locale = this.locale();
    return [
      { label: resolveCopy('common.page.home', locale), href: '/' },
      { label: resolveCopy('common.page.contact', locale) },
    ];
  });

  constructor() {
    // In an effect so the tags follow a locale change, matching /about and /404.
    effect(() => {
      const locale = this.locale();
      const title = resolveCopy('contact.meta.title', locale);
      const description = resolveCopy('contact.meta.description', locale);
      this.seo.apply({ title, description });
    });

    effect(() => {
      const map = this.queryPurpose();
      if (!map) return;
      const raw = map.get('purpose');
      if (isContactPurpose(raw)) this.purpose.set(raw);
    });

    this.form.controls.consent.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      if (this.state() === 'error') this.state.set('idle');
    });

    afterNextRender(() => this.loadTurnstile(), { injector: this.injector });
  }

  private loadTurnstile(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (TURNSTILE_SITE_KEY.startsWith('placeholder')) return;
    this.turnstileStatus.set('loading');
    if (window.turnstile) {
      this.renderTurnstile();
      return;
    }
    const existing = document.querySelector('script[data-turnstile]');
    if (existing) {
      existing.addEventListener('load', () => this.renderTurnstile(), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.dataset['turnstile'] = '1';
    script.addEventListener('load', () => this.renderTurnstile(), { once: true });
    script.addEventListener('error', () => this.turnstileStatus.set('error'), { once: true });
    document.head.appendChild(script);
  }

  /**
   * Turnstile widgets fail for a few real reasons: the user lingers on the
   * form past the token TTL (~5 min), a transient network blip while the
   * challenge iframe loads, the challenge itself fails (rare — usually an
   * extension or strict CSP), or the script never loads. Each path lands here
   * via `error-callback` / `expired-callback`, and we expose a retry control
   * in the template instead of leaving the user stuck.
   */
  private renderTurnstile(): void {
    if (!window.turnstile) {
      this.turnstileStatus.set('error');
      return;
    }
    const slot = document.querySelector('[data-turnstile-slot]');
    if (!slot) return;
    if (this.turnstileWidgetId) {
      try {
        window.turnstile.remove(this.turnstileWidgetId);
      } catch {
        /* widget already gone with the previous form DOM */
      }
      this.turnstileWidgetId = null;
    }
    this.turnstileStatus.set('loading');
    this.turnstileWidgetId = window.turnstile.render(slot, {
      sitekey: TURNSTILE_SITE_KEY,
      theme: 'auto',
      callback: (token) => {
        this.turnstileToken.set(token);
        this.turnstileStatus.set('ready');
      },
      'error-callback': () => {
        this.turnstileToken.set(null);
        this.turnstileStatus.set('error');
      },
      'expired-callback': () => {
        this.turnstileToken.set(null);
        this.turnstileStatus.set('expired');
      },
    });
  }

  /**
   * User-facing retry. Resets the existing widget when possible (cheaper —
   * the script is already loaded), falls back to a full render when the
   * widget hasn't mounted yet (e.g. script failed to load).
   */
  protected refreshTurnstile(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (TURNSTILE_SITE_KEY.startsWith('placeholder')) return;
    this.turnstileStatus.set('loading');
    if (window.turnstile && this.turnstileWidgetId) {
      try {
        window.turnstile.reset(this.turnstileWidgetId);
        return;
      } catch {
        /* fall through to full render */
      }
    }
    this.renderTurnstile();
  }

  protected submit(): void {
    if (this.state() === 'submitting') return;

    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.state.set('error');
      this.errorMessage.set(resolveCopy('contact.form.error.required', this.locale()));
      return;
    }

    const raw = this.form.getRawValue();
    if (raw.website) {
      // Honeypot triggered — silently treat as success without sending.
      this.state.set('success');
      this.form.reset();
      return;
    }

    const token = this.turnstileToken();
    if (!TURNSTILE_SITE_KEY.startsWith('placeholder') && !token) {
      this.state.set('error');
      this.errorMessage.set(resolveCopy('contact.form.error.challenge', this.locale()));
      return;
    }

    this.state.set('submitting');
    this.errorMessage.set('');

    this.contactService
      .submit({
        ...raw,
        purpose: this.purpose(),
        locale: this.locale(),
        ...(token ? { turnstileToken: token } : {}),
      })
      .subscribe({
        next: () => {
          this.state.set('success');
          this.form.reset();
        },
        error: (err: unknown) => {
          this.state.set('error');
          this.errorMessage.set(mapContactSubmitError(err, this.locale()));
        },
      });
  }

  protected onPurposeChange(value: string): void {
    if (isContactPurpose(value)) this.purpose.set(value);
  }

  protected async copyChannel(channelId: string, value: string): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(value);
      this.copiedChannel.set(channelId);
      setTimeout(() => {
        if (this.copiedChannel() === channelId) this.copiedChannel.set(null);
      }, 1600);
    } catch {
      // Clipboard denied — leave silently; the link still works.
    }
  }

  protected dismissSuccess(): void {
    this.state.set('idle');
    this.turnstileToken.set(null);
    // Form unmounted on success → the previous widget iframe was detached with it.
    // Drop the stale id and wait for Angular to render the fresh form before
    // mounting a new widget.
    this.turnstileWidgetId = null;
    this.turnstileStatus.set('loading');
    afterNextRender(() => this.renderTurnstile(), { injector: this.injector });
  }
}
