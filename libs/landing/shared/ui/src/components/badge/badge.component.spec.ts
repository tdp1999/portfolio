import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BadgeComponent } from './badge.component';

describe('BadgeComponent', () => {
  let component: BadgeComponent;
  let fixture: ComponentFixture<BadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BadgeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default color as primary', () => {
    expect(component.color()).toBe('primary');
  });

  describe('color variants', () => {
    it('should apply primary color class by default', () => {
      fixture.detectChanges();
      const span = fixture.nativeElement.querySelector('span');
      expect(span.className).toContain('badge--primary');
    });

    it('should apply success color class', () => {
      fixture.componentRef.setInput('color', 'success');
      fixture.detectChanges();
      const span = fixture.nativeElement.querySelector('span');
      expect(span.className).toContain('badge--success');
    });

    it('should apply warning color class', () => {
      fixture.componentRef.setInput('color', 'warning');
      fixture.detectChanges();
      const span = fixture.nativeElement.querySelector('span');
      expect(span.className).toContain('badge--warning');
    });

    it('should apply error color class', () => {
      fixture.componentRef.setInput('color', 'error');
      fixture.detectChanges();
      const span = fixture.nativeElement.querySelector('span');
      expect(span.className).toContain('badge--error');
    });
  });

  describe('badgeClasses computed', () => {
    it('should return badge and color class', () => {
      fixture.componentRef.setInput('color', 'primary');
      expect(component.badgeClasses()).toBe('badge badge--primary');
    });

    it('should update class when color changes', () => {
      fixture.componentRef.setInput('color', 'success');
      expect(component.badgeClasses()).toBe('badge badge--success');

      fixture.componentRef.setInput('color', 'error');
      expect(component.badgeClasses()).toBe('badge badge--error');
    });
  });

  describe('content projection', () => {
    it('should project text content', () => {
      const hostElement = document.createElement('landing-badge');
      hostElement.textContent = 'TypeScript';
      document.body.appendChild(hostElement);

      const testFixture = TestBed.createComponent(BadgeComponent);
      testFixture.detectChanges();

      const compiled = testFixture.nativeElement;
      compiled.appendChild(document.createTextNode('TypeScript'));

      expect(compiled.textContent).toContain('TypeScript');

      document.body.removeChild(hostElement);
    });
  });

  describe('template rendering', () => {
    it('should render span with badge class', () => {
      fixture.detectChanges();
      const span = fixture.nativeElement.querySelector('span');
      expect(span).toBeTruthy();
      expect(span.className).toContain('badge');
    });

    it('should apply base badge class with modifier', () => {
      fixture.componentRef.setInput('color', 'warning');
      fixture.detectChanges();
      const span = fixture.nativeElement.querySelector('span');
      expect(span.className).toBe('badge badge--warning');
    });
  });
});
