# Keyboard Shortcuts (Hotkeys)

Single reference for every keyboard shortcut in the system and the rules for adding
new ones. Read this before registering, changing, or removing any keydown handler.

## Registration models

The app has three ways a key ends up doing something. Know which one you are touching.

1. **Landing registry — `KeyboardShortcutService`** (`libs/landing/shared/ui/src/services/keyboard/`).
   The preferred model. Register a shortcut with a portable combo string, a
   description, and a category; the landing command palette then surfaces it
   automatically as an Action. The service is SSR-safe and already skips typing
   contexts via `isEditableTarget` (opt out with `allowInInput: true`).
2. **Console — per-handler.** There is **no** central hotkey service in the console
   yet. The one global console shortcut lives in the app shell
   (`SidebarProviderComponent`, a `document` keydown). Everything else is contextual
   and registered on its own component with `@HostListener`, gated on an
   `open()` / focus state. If console shortcuts grow, adopt the landing registry
   pattern (or promote it to `@portfolio/shared/ui`) rather than scattering more
   `document` listeners.
3. **Editor-owned (TipTap / ProseMirror).** The rich-text editor's extensions bind
   their own chords (`Mod-b` bold, `Mod-i` italic, `Mod-u` underline, `Mod-z` undo,
   etc.) directly on the `contenteditable` element. These are not our code; they are
   provided by the enabled extensions and always win while the caret is in the editor.

### `Mod` = Cmd on macOS, Ctrl elsewhere

Never hardcode `metaKey` only. Use `metaKey || ctrlKey` in raw handlers, or the
`mod+` prefix in the landing combo syntax. The editor's `Mod-` maps the same way.

### The typing guard: `isEditableTarget`

`isEditableTarget(target)` from `@portfolio/shared/ui` is the single source of truth
for "is the user typing?" (matches `<input>` / `<textarea>` / `<select>` /
`contenteditable`, inherited so it also matches nodes inside a ProseMirror region).
Any global shortcut must yield when it returns true. Do not re-implement this check
inline; import the shared one.

## Rules

1. **Guard typing context.** Any `document` / `window`-level shortcut MUST bail when
   `isEditableTarget(event.target)` is true, unless it is deliberately meant to fire
   while typing. `Escape` to close the topmost overlay is the accepted exception.
2. **Do not overload editor-reserved chords.** `Mod+B/I/U`, `Mod+Z`, and friends
   belong to the focused editor. Reuse one for a global action only with a typing
   guard (as the sidebar `Mod+B` does), or pick a distinct chord (add `shift`).
   When focus is in an editor, the editor wins; the global handler yields.
3. **`preventDefault` only after you commit to handling the key.** Call it past the
   guards, never before, so you do not swallow browser or editor defaults.
4. **Register at the right scope.** Global -> app shell or the landing registry.
   Contextual (overlay / dialog / grid / drawer) -> the owning component via
   `@HostListener`, gated on its `open()` / `isOpen()` / focus signal. Do not put a
   contextual key on `document` without such a gate.
5. **SSR-safe.** Wrap any `document` / `window` listener in `isPlatformBrowser` (or
   register from a browser-only lifecycle). The landing registry already does this.
6. **One binding, one meaning per active scope.** Before adding a chord, check the
   tables below for a conflict. If two scopes want the same chord, the more-focused
   scope wins (yield to focus). Prefer a different chord over a subtle override.
7. **Prefer the landing registry on landing.** Registering via
   `KeyboardShortcutService` gives you command-palette discoverability and the typing
   guard for free. Pass `allowInInput: true` only when the shortcut must fire while
   typing.
8. **Discoverability.** Where practical, expose the chord in the UI (command palette,
   a `⌘K` hint, a tooltip). `Escape` should always close the topmost layer.
9. **Keep this doc current.** Document every new binding here in the same change. This
   is a living reference, not a changelog: no dates, no "added in" notes.

## Inventory

### Global (whole app shell)

| Chord | Action | Registered in | Typing guard |
|---|---|---|---|
| `Mod + B` | Toggle sidebar (expand / collapse) | `SidebarProviderComponent` · `libs/shared/ui` | Yes |
| `Escape` | Close sidebar (mobile only, when open) | `SidebarComponent` · `libs/shared/ui` | n/a |

### Console — contextual (only while the component is open / focused)

| Chord | Action | Component · lib | Active when |
|---|---|---|---|
| `Escape` | Close QuickLook | `quick-look` · `console/shared/ui` | overlay open |
| `Space` | Close QuickLook | `quick-look` | overlay open · skips typing |
| `← / →` | Previous / next item | `quick-look` | overlay open · skips typing |
| `← → ↑ ↓` | Move selection | `asset-grid` · `console/shared/ui` | grid focused |
| `Home / End` | First / last cell | `asset-grid` | grid focused |
| `Space` | Select cell | `asset-grid` | grid focused |
| `Enter` | Open / confirm cell | `asset-grid` | grid focused |
| `Escape` | Close media picker dialog | `media-picker-dialog` · `console/shared/ui` | dialog open |
| `Escape` | Close media drawer | `media.drawer` · `console/feature-media` | an item is selected |

Console has no `Mod+K` / `/` search shortcut yet, even though the topbar has a
"Search resources..." field. If you add one, guard it with `isEditableTarget`.

### Landing — registry (`KeyboardShortcutService`, surfaced in the command palette)

| Chord | Action | Registered in |
|---|---|---|
| `Mod + K` | Open command palette | `command-palette` · `landing/shared/ui` |
| `Mod + Shift + L` | Toggle theme | `shell` · `landing/shared/ui` |
| `Mod + Shift + H` | Go to Home | `shell` |
| `Mod + Shift + P` | Go to Projects | `shell` |
| `Mod + Shift + D` | Go to DDL (design sandbox) | `shell` |

### Landing — contextual

| Chord | Action | Component · lib | Active when |
|---|---|---|---|
| `↑ / ↓` | Navigate results | `command-palette` · `landing/shared/ui` | palette open |
| `Enter` | Activate highlighted action | `command-palette` | palette open |
| `Escape` | Close palette | `command-palette` | palette open |
| `← / →` | Previous / next image | `lightbox-overlay` · `landing/shared/ui` | lightbox open |
| `Escape` | Close lightbox | `lightbox-overlay` | lightbox open |
| `Mod / Ctrl + wheel` | Zoom image | `lightbox-overlay` | lightbox open |
| `Escape` | Close the expanded evidence pane | `document-engine` · `apps/landing` page | pane expanded |

### Editor-owned (TipTap, only while the caret is in the rich-text editor)

Provided by the enabled extensions, not by our code. These always win over global
shortcuts while the editor has focus (which is why the global `Mod+B` yields).

| Chord | Action |
|---|---|
| `Mod + B` | Bold |
| `Mod + I` | Italic |
| `Mod + U` | Underline |
| `Mod + Z` / `Mod + Shift + Z` | Undo / redo |

## Adding a new hotkey — checklist

- [ ] Pick a chord with no conflict in the tables above (respect editor-owned chords).
- [ ] Landing? Register via `KeyboardShortcutService` (description + category). Console
      global? Add to the shell. Contextual? `@HostListener` on the owning component,
      gated on its open/focus state.
- [ ] Guard with `isEditableTarget(event.target)` unless it must fire while typing.
- [ ] `preventDefault` only after the guards pass.
- [ ] SSR-safe (`isPlatformBrowser`) for any `document` / `window` listener.
- [ ] Add the binding to the correct table in this doc, in the same change.
