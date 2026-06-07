import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SectionRule } from './section-rule';

describe('SectionRuleComponent', () => {
  let component: SectionRule;
  let fixture: ComponentFixture<SectionRule>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectionRule],
    }).compileComponents();

    fixture = TestBed.createComponent(SectionRule);
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
