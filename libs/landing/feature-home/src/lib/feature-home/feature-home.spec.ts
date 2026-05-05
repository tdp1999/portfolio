import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FeatureHome } from './feature-home';
import { ICON_PROVIDER, IconProvider } from '@portfolio/landing/shared/ui';

class MockIconProvider implements IconProvider {
  getSvg(name: string, size: number): string | null {
    return `<svg width="${size}" height="${size}"><path d="M1 1" /></svg>`;
  }

  getSupportedIcons(): string[] {
    return [];
  }
}

describe('FeatureHome', () => {
  let component: FeatureHome;
  let fixture: ComponentFixture<FeatureHome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeatureHome, RouterTestingModule],
      providers: [{ provide: ICON_PROVIDER, useValue: new MockIconProvider() }],
    }).compileComponents();

    fixture = TestBed.createComponent(FeatureHome);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the home hero', () => {
    expect(fixture.nativeElement.querySelector('landing-home-hero')).toBeTruthy();
  });

  it('renders the story (intro) section', () => {
    expect(fixture.nativeElement.querySelector('landing-home-intro')).toBeTruthy();
  });

  it('renders placeholders for sister sections still pending', () => {
    const placeholders = fixture.nativeElement.querySelectorAll('landing-home-section-placeholder');
    // §3 Bio Card Grid · §5 Stack · §7 Get in Touch · §8 Footer Banner
    expect(placeholders.length).toBe(4);
  });

  it('renders the selected work section', () => {
    expect(fixture.nativeElement.querySelector('landing-home-selected-work')).toBeTruthy();
  });
});
