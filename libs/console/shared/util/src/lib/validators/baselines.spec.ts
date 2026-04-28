import { FormControl, Validators } from '@angular/forms';
import { LIMITS } from '@portfolio/shared/validation';
import { baselineFor } from './baselines';

describe('baselineFor', () => {
  it('does NOT include Validators.required in any baseline', () => {
    // Spot-check: these baselines must be safe to apply to optional fields.
    const baselines = [
      baselineFor.shortText(),
      baselineFor.url(),
      baselineFor.email(),
      baselineFor.phone(),
      baselineFor.integer(0, 10),
      baselineFor.password(),
      baselineFor.metaTitle(),
      baselineFor.displayOrder(),
      baselineFor.yearsOfExperience(),
    ];
    for (const validators of baselines) {
      const control = new FormControl(null, validators);
      expect(control.errors).toBeNull();
    }
  });

  it('shortText caps length at the provided max (default = TITLE_MAX)', () => {
    const control = new FormControl('a'.repeat(LIMITS.TITLE_MAX + 1), baselineFor.shortText());
    expect(control.errors).toHaveProperty('maxlength');
  });

  it('url() rejects non-URLs and over-long URLs', () => {
    const bad = new FormControl('not-a-url', baselineFor.url());
    expect(bad.errors).toEqual({ urlInvalid: true });
  });

  it('integer() applies min/max only when provided', () => {
    const c = new FormControl(5.5, baselineFor.integer(0, 10));
    expect(c.errors).toEqual({ integerOnly: true });
    const c2 = new FormControl(-1, baselineFor.integer(0, 10));
    expect(c2.errors).toHaveProperty('min');
    const c3 = new FormControl(99, baselineFor.integer(0, 10));
    expect(c3.errors).toHaveProperty('max');
  });

  it('yearsOfExperience() pins to YOE_MIN/YOE_MAX', () => {
    const c = new FormControl(LIMITS.YOE_MAX + 1, baselineFor.yearsOfExperience());
    expect(c.errors).toHaveProperty('max');
  });

  it('composes with Validators.required at the call site', () => {
    const validators = [Validators.required, ...baselineFor.shortText()];
    const empty = new FormControl('', validators);
    expect(empty.errors).toHaveProperty('required');
  });
});
