import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideIcons, lucideProvider } from '@portfolio/landing/shared/ui';
import { DdlComponent } from './ddl.component';

describe('DdlComponent', () => {
  let component: DdlComponent;
  let fixture: ComponentFixture<DdlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DdlComponent],
      providers: [provideIcons(lucideProvider)],
    }).compileComponents();

    fixture = TestBed.createComponent(DdlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Header Section', () => {
    it('should render header with correct title', () => {
      const title = fixture.nativeElement.querySelector('h1');

      expect(title).toBeTruthy();
      expect(title.textContent).toContain('Design Definition Language');
    });

    it('should render header description', () => {
      const description = fixture.nativeElement.querySelector('header p');

      expect(description).toBeTruthy();
      expect(description.textContent).toContain('Component showcase');
    });

    it('should render dark mode toggle button', () => {
      const toggleBtn = fixture.nativeElement.querySelector('header button');

      expect(toggleBtn).toBeTruthy();
    });
  });

  describe('Color Palette Section', () => {
    it('should display accent color palette section', () => {
      const section = fixture.nativeElement.querySelector('.color-test');

      expect(section).toBeTruthy();
    });

    it('should render accent color swatches', () => {
      const swatches = fixture.nativeElement.querySelectorAll('.color-test .grid > div');

      expect(swatches.length).toBe(10);
    });
  });

  describe('Semantic Colors Section', () => {
    it('should display semantic color tokens section', () => {
      const section = fixture.nativeElement.querySelector('.semantic-test');

      expect(section).toBeTruthy();
    });

    it('should display at least 3 button variants', () => {
      const buttons = fixture.nativeElement.querySelectorAll('.semantic-test button');

      expect(buttons.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Icon System Section', () => {
    it('should display icon system section', () => {
      const section = fixture.nativeElement.querySelector('.icon-test');

      expect(section).toBeTruthy();
    });

    it('should render icon grid items', () => {
      const icons = fixture.nativeElement.querySelectorAll('.icon-test landing-icon');

      expect(icons.length).toBeGreaterThanOrEqual(20);
    });

    it('should expose iconNames from provider', () => {
      expect(component.iconNames.length).toBeGreaterThanOrEqual(20);
    });
  });

  describe('Layout', () => {
    it('should have container wrapper', () => {
      const container = fixture.nativeElement.querySelector('.container');

      expect(container).toBeTruthy();
    });

    it('should have multiple showcase sections', () => {
      const sections = fixture.nativeElement.querySelectorAll('section > div');

      expect(sections.length).toBeGreaterThanOrEqual(4);
    });
  });
});
