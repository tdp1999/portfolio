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
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import {
  CONTACT_PURPOSES,
  ContactFormService,
  type ContactPurpose,
  isContactPurpose,
  mapContactSubmitError,
  ProfileService,
} from '@portfolio/landing/shared/data-access';
import { merge, startWith } from 'rxjs';
import {
  CheckboxComponent,
  ContainerComponent,
  FormFieldComponent,
  InputComponent,
  LandingGlobeComponent,
  LandingLinkComponent,
  LandingLocaleService,
  LandingPageShellComponent,
  LandingTComponent,
  SegmentedComponent,
  TextareaComponent,
  type BreadcrumbItem,
  type SegmentOption,
} from '@portfolio/landing/shared/ui';
import type { SocialPlatform } from '@portfolio/shared/types';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

/**
 * Strip the URL chrome (`https://`, `www.`, trailing slash) for a more
 * scannable display value beside the link. The full URL stays on the `href`.
 */
function prettyChannelValue(url: string): string {
  if (url.startsWith('mailto:')) return url.slice('mailto:'.length);
  return url
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '');
}

/**
 * Cloudflare Turnstile site key. Public (safe to commit), but tied to the
 * registered hostname in the Cloudflare dashboard. Replace with the real key
 * once a Turnstile widget is provisioned. While the value starts with
 * `placeholder`, FE skips widget rendering and relies on the BE dev-bypass.
 */
const TURNSTILE_SITE_KEY = '0x4AAAAAADSVhb9pL9g3tkbz';

interface TurnstileRenderOptions {
  sitekey: string;
  callback: (token: string) => void;
  'error-callback'?: () => void;
  'expired-callback'?: () => void;
  theme?: 'light' | 'dark' | 'auto';
}

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
  selector: 'landing-contact-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    ContainerComponent,
    LandingGlobeComponent,
    LandingLinkComponent,
    LandingPageShellComponent,
    LandingTComponent,
    SegmentedComponent,
    InputComponent,
    TextareaComponent,
    CheckboxComponent,
    FormFieldComponent,
  ],
  templateUrl: './contact.page.html',
  styleUrl: './contact.page.scss',
})
export class ContactPage {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly route = inject(ActivatedRoute);
  private readonly contactService = inject(ContactFormService);
  protected readonly locale = inject(LandingLocaleService).locale;
  private readonly platformId = inject(PLATFORM_ID);
  private readonly injector = inject(Injector);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

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
  private turnstileWidgetId: string | null = null;

  /** Initial purpose from `?purpose=<chip>`; defaults to `'hi'`. */
  private readonly queryPurpose = toSignal(this.route.queryParamMap, { initialValue: null });

  protected readonly form = this.fb.group({
    name: this.fb.control('', { validators: [Validators.required, Validators.maxLength(100)] }),
    email: this.fb.control('', { validators: [Validators.required, Validators.email] }),
    message: this.fb.control('', {
      validators: [Validators.required, Validators.minLength(10), Validators.maxLength(5000)],
    }),
    consent: this.fb.control(false, { validators: [Validators.requiredTrue] }),
    /** Honeypot — bots fill hidden fields; legitimate users don't see it. */
    website: this.fb.control(''),
  });

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

  protected readonly nameError = computed(() => {
    void this.formEvents();
    const c = this.form.controls.name;
    if (c.valid || !c.touched) return null;
    return this.locale() === 'vi' ? 'Vui lòng nhập tên.' : 'Please enter your name.';
  });

  protected readonly emailError = computed(() => {
    void this.formEvents();
    const c = this.form.controls.email;
    if (c.valid || !c.touched) return null;
    return this.locale() === 'vi' ? 'Vui lòng nhập email hợp lệ.' : 'Please enter a valid email address.';
  });

  protected readonly messageError = computed(() => {
    void this.formEvents();
    const c = this.form.controls.message;
    if (c.valid || !c.touched) return null;
    return this.locale() === 'vi'
      ? 'Vui lòng viết tin nhắn (10–5000 ký tự).'
      : 'Please write a message (10–5000 characters).';
  });

  protected readonly consentError = computed(() => {
    void this.formEvents();
    const c = this.form.controls.consent;
    if (c.valid || !c.touched) return null;
    return this.locale() === 'vi' ? 'Bạn cần đồng ý trước khi gửi.' : 'You must agree before sending.';
  });

  protected readonly messageHint = computed(() =>
    this.locale() === 'vi' ? 'Tối thiểu 10 ký tự, tối đa 5000.' : '10–5000 characters.'
  );

