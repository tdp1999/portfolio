import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LandingShellComponent } from './landing-shell.component';
import { ICON_PROVIDER, IconProvider } from '../components/icon';

class MockIconProvider implements IconProvider {
  getSvg(name: string, size: number): string | null {
    return `<svg width="${size}" height="${size}" data-icon="${name}"><path d="M1 1" /></svg>`;
  }

  getSupportedIcons(): string[] {
    return [];
  }
}

describe('LandingShellComponent', () => {
  let fixture: ComponentFixture<LandingShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingShellComponent],
      providers: [provideRouter([]), { provide: ICON_PROVIDER, useValue: new MockIconProvider() }],
    }).compileComponents();

    fixture = TestBed.createComponent(LandingShellComponent);
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
