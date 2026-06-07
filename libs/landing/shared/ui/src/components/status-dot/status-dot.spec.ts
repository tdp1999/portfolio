import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusDot } from './status-dot';

describe('StatusDotComponent', () => {
  let component: StatusDot;
  let fixture: ComponentFixture<StatusDot>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusDot],
    }).compileComponents();

    fixture = TestBed.createComponent(StatusDot);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to available state', () => {
    expect(component.state()).toBe('available');
  });

  it('should render the label', () => {
    fixture.componentRef.setInput('label', 'AVAILABLE FOR WORK');
    fixture.detectChanges();
    const labelEl = fixture.nativeElement.querySelector('.landing-status-dot__label');
    expect(labelEl.textContent.trim()).toBe('AVAILABLE FOR WORK');
  });

  it('should expose aria-label on the root element', () => {
    fixture.componentRef.setInput('ariaLabel', 'Currently available');
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector('.landing-status-dot');
    expect(root.getAttribute('aria-label')).toBe('Currently available');
  });

  it('should apply state modifier class', () => {
    fixture.componentRef.setInput('state', 'busy');
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector('.landing-status-dot');
    expect(root.className).toContain('landing-status-dot--busy');
  });

  it('should render a dot child element', () => {
    fixture.detectChanges();
    const dot = fixture.nativeElement.querySelector('.landing-status-dot__dot');
    expect(dot).toBeTruthy();
  });
});
