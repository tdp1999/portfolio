// East of UTC, local midnight on the 1st is still the previous day in UTC: the case that broke.
process.env.TZ = 'Asia/Ho_Chi_Minh';

import { MonthYearPicker } from './month-year-picker';

describe('MonthYearPicker month conversion', () => {
  it('should store a picked month as the 1st at 00:00 UTC, not the previous day', () => {
    expect(MonthYearPicker.toIso(new Date(2022, 2, 1))).toBe('2022-03-01T00:00:00.000Z');
  });

  it('should load a stored month back into the same month at local midnight', () => {
    const month = MonthYearPicker.fromIso('2022-01-01T00:00:00.000Z');

    expect([month.getFullYear(), month.getMonth(), month.getDate(), month.getHours()]).toEqual([2022, 0, 1, 0]);
  });
});
