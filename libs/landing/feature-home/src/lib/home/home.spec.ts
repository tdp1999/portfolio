import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Home } from './home';
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
  let component: Home;
  let fixture: ComponentFixture<Home>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home, RouterTestingModule],
      providers: [{ provide: ICON_PROVIDER, useValue: new MockIconProvider() }],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
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

  it('has no remaining section placeholders (all real components landed)', () => {
    const placeholders = fixture.nativeElement.querySelectorAll('landing-home-section-placeholder');
    expect(placeholders.length).toBe(0);
  });

  it('renders the selected work section', () => {
    expect(fixture.nativeElement.querySelector('landing-home-selected-work')).toBeTruthy();
  });

  it('renders the §3 bio card grid', () => {
    expect(fixture.nativeElement.querySelector('landing-home-bio-card-grid')).toBeTruthy();
  });

  it('renders the §7 get in touch section', () => {
    expect(fixture.nativeElement.querySelector('landing-home-get-in-touch')).toBeTruthy();
  });
});
