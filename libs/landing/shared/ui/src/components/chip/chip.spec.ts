import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Chip } from './chip';

describe('ChipComponent', () => {
  let component: Chip;
  let fixture: ComponentFixture<Chip>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Chip],
    }).compileComponents();

    fixture = TestBed.createComponent(Chip);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to md size', () => {
    expect(component.size()).toBe('md');
  });

  it('should render the label input', () => {
    fixture.componentRef.setInput('label', 'Angular');
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('span');
    expect(span.textContent.trim()).toBe('Angular');
  });

  it('should apply size modifier class', () => {
    fixture.componentRef.setInput('size', 'sm');
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('span');
    expect(span.className).toContain('landing-chip--sm');
  });

  it('should apply md size class by default', () => {
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('span');
    expect(span.className).toContain('landing-chip--md');
  });
});
