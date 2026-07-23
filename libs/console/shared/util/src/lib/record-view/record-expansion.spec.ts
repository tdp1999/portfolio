import { RecordExpansion } from './record-expansion';

describe('RecordExpansion', () => {
  let folds: RecordExpansion;

  beforeEach(() => {
    folds = new RecordExpansion();
  });

  it('starts fully collapsed', () => {
    expect(folds.isOpen('a')).toBe(false);
    expect(folds.openIds()).toEqual([]);
  });

  it('toggles one id independently', () => {
    folds.toggle('a');
    expect(folds.isOpen('a')).toBe(true);
    expect(folds.isOpen('b')).toBe(false);
    folds.toggle('a');
    expect(folds.isOpen('a')).toBe(false);
  });

  it('opens a whole group, then closes it on the second call', () => {
    folds.toggleGroup(['a', 'b']);
    expect(folds.allOpenIn(['a', 'b'])).toBe(true);
    folds.toggleGroup(['a', 'b']);
    expect(folds.allOpenIn(['a', 'b'])).toBe(false);
  });

  it('keeps expand-all scoped to its own section', () => {
    // The control lives in one section's header; reaching into a sibling
    // section was the defect this replaces.
    folds.toggleGroup(['story-1', 'story-2']);
    expect(folds.isOpen('highlight-0')).toBe(false);

    folds.toggleGroup(['highlight-0']);
    expect(folds.allOpenIn(['story-1', 'story-2'])).toBe(true);
  });

  it('closing a group leaves other open folds alone', () => {
    folds.toggle('other');
    folds.toggleGroup(['a', 'b']);
    folds.toggleGroup(['a', 'b']);
    expect(folds.isOpen('other')).toBe(true);
  });

  it('reports an empty group as not-all-open, so the label reads "Expand all"', () => {
    expect(folds.allOpenIn([])).toBe(false);
  });

  it('collapseAll clears everything', () => {
    folds.toggleGroup(['a', 'b', 'c']);
    folds.collapseAll();
    expect(folds.openIds()).toEqual([]);
  });
});
