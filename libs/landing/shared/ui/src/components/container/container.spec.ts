import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Container } from './container';

describe('ContainerComponent', () => {
  let fixture: ComponentFixture<Container>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Container],
    }).compileComponents();

    fixture = TestBed.createComponent(Container);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders content size by default (no wide/full modifiers)', () => {
    const el = fixture.nativeElement.querySelector('.landing-container');
    expect(el).toBeTruthy();
    expect(el.classList.contains('landing-container--wide')).toBe(false);
    expect(el.classList.contains('landing-container--full')).toBe(false);
  });

  it('applies wide modifier when size="wide"', () => {
    fixture.componentRef.setInput('size', 'wide');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.landing-container');
    expect(el.classList.contains('landing-container--wide')).toBe(true);
  });

  it('applies full modifier when size="full"', () => {
    fixture.componentRef.setInput('size', 'full');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.landing-container');
    expect(el.classList.contains('landing-container--full')).toBe(true);
  });
});
