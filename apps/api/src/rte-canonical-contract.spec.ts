import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * RTE field column contract (ADR-023). Every rich-text field in `schema.prisma`
 * MUST carry the full four-column set — `<field>Json`, `<field>Html`,
 * `<field>SchemaVersion`, `<field>Canonical` — with no exceptions.
 *
 * A rich-text field group is identified by its `<field>SchemaVersion` column
 * (only RTE fields have one). For each, this test asserts the three sibling
 * columns exist as JSONB. It exists so a NEW field that moves from plain text to
 * RTE cannot silently ship without `<field>Canonical` (the AST renderer's read
 * source) — the omission that caused profile.bioLong + experience + technical-
 * highlight to render nothing on the AST path (task 312 investigation).
 *
 * If you add an RTE field: add all four columns, wire `<field>Canonical:
 * rich.canonical` in the entity, add it to `backfill-canonical.ts`, and this
 * test passes. If it fails, you dropped one of the four.
 */
describe('RTE field column contract (ADR-023)', () => {
  const schema = readFileSync(join(__dirname, '../prisma/schema.prisma'), 'utf8');

  // Base names of every rich-text field: the token before `SchemaVersion`.
  const rteFields = [...schema.matchAll(/(\w+?)SchemaVersion\s+Int/g)].map((m) => m[1]);

  it('finds the known rich-text fields (guards the detector itself)', () => {
    // Sanity check: if this drops to a tiny number the SchemaVersion detector broke.
    expect(rteFields).toEqual(
      expect.arrayContaining([
        'bioLong',
        'description',
        'responsibilities',
        'highlights',
        'body',
        'challenge',
        'approach',
        'outcome',
        'content',
      ])
    );
  });

  it.each([...new Set(rteFields)])(
    'field "%s" carries Json + Html + SchemaVersion + Canonical (all JSONB)',
    (field) => {
      const jsonb = (col: string) => new RegExp(`\\b${field}${col}\\s+Json\\??\\s+@db\\.JsonB`);
      expect(schema).toMatch(jsonb('Json'));
      expect(schema).toMatch(jsonb('Html'));
      expect(schema).toMatch(new RegExp(`\\b${field}SchemaVersion\\s+Int`));
      // The load-bearing assertion: no RTE field may omit its canonical column.
      expect(schema).toMatch(jsonb('Canonical'));
    }
  );
});

/**
 * RTE read-surface contract (task 363, extends ADR-023). The canonical
 * `PortableDocument` is the AST renderer's read source, so every public
 * presenter that ships a rich-text field MUST also ship its `<field>Canonical`
 * sibling — otherwise a consumer (e.g. landing) has no canonical to render and
 * silently falls back to legacy/HTML. Enforced structurally: in every
 * `*.presenter.ts`, any emitted `<name>Json` key must have a `<name>Canonical`
 * key in the same file. (`bioLongJson` etc. — the token before `Json`.)
 */
describe('RTE presenter canonical contract (task 363)', () => {
  const modulesDir = join(__dirname, 'modules');
  const schemaSrc = readFileSync(join(__dirname, '../prisma/schema.prisma'), 'utf8');
  // Known rich-text field base names (the token before `SchemaVersion` in schema).
  const rteFieldNames = new Set([...schemaSrc.matchAll(/(\w+?)SchemaVersion\s+Int/g)].map((m) => m[1]));

  function findPresenters(dir: string): string[] {
    const out: string[] = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) out.push(...findPresenters(full));
      else if (entry.name.endsWith('.presenter.ts') && !entry.name.endsWith('.spec.ts')) out.push(full);
    }
    return out;
  }

  const presenters = findPresenters(modulesDir);

  it('finds presenter files (guards the detector itself)', () => {
    expect(presenters.length).toBeGreaterThan(0);
  });

  it.each(presenters.map((p) => [p.slice(modulesDir.length + 1), p] as const))(
    'presenter "%s" emits <field>Canonical for every rich-text <field>Json it exposes',
    (_label, path) => {
      const src = readFileSync(path, 'utf8');
      // Only known rich-text fields (from schema) that this presenter actually emits as `<field>Json`.
      const emitted = [...new Set([...src.matchAll(/\b(\w+?)Json\b/g)].map((m) => m[1]))].filter((name) =>
        rteFieldNames.has(name)
      );
      for (const field of emitted) {
        expect(src).toMatch(new RegExp(`\\b${field}Canonical\\b`));
      }
    }
  );
});
