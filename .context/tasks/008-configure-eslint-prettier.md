# Task: Configure ESLint and Prettier

## Status: pending

## Goal
Set up consistent ESLint and Prettier configuration across the entire workspace.

## Context
Consistent code style and linting helps maintain quality. Nx provides default ESLint config, but we need to ensure Prettier is integrated and rules are consistent across all apps and libs.

## Acceptance Criteria
- [ ] ESLint configured at workspace root
- [ ] Prettier configured at workspace root
- [ ] `nx lint` works for all projects
- [ ] `nx format:check` works for entire workspace
- [ ] `nx format:write` formats all files
- [ ] ESLint and Prettier don't conflict

## Technical Notes
Nx should have ESLint configured by default. Add Prettier:

```bash
pnpm add -D prettier eslint-config-prettier
```

Create `.prettierrc`:
```json
{
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "semi": true,
  "printWidth": 100
}
```

Create `.prettierignore`:
```
dist
node_modules
.nx
```

Update ESLint to extend prettier config to avoid conflicts.

## Files to Touch
- .eslintrc.json (update)
- .prettierrc (create)
- .prettierignore (create)

## Dependencies
- 001-init-nx-workspace
- 002-generate-angular-landing
- 003-generate-nestjs-api

## Complexity: S
