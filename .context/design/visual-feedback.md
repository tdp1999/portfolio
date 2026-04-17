# Visual Feedback Workflow

> Screenshot any page in the project to catch layout/spacing issues before reporting done.
> Uses the Chrome DevTools MCP (`--slim` mode): `navigate`, `evaluate`, `screenshot`.

## Prerequisites

- Relevant dev server running (see ports below)
- Chrome DevTools MCP connected — check with `/mcp` if tools are missing

## App Ports

| App | Command | Port | Auth required |
|---|---|---|---|
| Console | `pnpm nx serve console` | 4300 | Yes (admin) |
| Landing | `pnpm nx serve landing` | 4200 | No |

---

## Workflow

### No-Auth Pages (Landing)

```
1. mcp__chrome-devtools__navigate  →  http://localhost:4200/<path>
2. mcp__chrome-devtools__screenshot
3. Read the returned file path
```

### Console Pages (requires login)

**Step 1 — Navigate to login**
```
mcp__chrome-devtools__navigate  →  http://localhost:4300/auth/login
```
If already logged in, app redirects to dashboard — skip to Step 3.

**Step 2 — Submit credentials**
```js
// mcp__chrome-devtools__evaluate (use IIFE to avoid variable re-declaration errors)
(function() {
  var e = document.querySelector('input[type="email"]');
  var p = document.querySelector('input[type="password"]');
  e.value = 'hello@thunderphong.com';
  e.dispatchEvent(new Event('input', {bubbles:true}));
  e.dispatchEvent(new Event('change', {bubbles:true}));
  p.value = '100100100pPp@';
  p.dispatchEvent(new Event('input', {bubbles:true}));
  p.dispatchEvent(new Event('change', {bubbles:true}));
  document.querySelector('button[type="submit"]').click();
})()
```

**Step 3 — Navigate to target page**
```js
// mcp__chrome-devtools__evaluate
window.location.href = 'http://localhost:4300/<path>'
// e.g. /profile, /experiences, /projects, /admin/blog
```

**Step 4 — Screenshot**
```
mcp__chrome-devtools__screenshot
```
Then `Read` the returned temp file path to view the image.

---

## When to Screenshot

| Trigger | Required? |
|---|---|
| New component or layout structure added | Yes |
| Spacing / gap / padding change | Yes |
| Typography class change | Yes |
| Pure logic change (`.ts` only, no `.html`/`.scss`) | No |
| Single-line utility class you can predict visually | No |

**Rule:** if reading the diff wouldn't catch the mistake, screenshot it.

---

## Console Page Checklist (after screenshot)

Check against `console-cookbook.md`:

- [ ] Section card titles: `.text-section-heading` (18px semibold) — not too small
- [ ] Description text visibly lighter than primary (secondary color, not muted)
- [ ] Gap between section cards clearly larger than gap between fields inside a card
- [ ] No content hugging card edge — 24px padding visible all sides
- [ ] Scrollspy rail labels readable (14px, not 10–12px)
- [ ] No cramped field stacks — `gap-4` minimum between `mat-form-field` elements

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| MCP tools not in deferred list | Run `/mcp` → reconnect `chrome-devtools` |
| Navigate redirects back to dashboard | Session active — skip login, go to Step 3 |
| `Identifier already declared` JS error | Use IIFE: `(function(){ ... })()` |
| Screenshot shows blank or loading spinner | Wait 1–2s, then screenshot again |
| Dev server not running | Run `pnpm nx serve <app>` in project root |
