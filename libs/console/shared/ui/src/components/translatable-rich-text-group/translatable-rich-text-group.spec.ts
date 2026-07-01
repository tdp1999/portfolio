import { AbstractControl, FormControl, FormGroup } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { TranslatableRichTextGroup } from './translatable-rich-text-group';

// The protected surface this suite exercises (template is stubbed out, so we
// drive the toggle logic directly rather than through the rendered segments).
interface Internals {
  view(): 'en' | 'vi' | 'all';
  onViewChange(value: string): void;
  isVisible(key: string): boolean;
  fg(): FormGroup;
}

describe('TranslatableRichTextGroup', () => {
  function create(
    group: AbstractControl = new FormGroup({ en: new FormControl(null), vi: new FormControl(null) })
  ): Internals {
    TestBed.configureTestingModule({ imports: [TranslatableRichTextGroup] }).overrideComponent(
      TranslatableRichTextGroup,
      {
        set: { template: '' },
      }
    );
    const fixture = TestBed.createComponent(TranslatableRichTextGroup);
    fixture.componentRef.setInput('group', group);
    fixture.detectChanges();
    return fixture.componentInstance as unknown as Internals;
  }

  it('defaults to the single EN view', () => {
    const c = create();
    expect(c.view()).toBe('en');
    expect(c.isVisible('en')).toBe(true);
    expect(c.isVisible('vi')).toBe(false);
  });

  it('the All view reveals both locales', () => {
    const c = create();
    c.onViewChange('all');
    expect(c.isVisible('en')).toBe(true);
    expect(c.isVisible('vi')).toBe(true);
  });

  it('the VI view reveals only VI', () => {
    const c = create();
    c.onViewChange('vi');
    expect(c.isVisible('en')).toBe(false);
    expect(c.isVisible('vi')).toBe(true);
  });

  it('ignores values outside the EN|VI|All set', () => {
    const c = create();
    c.onViewChange('whatever');
    expect(c.view()).toBe('en');
  });

  it('throws when [group] is not a FormGroup', () => {
    const c = create(new FormControl('x'));
    expect(() => c.fg()).toThrow(/must resolve to a FormGroup/);
  });
});
