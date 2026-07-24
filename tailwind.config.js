/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './apps/landing/src/**/*.{html,ts}',
    './apps/console/src/**/*.{html,ts}',
    './libs/landing/**/*.{html,ts}',
    './libs/console/**/*.{html,ts}',
    './libs/shared/**/*.{html,ts}',
  ],
  darkMode: ['variant', ['.dark &', '[data-theme="dark"] &']],
  theme: {
    extend: {
      // Device-bound breakpoints (responsive-system skill). `mobile` is the
      // unprefixed base, so it is omitted. MUST mirror the SCSS $breakpoints
      // map and RESPONSIVE_BREAKPOINTS. See responsive-contract.md §1.
      //
      // ADDED (extend), not replaced: the default sm/md/lg/xl/2xl prefixes stay
      // functional so the ~36 existing usages don't break. Per contract §2 + §8,
      // generic names are banned for NEW code and migrate organically; remove the
      // defaults (move this block to `theme.screens`) once the sweep is complete.
      screens: {
        tablet: '48rem', // 768px
        laptop: '64rem', // 1024px
        wide: '90rem', // 1440px
      },
      colors: {
        // Landing palette (E4 lock — technical-cool with indigo accent)
        ink: {
          0: 'var(--landing-ink-0)',
          1: 'var(--landing-ink-1)',
          2: 'var(--landing-ink-2)',
        },
        'landing-text': {
          300: 'var(--landing-text-300)',
          400: 'var(--landing-text-400)',
          500: 'var(--landing-text-500)',
          600: 'var(--landing-text-600)',
          700: 'var(--landing-text-700)',
        },
        'landing-accent': {
          DEFAULT: 'var(--landing-accent)',
          hover: 'var(--landing-accent-hover)',
          active: 'var(--landing-accent-active)',
        },
        'landing-border': {
          DEFAULT: 'var(--landing-border)',
          strong: 'var(--landing-border-strong)',
        },
        accent: {
          50: 'hsl(var(--accent-hue) var(--accent-saturation) 97%)',
          100: 'hsl(var(--accent-hue) var(--accent-saturation) 94%)',
          200: 'hsl(var(--accent-hue) var(--accent-saturation) 86%)',
          300: 'hsl(var(--accent-hue) var(--accent-saturation) 74%)',
          400: 'hsl(var(--accent-hue) var(--accent-saturation) 62%)',
          500: 'hsl(var(--accent-hue) var(--accent-saturation) 50%)',
          600: 'hsl(var(--accent-hue) var(--accent-saturation) 42%)',
          700: 'hsl(var(--accent-hue) var(--accent-saturation) 34%)',
          800: 'hsl(var(--accent-hue) var(--accent-saturation) 26%)',
          900: 'hsl(var(--accent-hue) var(--accent-saturation) 18%)',
        },
        primary: 'var(--color-primary)',
        'primary-hover': 'var(--color-primary-hover)',
        'primary-container': 'var(--color-primary-container)',
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        'surface-alt': 'var(--color-surface-alt)',
        'surface-hover': 'var(--color-surface-hover)',
        'surface-elevated': 'var(--color-surface-elevated)',
        text: 'var(--color-text)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',
        'text-on-primary': 'var(--color-text-on-primary)',
        border: 'var(--color-border)',
        'border-strong': 'var(--color-border-strong)',
        success: 'var(--color-success)',
        'success-container': 'var(--color-success-container)',
        warning: 'var(--color-warning)',
        'warning-container': 'var(--color-warning-container)',
        error: 'var(--color-error)',
        'error-container': 'var(--color-error-container)',
        info: 'var(--color-info)',
        'info-container': 'var(--color-info-container)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
        display: ['Newsreader', 'ui-serif', 'Georgia', 'serif'],
      },
      fontSize: {
        // Shared (console + landing) — fluid scale via CSS vars
        '2xs': ['var(--text-2xs)', { lineHeight: 'var(--leading-normal)' }],
        xs: ['var(--text-xs)', { lineHeight: 'var(--leading-normal)' }],
        sm: ['var(--text-sm)', { lineHeight: 'var(--leading-normal)' }],
        base: ['var(--text-base)', { lineHeight: 'var(--leading-normal)' }],
        lg: ['var(--text-lg)', { lineHeight: 'var(--leading-snug)' }],
        xl: ['var(--text-xl)', { lineHeight: 'var(--leading-snug)' }],
        '2xl': ['var(--text-2xl)', { lineHeight: 'var(--leading-tight)' }],
        '3xl': ['var(--text-3xl)', { lineHeight: 'var(--leading-tight)' }],
        '4xl': ['var(--text-4xl)', { lineHeight: 'var(--leading-tight)' }],
        '5xl': ['var(--text-5xl)', { lineHeight: 'var(--leading-tight)' }],
        // Landing — display + the whole body scale are FLUID (clamp via CSS vars in
        // tokens/typography.scss, mobile 375 → wide 1440); only mono stays stepped.
        // 4-grid aligned endpoints. Base size `X` = body-md (14 mobile → 16 wide).
        'display-xl': ['var(--landing-display-xl)', { lineHeight: 'var(--landing-display-xl-lh)', letterSpacing: '-0.02em' }],
        'display-lg': ['var(--landing-display-lg)', { lineHeight: 'var(--landing-display-lg-lh)', letterSpacing: '-0.02em' }],
        'display-md': ['var(--landing-display-md)', { lineHeight: 'var(--landing-display-md-lh)', letterSpacing: '-0.02em' }],
        'display-sm': ['var(--landing-display-sm)', { lineHeight: 'var(--landing-display-sm-lh)', letterSpacing: '-0.02em' }],
        'body-xl': ['var(--landing-body-xl)', { lineHeight: 'var(--landing-body-xl-lh)' }],
        'body-lg': ['var(--landing-body-lg)', { lineHeight: 'var(--landing-body-lg-lh)' }],
        'body-md': ['var(--landing-body-md)', { lineHeight: 'var(--landing-body-md-lh)' }], // base size `X` — see .context/design/system/landing-typography.md
        'body-sm': ['var(--landing-body-sm)', { lineHeight: 'var(--landing-body-sm-lh)' }],
        'mono-md': ['12px', { lineHeight: '16px', letterSpacing: '0.06em' }],
        'mono-sm': ['11px', { lineHeight: '16px', letterSpacing: '0.06em' }],
      },
      transitionDuration: {
        'motion-fast': '150ms',
        'motion-base': '200ms',
        'motion-slow': '250ms',
      },
      transitionTimingFunction: {
        'landing-ease': 'cubic-bezier(0.2, 0, 0, 1)',
      },
    },
  },
  plugins: [],
};
