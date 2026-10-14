import { adjacentPage, triageBounds, triageToggle, walkStep } from './radar-triage.util';

describe('triageBounds', () => {
  it('should mark the first post of the Feed, not of the page', () => {
    expect(triageBounds(1, 120)).toEqual({ atFirst: true, atLast: false });
    expect(triageBounds(51, 120)).toEqual({ atFirst: false, atLast: false });
  });

  it('should mark the last post of the Feed', () => {
    expect(triageBounds(120, 120)).toEqual({ atFirst: false, atLast: true });
  });

  it('should treat a post outside the list as an end, so the walk does not start from nowhere', () => {
    expect(triageBounds(null, 120)).toEqual({ atFirst: false, atLast: true });
  });
});

describe('walkStep', () => {
  const ids = ['a', 'b', 'c'];
  const middle = { atFirst: false, atLast: false };

  it('should select the neighbour on the same page', () => {
    expect(walkStep(ids, 'b', 1, middle)).toEqual({ kind: 'select', id: 'c' });
    expect(walkStep(ids, 'b', -1, middle)).toEqual({ kind: 'select', id: 'a' });
  });

  it('should ask for the adjacent page past the page edge', () => {
    expect(walkStep(ids, 'c', 1, middle)).toEqual({ kind: 'page', delta: 1 });
    expect(walkStep(ids, 'a', -1, middle)).toEqual({ kind: 'page', delta: -1 });
  });

  it('should stop at the ends of the Feed', () => {
    expect(walkStep(ids, 'a', -1, { atFirst: true, atLast: false })).toBeNull();
    expect(walkStep(ids, 'c', 1, { atFirst: false, atLast: true })).toBeNull();
  });
});

describe('adjacentPage', () => {
  it('should step to the next and previous page inside the total', () => {
    expect(adjacentPage(0, 50, 120, 1)).toBe(1);
    expect(adjacentPage(2, 50, 120, -1)).toBe(1);
  });

  it('should refuse a page before the first or past the last row', () => {
    expect(adjacentPage(0, 50, 120, -1)).toBeNull();
    expect(adjacentPage(2, 50, 120, 1)).toBeNull();
    expect(adjacentPage(1, 50, 100, 1)).toBeNull();
  });
});

describe('triageToggle', () => {
  it('should apply a decision the post does not carry yet', () => {
    expect(triageToggle('INBOX', 'INBOX', 'DONE')).toBe('DONE');
    expect(triageToggle('INBOX', 'INBOX', 'SAVED')).toBe('SAVED');
  });

  it('should send a post back to the tab it was decided in on the same key', () => {
    expect(triageToggle('DONE', 'SAVED', 'DONE')).toBe('SAVED');
    expect(triageToggle('DONE', 'INBOX', 'DONE')).toBe('INBOX');
  });

  it('should send a post to the Inbox on its own tab key', () => {
    expect(triageToggle('SAVED', 'SAVED', 'SAVED')).toBe('INBOX');
  });

  it('should switch decisions directly', () => {
    expect(triageToggle('SAVED', 'SAVED', 'DONE')).toBe('DONE');
  });
});
