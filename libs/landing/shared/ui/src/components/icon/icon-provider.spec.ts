import { TestBed } from '@angular/core/testing';
import { IconProvider } from './icon-provider.interface';
import { ICON_PROVIDER } from './icon-provider.token';
import { provideIcons } from './provide-icons';

class MockIconProvider implements IconProvider {
  getSvg(name: string, size: number): string | null {
    return name === 'test' ? `<svg width="${size}" height="${size}"><path d="M1 1" /></svg>` : null;
  }

  getSupportedIcons(): string[] {
    return ['test', 'home', 'user'];
  }
}

describe('Icon Provider Architecture', () => {
  describe('provideIcons', () => {
    it('should register the provider with ICON_PROVIDER token', () => {
      const mockProvider = new MockIconProvider();

      TestBed.configureTestingModule({
        providers: [provideIcons(mockProvider)],
      });

      const injectedProvider = TestBed.inject(ICON_PROVIDER);

      expect(injectedProvider).toBe(mockProvider);
    });
  });

  describe('ICON_PROVIDER token', () => {
    it('should inject the provided IconProvider', () => {
      const mockProvider = new MockIconProvider();

      TestBed.configureTestingModule({
        providers: [{ provide: ICON_PROVIDER, useValue: mockProvider }],
      });

      const injectedProvider = TestBed.inject(ICON_PROVIDER);

      expect(injectedProvider).toBeInstanceOf(MockIconProvider);
    });

    it('should return SVG string for known icons', () => {
      const mockProvider = new MockIconProvider();

      TestBed.configureTestingModule({
        providers: [provideIcons(mockProvider)],
      });

      const injectedProvider = TestBed.inject(ICON_PROVIDER);
      const svg = injectedProvider.getSvg('test', 24);

      expect(svg).toContain('<svg');
      expect(svg).toContain('width="24"');
    });

    it('should return null for unknown icons', () => {
      const mockProvider = new MockIconProvider();

      TestBed.configureTestingModule({
        providers: [provideIcons(mockProvider)],
      });

      const injectedProvider = TestBed.inject(ICON_PROVIDER);
      const svg = injectedProvider.getSvg('unknown-icon', 24);

      expect(svg).toBeNull();
    });

    it('should return list of supported icons', () => {
      const mockProvider = new MockIconProvider();

      TestBed.configureTestingModule({
        providers: [provideIcons(mockProvider)],
      });

      const injectedProvider = TestBed.inject(ICON_PROVIDER);

      expect(injectedProvider.getSupportedIcons()).toEqual(['test', 'home', 'user']);
    });
  });
});
