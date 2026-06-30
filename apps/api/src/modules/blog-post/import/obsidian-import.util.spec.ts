import { convertObsidianMarkdown, extractTitleFromMarkdown, stripFirstH1 } from './obsidian-import.util';

describe('obsidian-import.util', () => {
  describe('convertObsidianMarkdown', () => {
    it('converts ==highlight== to <mark>', () => {
      const { content } = convertObsidianMarkdown('a ==hot== b');
      expect(content).toBe('a <mark>hot</mark> b');
    });

    it('strips Obsidian callout markers, leaving a plain blockquote', () => {
      const { content } = convertObsidianMarkdown('> [!note] Heads up\n> the body');
      expect(content).not.toContain('[!note]');
      expect(content).toContain('> the body');
    });

    it('drops Obsidian ![[embed]] images and warns', () => {
      const { content, warnings } = convertObsidianMarkdown('before\n![[diagram.png]]\nafter');
      expect(content).not.toContain('![[');
      expect(content).not.toContain('diagram.png');
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toMatch(/1 image skipped/i);
    });

    it('drops local ![alt](./path) images and warns', () => {
      const { content, warnings } = convertObsidianMarkdown('![cover](./assets/x.png)');
      expect(content).not.toContain('./assets');
      expect(warnings).toHaveLength(1);
    });

    it('drops remote https images too (no broken <img> survives)', () => {
      const { content, warnings } = convertObsidianMarkdown('![alt](https://cdn.example.com/p.png)');
      expect(content).not.toContain('https://cdn.example.com');
      expect(content).not.toContain('<img');
      expect(warnings).toHaveLength(1);
    });

    it('aggregates a mixed set of images into one pluralized warning', () => {
      const { warnings } = convertObsidianMarkdown('![[a.png]]\n![b](./b.png)\n![c](https://x/c.png)');
      expect(warnings).toEqual(['3 images skipped — re-insert them with the image button.']);
    });

    it('returns no warnings for plain prose', () => {
      const { content, warnings } = convertObsidianMarkdown('just **bold** text');
      expect(content).toBe('just **bold** text');
      expect(warnings).toEqual([]);
    });
  });

  describe('extractTitleFromMarkdown', () => {
    it('extracts the first H1', () => {
      expect(extractTitleFromMarkdown('# My Title\n\nbody')).toBe('My Title');
    });

    it('returns null when there is no H1', () => {
      expect(extractTitleFromMarkdown('## only h2\n\nbody')).toBeNull();
      expect(extractTitleFromMarkdown('no heading here')).toBeNull();
    });

    it('ignores ## h2 and picks the H1 even if it appears later', () => {
      expect(extractTitleFromMarkdown('## intro\n\n# Real Title\n\nbody')).toBe('Real Title');
    });
  });

  describe('stripFirstH1', () => {
    it('removes the first H1 line and leaves the rest intact', () => {
      const out = stripFirstH1('# Title\n\n## Section\n\nbody');
      expect(out).not.toMatch(/^#\s+Title/m);
      expect(out).toContain('## Section');
      expect(out).toContain('body');
    });

    it('removes only the first H1, keeping a later H1', () => {
      const out = stripFirstH1('# First\n\n# Second\n');
      expect(out).toContain('# Second');
      expect(out).not.toMatch(/# First/);
    });

    it('is a no-op when there is no H1', () => {
      expect(stripFirstH1('## h2\n\nbody')).toBe('## h2\n\nbody');
    });
  });
});
