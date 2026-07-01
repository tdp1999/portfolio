import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Shell } from './shell';
import { ICON_PROVIDER, IconProvider } from '../icon';

class MockIconProvider implements IconProvider {
  getSvg(name: string, size: number): string | null {
    return `<svg width="${size}" height="${size}" data-icon="${name}"><path d="M1 1" /></svg>`;
  }

  getSupportedIcons(): string[] {
    return [];
  }
}

describe('LandingShellComponent', () => {
  let fixture: ComponentFixture<Shell>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Shell],
      providers: [provideRouter([]), { provide: ICON_PROVIDER, useValue: new MockIconProvider() }],
    }).compileComponents();

    fixture = TestBed.createComponent(Shell);
    fixture.detectChanges();
  });

  it('mounts the global header', () => {
    expect(fixture.nativeElement.querySelector('landing-header')).toBeTruthy();
  });

  it('mounts the global footer banner with the shell id (used by floating-pill nav `hideOnSelector`)', () => {
    const banner = fixture.nativeElement.querySelector('landing-footer-banner');
    expect(banner).toBeTruthy();
    expect(banner.getAttribute('id')).toBe('shell-footer-banner');
  });

  it('mounts the global footer signature beneath the banner', () => {
    expect(fixture.nativeElement.querySelector('landing-footer-signature')).toBeTruthy();
  });
});
