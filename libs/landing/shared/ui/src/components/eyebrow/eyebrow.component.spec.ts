import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EyebrowComponent } from './eyebrow.component';

describe('EyebrowComponent', () => {
  let component: EyebrowComponent;
  let fixture: ComponentFixture<EyebrowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EyebrowComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EyebrowComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render a single string label as one part', () => {
    fixture.componentRef.setInput('label', 'Angular');
    fixture.detectChanges();
    const parts = fixture.nativeElement.querySelectorAll('.landing-eyebrow__part');
    expect(parts.length).toBe(1);
    expect(parts[0].textContent.trim()).toBe('Angular');
  });

  it('should render array label with separator dots between parts', () => {
    fixture.componentRef.setInput('label', ['Angular', 'TypeScript', 'NestJS']);
    fixture.detectChanges();
    const parts = fixture.nativeElement.querySelectorAll('.landing-eyebrow__part');
    const seps = fixture.nativeElement.querySelectorAll('.landing-eyebrow__sep');
    expect(parts.length).toBe(3);
    expect(seps.length).toBe(2);
    expect(seps[0].textContent.trim()).toBe('·');
  });

  it('should render no parts when label is empty array', () => {
    fixture.componentRef.setInput('label', []);
    fixture.detectChanges();
    const parts = fixture.nativeElement.querySelectorAll('.landing-eyebrow__part');
    expect(parts.length).toBe(0);
  });

  it('should toggle accentFirst modifier class when input is true', () => {
    fixture.componentRef.setInput('label', ['04', 'Selected', 'Work']);
    fixture.componentRef.setInput('accentFirst', true);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector('.landing-eyebrow');
    expect(root.classList.contains('landing-eyebrow--accent-first')).toBe(true);
  });

  it('should append a trailing rule and modifier class when trailingRule is true', () => {
    fixture.componentRef.setInput('label', ['03', 'Who']);
    fixture.componentRef.setInput('trailingRule', true);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector('.landing-eyebrow');
    const rule = fixture.nativeElement.querySelector('.landing-eyebrow__rule');
    expect(root.classList.contains('landing-eyebrow--with-rule')).toBe(true);
    expect(rule).toBeTruthy();
  });

  it('should omit the trailing rule by default', () => {
    fixture.componentRef.setInput('label', ['Angular']);
    fixture.detectChanges();
    const rule = fixture.nativeElement.querySelector('.landing-eyebrow__rule');
    expect(rule).toBeNull();
  });
});
