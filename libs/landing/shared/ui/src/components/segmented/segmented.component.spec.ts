import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SegmentedComponent, SegmentOption } from './segmented.component';

describe('SegmentedComponent', () => {
  let fixture: ComponentFixture<SegmentedComponent>;
  let component: SegmentedComponent;

  const baseSegments: readonly SegmentOption[] = [
    { id: 'showcase', label: 'Showcase' },
    { id: 'prototypes', label: 'Prototypes' },
    { id: 'usage', label: 'Usage' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SegmentedComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SegmentedComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('segments', baseSegments);
    fixture.componentRef.setInput('active', 'showcase');
    fixture.componentRef.setInput('ariaLabel', 'Test tabs');
    fixture.componentRef.setInput('idPrefix', 'test');
    fixture.detectChanges();
  });

  function buttons(): HTMLButtonElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('button'));
  }

  function press(btn: HTMLButtonElement, key: string): void {
    btn.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    fixture.detectChanges();
  }

  it('should render one tab per segment', () => {
    expect(buttons().length).toBe(3);
  });

  it('should mark the active segment with aria-selected and tabindex 0', () => {
    const [showcase, prototypes, usage] = buttons();
    expect(showcase.getAttribute('aria-selected')).toBe('true');
    expect(showcase.getAttribute('tabindex')).toBe('0');
    expect(prototypes.getAttribute('aria-selected')).toBe('false');
    expect(prototypes.getAttribute('tabindex')).toBe('-1');
    expect(usage.getAttribute('tabindex')).toBe('-1');
  });

  it('should expose role=tablist on the root and role=tab on each button', () => {
    const root = fixture.nativeElement.querySelector('[role="tablist"]');
    expect(root).toBeTruthy();
    expect(root.getAttribute('aria-label')).toBe('Test tabs');
    buttons().forEach((b) => expect(b.getAttribute('role')).toBe('tab'));
  });

  it('should update active when a segment is clicked', () => {
    buttons()[1].click();
    fixture.detectChanges();
    expect(component.active()).toBe('prototypes');
  });

  it('should advance with ArrowRight and wrap to first at end', () => {
    press(buttons()[0], 'ArrowRight');
    expect(component.active()).toBe('prototypes');
    press(buttons()[1], 'ArrowRight');
    expect(component.active()).toBe('usage');
    press(buttons()[2], 'ArrowRight');
    expect(component.active()).toBe('showcase');
  });

  it('should retreat with ArrowLeft and wrap to last at start', () => {
    press(buttons()[0], 'ArrowLeft');
    expect(component.active()).toBe('usage');
  });

  it('should jump to first/last with Home/End', () => {
    fixture.componentRef.setInput('active', 'prototypes');
    fixture.detectChanges();
    press(buttons()[1], 'End');
    expect(component.active()).toBe('usage');
    press(buttons()[2], 'Home');
    expect(component.active()).toBe('showcase');
  });

  it('should skip disabled segments in keyboard navigation', () => {
    fixture.componentRef.setInput('segments', [
      { id: 'showcase', label: 'Showcase' },
      { id: 'prototypes', label: 'Prototypes', disabled: true },
      { id: 'usage', label: 'Usage' },
    ]);
    fixture.detectChanges();
    press(buttons()[0], 'ArrowRight');
    expect(component.active()).toBe('usage');
  });

  it('should not select a disabled segment on click', () => {
    fixture.componentRef.setInput('segments', [
      { id: 'showcase', label: 'Showcase' },
      { id: 'prototypes', label: 'Prototypes', disabled: true },
      { id: 'usage', label: 'Usage' },
    ]);
    fixture.detectChanges();
    buttons()[1].click();
    fixture.detectChanges();
    expect(component.active()).toBe('showcase');
  });

  it('should apply variant modifier classes', () => {
    fixture.componentRef.setInput('variant', 'hairline');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.landing-segmented--hairline')).toBeTruthy();
    fixture.componentRef.setInput('variant', 'underline');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.landing-segmented--underline')).toBeTruthy();
  });
});
