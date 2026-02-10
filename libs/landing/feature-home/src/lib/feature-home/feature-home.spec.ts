import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FeatureHome } from './feature-home';
import { IconProvider } from '@portfolio/landing/shared/ui';
import { ICON_PROVIDER } from '@portfolio/landing/shared/ui';

class MockIconProvider implements IconProvider {
  getSvg(name: string, size: number): string | null {
    return `<svg width="${size}" height="${size}"><path d="M1 1" /></svg>`;
  }

  getSupportedIcons(): string[] {
    return ['arrow-right', 'user'];
  }
}

describe('FeatureHome', () => {
  let component: FeatureHome;
  let fixture: ComponentFixture<FeatureHome>;

  beforeEach(async () => {
    const mockIconProvider = new MockIconProvider();

    await TestBed.configureTestingModule({
      imports: [FeatureHome, RouterTestingModule],
      providers: [{ provide: ICON_PROVIDER, useValue: mockIconProvider }],
    }).compileComponents();

    fixture = TestBed.createComponent(FeatureHome);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render hero section with title', () => {
    const heroTitle = fixture.nativeElement.querySelector('h1');
    expect(heroTitle).toBeTruthy();
    expect(heroTitle.textContent).toContain("Hi, I'm");
    expect(heroTitle.textContent).toContain('Phuong');
  });

  it('should render subtitle text', () => {
    const subtitle = fixture.nativeElement.querySelector('p');
    expect(subtitle).toBeTruthy();
    expect(subtitle.textContent).toContain('Full-stack developer');
  });

  it('should render primary action button with arrow icon', () => {
    const buttons = fixture.nativeElement.querySelectorAll('landing-button');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
    expect(buttons[0].textContent).toContain('View Projects');
    // Check for icon element
    const icon = buttons[0].querySelector('landing-icon');
    expect(icon).toBeTruthy();
  });

  it('should render secondary action button', () => {
    const buttons = fixture.nativeElement.querySelectorAll('landing-button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
    expect(buttons[1].textContent).toContain('Contact Me');
  });

  it('should render navigation link to DDL page', () => {
    const navLink = fixture.nativeElement.querySelector('a[routerLink="/ddl"]');
    expect(navLink).toBeTruthy();
    expect(navLink.textContent).toContain('DDL');
  });

  it('should render user icon in profile circle', () => {
    const profileCircle = fixture.nativeElement.querySelector('.rounded-full');
    expect(profileCircle).toBeTruthy();
    const userIcon = profileCircle.querySelector('landing-icon');
    expect(userIcon).toBeTruthy();
  });

  it('should use responsive flex layout for hero content', () => {
    // Query for elements with flex-col class and then check for responsive classes
    const flexContainers = fixture.nativeElement.querySelectorAll('.flex-col');
    expect(flexContainers.length).toBeGreaterThan(0);

    // Find the hero grid container (the one with items-center and gap-8)
    let heroGrid = null;
    for (let i = 0; i < flexContainers.length; i++) {
      if (
        flexContainers[i].classList.contains('items-center') &&
        flexContainers[i].classList.contains('gap-8')
      ) {
        heroGrid = flexContainers[i];
        break;
      }
    }

    expect(heroGrid).toBeTruthy();
    expect(heroGrid.classList.contains('flex')).toBe(true);
    expect(heroGrid.classList.contains('flex-col')).toBe(true);
  });
});
