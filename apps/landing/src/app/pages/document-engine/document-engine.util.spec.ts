import type { PortableNode } from '@portfolio/shared/features/rte-core';
import { relativeTime, toPortable } from './document-engine.util';

describe('toPortable', () => {
  /**
   * This is the boundary the page's whole architectural claim rests on: the
   * engine writes its own node names, the read path speaks portable ones, and
   * the translation happens here rather than by teaching the shared renderer an
   * engine-specific name. If the alias stops being applied, `rte-render` draws
   * an "unknown block" placeholder where the ordered list should be.
   */
  it('rewrites the engine-specific ordered-list name to the portable one', () => {
    const [node] = toPortable([{ type: 'customOrderedList', content: [] }]);
    expect(node.type).toBe('orderedList');
  });

  it('rewrites nested occurrences, not just the top level', () => {
    const [node] = toPortable([
      {
        type: 'blockquote',
        content: [{ type: 'listItem', content: [{ type: 'customOrderedList', content: [] }] }],
      },
    ] as PortableNode[]);

    const listItem = node.content?.[0] as PortableNode;
    expect((listItem.content?.[0] as PortableNode).type).toBe('orderedList');
  });

  it('leaves every other node type untouched and keeps attrs and text', () => {
    const [node] = toPortable([
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'hello', marks: [{ type: 'bold' }] },
          { type: 'dynamicField', attrs: { fieldId: 'customer_name', label: 'Customer name' } },
        ],
      },
    ] as PortableNode[]);

    expect(node.type).toBe('paragraph');
    expect(node.content?.[0]).toEqual({ type: 'text', text: 'hello', marks: [{ type: 'bold' }] });
    expect((node.content?.[1] as PortableNode).attrs).toEqual({
      fieldId: 'customer_name',
      label: 'Customer name',
    });
  });

  it('does not invent a content array on a leaf node', () => {
    const [node] = toPortable([{ type: 'horizontalRule' }]);
    expect('content' in node).toBe(false);
  });
});

describe('relativeTime', () => {
  const daysAgo = (days: number): string => new Date(Date.now() - days * 86_400_000).toISOString();

  it('returns null for a missing or unparseable timestamp', () => {
    expect(relativeTime(null)).toBeNull();
    expect(relativeTime('not a date')).toBeNull();
  });

  /**
   * The point of the whole helper: recency is the signal. A repo last touched
   * two years ago says something worse than saying nothing, so past the cutoff
   * the fact is withheld rather than rendered.
   */
  it('withholds anything older than the staleness cutoff', () => {
    expect(relativeTime(daysAgo(181))).toBeNull();
    expect(relativeTime(daysAgo(179))).not.toBeNull();
  });

  it('reads naturally across the day / month boundaries', () => {
    expect(relativeTime(daysAgo(0))).toBe('today');
    expect(relativeTime(daysAgo(1))).toBe('yesterday');
    expect(relativeTime(daysAgo(5))).toBe('5 days ago');
    expect(relativeTime(daysAgo(29))).toBe('29 days ago');
    expect(relativeTime(daysAgo(30))).toBe('a month ago');
    expect(relativeTime(daysAgo(90))).toBe('3 months ago');
  });

  it('treats a future timestamp as today rather than negative days', () => {
    expect(relativeTime(daysAgo(-2))).toBe('today');
  });
});
