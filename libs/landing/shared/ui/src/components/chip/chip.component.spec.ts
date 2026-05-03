import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChipComponent } from './chip.component';

describe('ChipComponent', () => {
  let component: ChipComponent;
  let fixture: ComponentFixture<ChipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChipComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ChipComponent);
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
