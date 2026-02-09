import { LucideIconProvider, lucideProvider } from './lucide.provider';

describe('LucideIconProvider', () => {
  let provider: LucideIconProvider;

  beforeEach(() => {
    provider = new LucideIconProvider();
  });

  describe('getSvg', () => {
    it('should return an SVG string for a known icon', () => {
      const svg = provider.getSvg('arrow-right', 24);

      expect(svg).not.toBeNull();
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
    });

    it('should return null for an unknown icon', () => {
      const svg = provider.getSvg('not-an-icon', 24);

      expect(svg).toBeNull();
    });

    it('should apply the size parameter as width and height', () => {
      const svg = provider.getSvg('home', 32);

      expect(svg).toContain('width="32"');
      expect(svg).toContain('height="32"');
    });

    it('should include standard SVG attributes', () => {
      const svg = provider.getSvg('check', 24)!;

      expect(svg).toContain('viewBox="0 0 24 24"');
      expect(svg).toContain('stroke="currentColor"');
      expect(svg).toContain('fill="none"');
      expect(svg).toContain('stroke-width="2"');
      expect(svg).toContain('stroke-linecap="round"');
      expect(svg).toContain('stroke-linejoin="round"');
    });

    it('should filter out the key attribute from children', () => {
      const svg = provider.getSvg('arrow-right', 24)!;

      expect(svg).not.toContain('key=');
    });

    it('should include path d attributes', () => {
      const svg = provider.getSvg('arrow-right', 24)!;

      expect(svg).toContain('<path');
      expect(svg).toContain('d="');
    });

    it('should return valid SVG for all common icons', () => {
      const commonIcons = [
        'arrow-right',
        'arrow-left',
        'check',
        'close',
        'menu',
        'search',
        'home',
        'user',
        'settings',
        'mail',
        'github',
        'linkedin',
        'external-link',
        'download',
        'sun',
        'moon',
      ];

      commonIcons.forEach((name) => {
        const svg = provider.getSvg(name, 24);

        expect(svg).not.toBeNull();
        expect(svg).toContain('<svg');
      });
    });
  });

  describe('getSupportedIcons', () => {
    it('should return an array of supported icon names', () => {
      const supported = provider.getSupportedIcons();

      expect(Array.isArray(supported)).toBe(true);
      expect(supported.length).toBeGreaterThanOrEqual(20);
    });

    it('should include common icons in the supported list', () => {
      const supported = provider.getSupportedIcons();

      expect(supported).toContain('arrow-right');
      expect(supported).toContain('check');
      expect(supported).toContain('menu');
      expect(supported).toContain('github');
    });
  });

  describe('lucideProvider singleton', () => {
    it('should be an instance of LucideIconProvider', () => {
      expect(lucideProvider).toBeInstanceOf(LucideIconProvider);
    });

    it('should work the same as a new instance', () => {
      expect(lucideProvider.getSvg('home', 24)).not.toBeNull();
      expect(lucideProvider.getSvg('invalid', 24)).toBeNull();
    });
  });
});
