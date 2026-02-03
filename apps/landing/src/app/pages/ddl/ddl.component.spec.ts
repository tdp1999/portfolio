import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DdlComponent } from './ddl.component';

describe('DdlComponent', () => {
  let component: DdlComponent;
  let fixture: ComponentFixture<DdlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DdlComponent],
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
      const compiled = fixture.nativeElement;
      const title = compiled.querySelector('h1');

      expect(title).toBeTruthy();
      expect(title.textContent).toContain('Design Definition Language');
    });

    it('should render header description', () => {
      const compiled = fixture.nativeElement;
      const description = compiled.querySelector('header p');

      expect(description).toBeTruthy();
      expect(description.textContent).toContain('Component showcase');
    });
  });

  describe('Button Examples Section', () => {
    it('should display button examples section', () => {
      const compiled = fixture.nativeElement;
      const buttonSection = compiled.querySelector('.button-examples');

      expect(buttonSection).toBeTruthy();
    });

    it('should render section title for buttons', () => {
      const compiled = fixture.nativeElement;
      const sectionTitle = compiled.querySelector('.button-examples h2');

      expect(sectionTitle).toBeTruthy();
      expect(sectionTitle.textContent).toContain('Button Examples');
    });

    it('should display at least 3 button variants', () => {
      const compiled = fixture.nativeElement;
      const buttons = compiled.querySelectorAll('.button-examples button');

      expect(buttons.length).toBeGreaterThanOrEqual(3);
    });

    it('should have primary button', () => {
      const compiled = fixture.nativeElement;
      const buttons = compiled.querySelectorAll('.button-examples button');
      const buttonTexts = Array.from(buttons).map((btn: any) => btn.textContent.trim());

      expect(buttonTexts).toContain('Primary Button');
    });

    it('should have secondary button', () => {
      const compiled = fixture.nativeElement;
      const buttons = compiled.querySelectorAll('.button-examples button');
      const buttonTexts = Array.from(buttons).map((btn: any) => btn.textContent.trim());

      expect(buttonTexts).toContain('Secondary Button');
    });
  });

  describe('UI Elements Section', () => {
    it('should display UI elements section', () => {
      const compiled = fixture.nativeElement;
      const uiSection = compiled.querySelector('.ui-elements');

      expect(uiSection).toBeTruthy();
    });

    it('should render section title for UI elements', () => {
      const compiled = fixture.nativeElement;
      const sectionTitle = compiled.querySelector('.ui-elements h2');

      expect(sectionTitle).toBeTruthy();
      expect(sectionTitle.textContent).toContain('UI Elements');
    });

    it('should display info message element', () => {
      const compiled = fixture.nativeElement;
      const infoMessage = compiled.querySelector('.ui-elements .info-message');

      expect(infoMessage).toBeTruthy();
      expect(infoMessage.textContent).toContain('Info message');
    });

    it('should display success message element', () => {
      const compiled = fixture.nativeElement;
      const successMessage = compiled.querySelector('.ui-elements .success-message');

      expect(successMessage).toBeTruthy();
      expect(successMessage.textContent).toContain('Success message');
    });

    it('should display badge elements', () => {
      const compiled = fixture.nativeElement;
      const badges = compiled.querySelectorAll('.ui-elements .badge');

      expect(badges.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Layout and Styling', () => {
    it('should have container wrapper', () => {
      const compiled = fixture.nativeElement;
      const container = compiled.querySelector('.container');

      expect(container).toBeTruthy();
    });

    it('should have proper spacing between sections', () => {
      const compiled = fixture.nativeElement;
      const sections = compiled.querySelectorAll('section > div');

      expect(sections.length).toBeGreaterThanOrEqual(2);
    });
  });
});
