# @nx/angular:library Generator Options

Full reference for Nx Angular library generator.

## Core Options

| Option       | Type   | Default  | Description                         |
| ------------ | ------ | -------- | ----------------------------------- |
| `name`       | string | required | Library name                        |
| `directory`  | string | —        | Directory path for library location |
| `tags`       | string | —        | Comma-separated tags for linting    |
| `prefix`     | string | —        | Selector prefix for components      |
| `importPath` | string | —        | Import path like `@myorg/my-lib`    |

## Component Options

| Option            | Type    | Default   | Description                                               |
| ----------------- | ------- | --------- | --------------------------------------------------------- |
| `standalone`      | boolean | `true`    | Use standalone component as entry point                   |
| `style`           | string  | `css`     | Style preprocessor: `css`, `scss`, `sass`, `less`, `none` |
| `changeDetection` | string  | `Default` | Change detection strategy                                 |
| `skipSelector`    | boolean | `false`   | Skip selector generation                                  |

## Build Options

| Option        | Type    | Default | Description                  |
| ------------- | ------- | ------- | ---------------------------- |
| `buildable`   | boolean | `false` | Generate buildable library   |
| `publishable` | boolean | `false` | Generate publishable library |
| `skipModule`  | boolean | `false` | Skip default module creation |

## Testing Options

| Option           | Type   | Default  | Description                 |
| ---------------- | ------ | -------- | --------------------------- |
| `unitTestRunner` | string | `jest`   | Test runner: `jest`, `none` |
| `linter`         | string | `eslint` | Linter: `eslint`, `none`    |

## Project Defaults (nx.json)

```json
{
  "@nx/angular:library": {
    "linter": "eslint",
    "unitTestRunner": "jest"
  }
}
```

## Example Commands

### Minimal

```bash
nx g @nx/angular:library my-lib
```

### Full Options

```bash
nx g @nx/angular:library my-lib \
  --directory=libs/scope/my-lib \
  --importPath=@portfolio/scope/my-lib \
  --tags="scope:app,type:feature" \
  --prefix=app \
  --standalone \
  --style=scss \
  --changeDetection=OnPush
```

### Dry Run

```bash
nx g @nx/angular:library my-lib --dry-run
```
