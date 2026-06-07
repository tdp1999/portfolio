import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IconArrow } from './icon-arrow';

describe('LandingIconArrowComponent', () => {
  let fixture: ComponentFixture<IconArrow>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconArrow],
    }).compileComponents();

    fixture = TestBed.createComponent(IconArrow);
  });

  it('renders a right arrow by default', () => {
    fixture.detectChanges();
    const svg = fixture.nativeElement.querySelector('svg') as SVGElement;
    expect(svg).toBeTruthy();
    expect(svg.getAttribute('stroke')).toBe('currentColor');
    expect(svg.querySelector('line')?.getAttribute('x1')).toBe('5');
  });

  it('renders an up-right arrow when direction is up-right', () => {
    fixture.componentRef.setInput('direction', 'up-right');
    fixture.detectChanges();
    const line = fixture.nativeElement.querySelector('line') as SVGLineElement;
    expect(line.getAttribute('x1')).toBe('7');
    expect(line.getAttribute('y1')).toBe('17');
  });

  it('respects size input', () => {
    fixture.componentRef.setInput('size', 24);
    fixture.detectChanges();
    const svg = fixture.nativeElement.querySelector('svg') as SVGElement;
    expect(svg.getAttribute('width')).toBe('24');
    expect(svg.getAttribute('height')).toBe('24');
  });

  it('is aria-hidden by default', () => {
    fixture.detectChanges();
    const svg = fixture.nativeElement.querySelector('svg') as SVGElement;
    expect(svg.getAttribute('aria-hidden')).toBe('true');
  });

  it('omits aria-hidden when ariaHidden is false', () => {
    fixture.componentRef.setInput('ariaHidden', false);
    fixture.detectChanges();
    const svg = fixture.nativeElement.querySelector('svg') as SVGElement;
    expect(svg.getAttribute('aria-hidden')).toBeNull();
  });
});