  /**
   * Attribute-bound strings — `<landing-t>` is for content projection; attributes
   * (label, aria-label) can't host a component, so a TS computed is the lightest
   * pattern. Pulled together so future translation extraction has one home.
   */
  protected readonly purposeAriaLabel = computed(() =>
    this.locale() === 'vi' ? 'Lý do liên hệ' : 'Reason for contact'
  );
  protected readonly nameLabel = computed(() => (this.locale() === 'vi' ? 'Tên' : 'Name'));
  protected readonly messageLabel = computed(() => (this.locale() === 'vi' ? 'Tin nhắn' : 'Message'));
  protected readonly copyAriaLabel = computed(() => (this.locale() === 'vi' ? 'Sao chép email' : 'Copy email'));

  protected readonly purposeSegments = computed<readonly SegmentOption[]>(() => {
    const isVi = this.locale() === 'vi';
    const labels: Record<ContactPurpose, [string, string]> = {
      hire: ['Hire me', 'Tuyển dụng'],
      freelance: ['Freelance', 'Freelance'],
      collab: ['Collab', 'Hợp tác'],
      press: ['Press / podcast', 'Báo chí'],
      hi: ['Just say hi', 'Chào hỏi'],
    };
    // 'hi' (the default-active purpose) leads so the chip strip opens at its
    // start on mobile — otherwise the horizontal-scroll strip auto-scrolls to
    // the active chip at the far end, hiding the other purposes behind a
    // back-chevron and half-cutting the last visible one.
    const order: readonly ContactPurpose[] = ['hi', ...CONTACT_PURPOSES.filter((id) => id !== 'hi')];
    return order.map((id) => ({ id, label: isVi ? labels[id][1] : labels[id][0] }));
  });

  protected readonly heroCopy = computed(() =>
    this.locale() === 'vi'
      ? 'Toàn thời gian, freelance, hợp tác, podcast — hay chỉ chào một tiếng. Mình thường phản hồi trong vài ngày.'
      : "Full-time, freelance, collab, podcast — or just saying hi. I'll usually reply within a few days."
  );

  /** Consent label text — the "Privacy Policy" link is rendered separately in
   *  the template (so it routes via Angular). The signal copy intentionally
   *  ends before that phrase to avoid "...per the Privacy Policy. Privacy
   *  Policy" double-text alongside the link. */
  protected readonly consentLabel = computed(() =>
    this.locale() === 'vi'
      ? 'Tôi đồng ý cho phép xử lý dữ liệu để nhận phản hồi, theo'
      : 'I agree to the processing of my data to receive a reply, per the'
  );

  protected readonly submitLabel = computed(() => {
    if (this.state() === 'submitting') return this.locale() === 'vi' ? 'Đang gửi…' : 'Sending…';
    return this.locale() === 'vi' ? 'Gửi tin nhắn' : 'Send message';
  });

  private readonly profile = toSignal(inject(ProfileService).getPublicProfile(), { initialValue: null });

  /**
   * Channels surfaced beside the form. Profile-driven — `Profile.email` is the
   * primary channel, the rest come from `Profile.socialLinks` filtered to the
   * platforms we choose to surface here. Zalo is gated to VN locale per the
   * audience decision; everything else shows when the link exists.
   */
  protected readonly channels = computed(() => {
    const profile = this.profile();
    if (!profile) return [];

    const isVi = this.locale() === 'vi';
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

  protected readonly copiedChannel = signal<string | null>(null);

  protected readonly breadcrumb: readonly BreadcrumbItem[] = [{ label: 'Home', href: '/' }, { label: 'Contact' }];

  constructor() {
    this.title.setTitle('Get in touch — Phuong Tran');
    this.meta.updateTag({
      name: 'description',
      content:
        'Reach out about a full-time role, a freelance project, collaboration, press, or just to say hi. Usually reply within a few days.',
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

  protected readonly turnstileMessage = computed(() => {
    const vi = this.locale() === 'vi';
    switch (this.turnstileStatus()) {
      case 'error':
        return vi
          ? 'Không tải được bước xác minh chống bot. Thử lại nhé.'
          : "Couldn't load the bot challenge. Try again.";
      case 'expired':
        return vi ? 'Bước xác minh đã hết hạn. Bấm để làm lại.' : 'The challenge expired. Tap to refresh it.';
      default:
        return '';
    }
  });

  protected readonly turnstileRetryLabel = computed(() => (this.locale() === 'vi' ? 'Tải lại' : 'Refresh'));

  protected submit(): void {
    if (this.state() === 'submitting') return;

    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.state.set('error');
      this.errorMessage.set(
        this.locale() === 'vi' ? 'Vui lòng điền đầy đủ các trường bắt buộc.' : 'Please fill out the required fields.'
      );
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
      this.errorMessage.set(
        this.locale() === 'vi'
          ? 'Vui lòng hoàn tất bước xác minh chống bot.'
          : 'Please complete the bot challenge before submitting.'
      );
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
