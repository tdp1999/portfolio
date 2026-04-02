# Post-Write Validation Checklist

Run this checklist after writing every test file. Each test must pass ALL checks to stay.

## Per-Test Checks

For EACH test in the file, answer these questions:

### 1. Waste Check
> "What breaks if I delete this test?"

- If answer is "nothing" -> DELETE
- If answer is "another test already catches it" -> DELETE
- If answer is "a specific business rule goes uncovered" -> KEEP

### 2. Logic Check
> "Does this test verify YOUR logic, or framework/language behavior?"

YOUR logic (KEEP):
- Business rule with conditions
- Custom transform or computation
- Factory defaults that are business decisions
- Orchestration branching (find -> validate -> save)
- Architectural invariant (immutability)

NOT your logic (DELETE):
- Zod validates max length, email format, enum values
- Prisma maps fields to database columns
- JavaScript spread operator preserves fields
- Getter returns stored property value
- Constructor assigns parameter to field

### 3. Owner Check
> "Is this behavior tested at another layer?"

- Same validation in both DTO spec and Command spec -> keep only in DTO
- Same domain rule in both Entity spec and Command spec -> keep in Entity (unless it needs repo)
- Same response shape in Mapper spec and E2E -> keep only in E2E
- If unclear, refer to the Cross-Layer Ownership table in `layer-rules.md`

### 4. Granularity Check
> "Can related assertions be consolidated?"

- "generates UUID" + "sets audit fields" + "applies defaults" in factory -> ONE test
- Testing nullable clearing for 8 fields separately -> ONE test with 2-3 representative fields
- Immutability test per mutation method -> ONE test proving the pattern
- Separate tests for "with value" and "without value" (optional field) -> usually ONE test

## File-Level Checks

### 5. Budget Check

Compare final test count against budget:

| Layer | CRUD module | Complex module |
|---|---|---|
| Entity | 5-10 | 15-25 |
| DTO | 6-10 | 10-15 |
| Commands (all) | 8-12 | 15-20 |
| Queries (all) | 3-5 | 5-10 |
| Mapper | 0-2 | 0-5 |

If significantly over budget, likely testing non-logic. Review each test against checks 1-3.

### 6. Anti-Pattern Scan

Flag and remove any test that matches these patterns:

```
- "should reconstitute from props" / "should load correctly"
  -> load() has no logic

- "should return copy of props" / "should return all fields"
  -> toProps() is trivial

- "should preserve unchanged fields when updating"
  -> tests JavaScript spread operator

- "should store X correctly when provided"
  -> tests field assignment

- "should accept all valid enum values"
  -> tests Zod enum

- "should reject value over N characters"
  -> tests Zod max (unless YOU added custom logic around it)

- "should coerce string to number"
  -> tests Zod coerce

- "should return X for getter"
  -> tests property access
```

### 7. Test Data Hygiene

- Fixtures include ONLY fields relevant to the test, not 30-field copy-paste objects
- UUID constants are used for referential fields (not random strings)
- Test names describe the BEHAVIOR, not the implementation ("should reject self as parent" not "should throw when parentId equals id")

## Validation Summary Format

After running the checklist, report:

```
Validation: [filename]
- Total tests: N
- Passed all checks: N
- Flagged for removal: N (list with reasons)
- Budget: [within/over] for [layer] in [module type]
- Clean: yes/no
```
