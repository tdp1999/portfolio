# Task: Invert service deps in shared/ui (main-layout + media-picker-dialog)

## Status: pending

## Goal
Make `main-layout` and `media-picker-dialog` purely presentational so the strict `type:shared-ui` ESLint boundary (no import from `type:shared-data-access`) can be re-enabled.

## Context
During the shared-libs cleanup (PRs 1–4, April 2026), ESLint `@nx/enforce-module-boundaries` was tightened for console. The rule `type:shared-ui → notDependOn type:shared-data-access` had to be relaxed because two components genuinely inject services:

1. **`main-layout.ts`** — console shell, injects `AuthStore`, `ThemeService`, `UnreadBadgeService`.
2. **`media-picker-dialog.ts`** — dialog that fetches/uploads via `MediaService`.

Relaxing the rule lets future drift slip in. The structurally clean fix (option 1) is to invert the dependency: components become dumb, callers provide the data.

See `.context/patterns-architecture.md` → "Console Shared-Lib Taxonomy" for the intended role of `shared/ui`.

## Acceptance Criteria
- [ ] `main-layout` accepts `user` (signal input `UserProfile | null`), `theme` / `resolvedTheme`, `unreadCount` as inputs; no service injection inside the component
- [ ] `main-layout` emits `logout`, `themeChange`, and any other side-effect events via `output()`
- [ ] `apps/console/src/app/app.ts` (or a thin wrapper in the app) injects `AuthStore`, `ThemeService`, `UnreadBadgeService` and binds them to `main-layout`
- [ ] `main-layout.spec.ts` no longer needs `API_CONFIG`/`AuthStore` fixtures — tests drive inputs directly
- [ ] `MediaPickerDataSource` interface defined in `media-picker-dialog.types.ts` with at least: `list(params: MediaListParams): Observable<MediaListResponse>`, `upload(file: File): Observable<{ id: string }>`, `getById(id: string): Observable<MediaItem>`
- [ ] `MediaPickerDialogComponent` reads the data source from `MAT_DIALOG_DATA` (extend `MediaPickerDialogData`) and no longer injects `MediaService`
- [ ] All 3 callers (`feature-blog/post-editor-page`, `feature-project/project-dialog`, any others found by grep of `MediaPickerDialogComponent`) inject `MediaService` themselves and pass an adapter in the dialog open call
- [ ] `eslint.config.mjs` rule for `type:shared-ui` updated to: `notDependOnLibsWithTags: ['type:shared-data-access', 'type:feature']`
- [ ] `pnpm nx affected -t lint` passes
- [ ] `npx tsc --noEmit -p apps/console/tsconfig.app.json` passes
- [ ] Smoke-test: login → verify user name + avatar in main-layout; toggle theme; check unread badge; open media picker from blog editor and project dialog (and any other caller); upload and select files

## Technical Notes

### Main-layout refactor sketch
```ts
// libs/console/shared/ui/src/lib/main-layout/main-layout.ts
readonly user = input.required<UserProfile | null>();
readonly resolvedTheme = input.required<'light' | 'dark'>();
readonly unreadCount = input<number>(0);
readonly logout = output<void>();
readonly themeToggle = output<void>();
```

Caller (app.ts or a small wrapper component):
```ts
@Component({
  template: `<console-main-layout
    [user]="authStore.user()"
    [resolvedTheme]="themeService.resolvedTheme()"
    [unreadCount]="unread.count()"
    (logout)="authStore.logout()"
    (themeToggle)="themeService.toggle()"
  />`,
})
```

### MediaPickerDataSource sketch
```ts
// libs/console/shared/ui/src/lib/media-picker-dialog/media-picker-dialog.types.ts
export interface MediaPickerDataSource {
  list(params: MediaListParams): Observable<MediaListResponse>;
  upload(file: File): Observable<{ id: string }>;
  getById(id: string): Observable<MediaItem>;
}

export interface MediaPickerDialogData {
  mode: 'single' | 'multi';
  selectedIds?: string[];
  folders?: readonly UploadFolder[];
  dataSource: MediaPickerDataSource;  // NEW — required
}
```

Caller (example — feature-blog/post-editor-page.ts):
```ts
private readonly mediaService = inject(MediaService);

openPicker() {
  this.dialog.open(MediaPickerDialogComponent, {
    data: {
      mode: 'single',
      dataSource: {
        list: (p) => this.mediaService.list(p),
        upload: (f) => this.mediaService.upload(f),
        getById: (id) => this.mediaService.getById(id),
      },
    } satisfies MediaPickerDialogData,
  });
}
```

### Gotchas
- `main-layout` may inline logout navigation / theme persistence side-effects today — confirm all of them move up into the caller, not silently disappear
- `MediaPickerDialogData` currently has optional fields; adding a required `dataSource` is a breaking change for all callers simultaneously — do in one commit
- Check if any e2e tests or specs stub `MediaService` — they'll need updating or may become simpler
- `UnreadBadgeService` has its own state; bind via signal not snapshot

## Files to Touch
- `libs/console/shared/ui/src/lib/main-layout/main-layout.ts`
- `libs/console/shared/ui/src/lib/main-layout/main-layout.html`
- `libs/console/shared/ui/src/lib/main-layout/main-layout.spec.ts`
- `apps/console/src/app/app.ts` (or a new small wrapper component)
- `libs/console/shared/ui/src/lib/media-picker-dialog/media-picker-dialog.ts`
- `libs/console/shared/ui/src/lib/media-picker-dialog/media-picker-dialog.types.ts`
- `libs/console/feature-blog/src/lib/post-editor-page/post-editor-page.ts`
- `libs/console/feature-project/src/lib/project-dialog/project-dialog.ts`
- (plus any other consumer found by `grep MediaPickerDialogComponent`)
- `eslint.config.mjs` (restore strict rule)
- `.context/patterns-architecture.md` (update dep-rule list if rule wording changes)

## Dependencies
None. Follows completion of the shared-libs cleanup (PRs 1–4) merged April 2026.

## Complexity: L

**Reasoning:** Two distinct refactors touching ~10 files with real API-shape changes (dialog data contract, layout inputs/outputs). Each caller must be updated together since the dialog's `MediaPickerDialogData` becomes breaking. Test updates non-trivial. Not risky (mechanical + well-scoped) but sizeable.

## Progress Log
