import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SectionRuleComponent } from './section-rule.component';

describe('SectionRuleComponent', () => {
  let component: SectionRuleComponent;
  let fixture: ComponentFixture<SectionRuleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectionRuleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SectionRuleComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to the plain variant', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.landing-section-rule');
    expect(el.className).toContain('landing-section-rule--plain');
    expect(el.hasAttribute('data-lift')).toBe(false);
  });

  it('should expose data-lift attribute and class for lift variant', () => {
    fixture.componentRef.setInput('variant', 'lift');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.landing-section-rule');
    expect(el.className).toContain('landing-section-rule--lift');
    expect(el.hasAttribute('data-lift')).toBe(true);
  });

  it('should mark itself as a separator for assistive tech', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.landing-section-rule');
    expect(el.getAttribute('role')).toBe('separator');
  });
});
