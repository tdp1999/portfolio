# Angular Style Guide (v21+)

Modern Angular syntax standards for this project. All code must follow these patterns.

---

## 1. Signal-Based APIs

### Inputs & Outputs

```typescript
name = input.required<string>();
variant = input<'primary' | 'secondary'>('primary');
clicked = output<void>();
value = model<string>(''); // Two-way binding
```

**Never use:** `@Input()`, `@Output()`, `EventEmitter`

### Queries

```typescript
submitButton = viewChild.required<ElementRef>('submitBtn');
listItems = viewChildren<ElementRef>('item');
contentHeader = contentChild<HeaderComponent>(HeaderComponent);
contentItems = contentChildren<ItemComponent>(ItemComponent);
```

**Never use:** `@ViewChild`, `@ViewChildren`, `@ContentChild`, `@ContentChildren`, `QueryList`

### Computed & Effects

```typescript
fullName = computed(() => `${this.firstName()} ${this.lastName()}`);

constructor() {
  effect(() => console.log('User changed:', this.userId()));
}
```

`effect()` must run in an injection context (constructor, class field initializer, or provider factory). **Convention in this codebase: constructor.** Field initializer is technically valid but not used here — keep effects in the constructor for consistency.

### linkedSignal (stable v21)

Derived state that remains writable:

```typescript
options = signal(['A', 'B', 'C']);
selectedOption = linkedSignal(() => this.options()[0]); // Resets when options change, but writable
```

### resource (experimental)

```typescript
userId = signal(1);
userResource = resource({
  request: () => ({ id: this.userId() }),
  loader: ({ request }) => fetch(`/api/users/${request.id}`).then((r) => r.json()),
});
// Template: userResource.value(), userResource.isLoading(), userResource.error()
```

### httpResource (experimental)

```typescript
import { httpResource } from '@angular/common/http';

users = httpResource<User[]>('/api/users');
user = httpResource<User>(() => `/api/users/${this.userId()}`);

// With Zod parse
user = httpResource(() => `/api/users/${this.id()}`, { parse: UserSchema.parse });

// Variants: httpResource.text(), httpResource.blob(), httpResource.arrayBuffer()
```

**Use for reads only.** For mutations (POST/PUT/DELETE), use `HttpClient` directly.
Signals: `value()`, `hasValue()`, `error()`, `isLoading()`

---

## 2. Built-In Control Flow

```html
@if (isLoading()) {
  <app-spinner />
} @else if (error()) {
  <app-error [message]="error()" />
} @else {
  <app-content [data]="data()" />
}

@for (item of items(); track item.id) {
  <app-item [data]="item" />
} @empty {
  <p>No items found</p>
}

@switch (status()) {
  @case ('loading') { <app-spinner /> }
  @case ('error') { <app-error /> }
  @default { <p>Unknown</p> }
}
```

**Never use:** `*ngIf`, `*ngFor`, `*ngSwitch` (deprecated in v21)

### Template Variables (@let)

```html
@let fullName = firstName() + ' ' + lastName();
<h1>{{ fullName }}</h1>

@let user = userSignal();
@if (user) {
  <p>{{ user.name }} - {{ user.email }}</p>
}
```

**Use when:** Avoiding repeated expressions or storing intermediate values. Cannot be reassigned, scoped to current view.

---

## 3. Deferred Loading

```html
@defer (on viewport) {
  <analytics-widget />
} @placeholder {
  <p>Loading...</p>
} @loading (minimum 1s) {
  <app-spinner />
} @error {
  <p>Failed to load</p>
}
```

**Triggers:** `idle` (default), `viewport`, `interaction`, `hover`, `immediate`, `timer(ms)`, `when condition`
**Tips:** Use for large components below the fold. Deferred components must be standalone. Add `prefetch` for better UX.

---

## 4. Image Optimization

```html
<img ngSrc="hero.jpg" width="1200" height="600" priority alt="Hero" />
<img ngSrc="product.jpg" width="800" height="600"
  sizes="(max-width: 768px) 100vw, 50vw" alt="Product" />
<img ngSrc="bg.jpg" fill alt="Background" /> <!-- parent must be positioned -->
```

Import `NgOptimizedImage` from `@angular/common`. Auto `srcset`, lazy by default, prevents layout shifts.
**Never use:** Raw `<img src="...">` for content images.

---

## 5. Signal Forms (experimental)

```typescript
import { form, FormField, required, email } from '@angular/forms/signals';

@Component({ imports: [FormField] })
export class SignupComponent {
  name = signal('');
  emailAddr = signal('');

  userForm = form({
    name: [this.name, [required()]],
    email: [this.emailAddr, [required(), email()]],
  });

  onSubmit() {
    if (this.userForm.valid()) {
      console.log(this.userForm.value());
    }
  }
}
```

```html
<input [formField]="userForm.controls.name" />
```

Field state signals: `value()`, `valid()`, `touched()`, `dirty()`, `errors()`
**Status:** Experimental. Use reactive forms for production stability.

---

## 6. Dependency Injection

```typescript
export class UserService {
  private http = inject(HttpClient);
  private router = inject(Router);
}

// Functional guards
export const authGuard = () => inject(AuthService).isAuthenticated();
```

**Never use:** Constructor injection for new code.

---

## 7. Zoneless Change Detection (stable, default v21)

Zoneless is the default in Angular v21. No provider needed for new apps.

```typescript
// Only needed to opt BACK into zones:
providers: [provideZoneChangeDetection()]

// To explicitly enable zoneless (e.g., migrating existing app):
providers: [provideZonelessChangeDetection()]
```

**Requirements:** Use signals for reactive state. Use `async` pipe or signal-based state management. Test with `await fixture.whenStable()`.

**Note:** `provideExperimentalZonelessChangeDetection()` is obsolete — use `provideZonelessChangeDetection()`.

---

## 8. Reactive Forms — Typed Access

### Direct control access (no `.get()`)

Access form controls via `.controls` property — typed, no optional chaining needed:

```typescript
// BAD — untyped, requires optional chaining
form.get('email')?.hasError('required')
form.get('email')?.value

// GOOD — typed, IDE autocomplete works
form.controls.email.hasError('required')
form.controls.email.value
```

### Template patterns with @let

```html
@let emailCtrl = form.controls.email;
@if (emailCtrl.hasError('required') && emailCtrl.touched) {
  <mat-error>Required</mat-error>
}
@if (emailCtrl.hasError('email') && emailCtrl.touched) {
  <mat-error>Invalid email</mat-error>
}
```

### Template data access — avoid getters

Access component fields directly in the template. Never wrap in a getter.

```
BAD:  get metaTitleLength() { return this.form.controls.metaTitle.value?.length ?? 0; }
GOOD: {{ form.controls.metaTitle.value?.length ?? 0 }}
```

Getters OK only for expensive computations. For reactive derived values, use `computed()`.

---

## 9. Template Best Practices

```html
<!-- Self-closing tags -->
<app-header />
<input type="text" [value]="name()" />

<!-- Direct class/style bindings -->
<div [class.active]="isActive()" [style.font-size.px]="fontSize()">...</div>
```

**Never use:** `NgClass`, `NgStyle` (deprecated in v21)

---

## 10. Component Structure

```typescript
@Component({
  selector: 'app-button',
  standalone: true,
  imports: [/* minimal */],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  private analytics = inject(AnalyticsService);

  variant = input<'primary' | 'secondary'>('primary');
  disabled = input<boolean>(false);
  clicked = output<void>();

  buttonClass = computed(() => `btn-${this.variant()}`);

  handleClick() {
    if (!this.disabled()) {
      this.analytics.track('button_click');
      this.clicked.emit();
    }
  }
}
```

**Always:** Standalone components. **Avoid:** `CommonModule` imports.

---

## 11. Advanced Composition

### Host Directives

```typescript
@Component({
  hostDirectives: [
    HasColor,
    { directive: Tooltipable, inputs: ['tooltip: menuTooltip'] },
  ],
})
export class MenuComponent {}
```

### Router Input Binding

```typescript
{ path: 'user/:id', component: UserComponent }

// Component — automatic binding
export class UserComponent {
  id = input.required<string>(); // Bound from route param
}
```

Enable with `withComponentInputBinding()` in router providers.

---

## 12. SSR & Hydration (stable)

```typescript
import { provideClientHydration, withIncrementalHydration } from '@angular/platform-browser';

providers: [
  provideClientHydration(withIncrementalHydration()),
  // provideStabilityDebugging() — for diagnosing hydration issues
]
```

- **Full hydration:** stable (v16+)
- **Incremental hydration:** stable (v20+) — lazy-hydrates deferred blocks
- **Event replay:** automatically enabled with incremental hydration
- Use `afterNextRender()` for browser-only code. Avoid DOM manipulation in constructors.

---

## 13. Guardrails

Rules that must be followed in all Angular template and component code.

| Rule | Do | Don't |
|------|----|-------|
| **No non-null assertions** | Fix the type or add a guard | `obj!.prop` |
| **No `!important` in Tailwind** | Use `.icon-*` for Material icon sizing | `!h-5 !w-5` |
| **Material density: even only** | `density: -2` | `density: -1` (breaks 4px grid) |
| **Direct form access** | `form.controls.email.hasError(...)` | `form.get('email')?.hasError(...)` |
| **No getters for templates** | Direct access or `computed()` | `get prop() { return ... }` |
| **Self-closing tags** | `<app-header />` | `<app-header></app-header>` |
| **No nested subscribes** | Chain with `switchMap`/`concatMap`/`mergeMap` + `map` | `obs1.subscribe(() => obs2.subscribe(...))` |

### RxJS: Chaining dependent HTTP calls

When one HTTP call depends on the result of another, use `switchMap` to flatten into one pipeline. Never subscribe inside a subscribe callback.

```typescript
// BAD — nested subscribe, inner not covered by outer takeUntilDestroyed
this.uploadMedia(file).subscribe((id) => {
  this.updateRecord(id).subscribe(({ url }) => { ... });
});

// GOOD — single pipeline, one subscribe, one error handler
this.uploadMedia(file)
  .pipe(
    takeUntilDestroyed(this.destroyRef),
    switchMap((id) => this.updateRecord(id).pipe(map((res) => ({ id, ...res })))),
  )
  .subscribe({
    next: ({ id, url }) => { ... },
    error: () => { ... },
  });
```

**Operator choice:** `switchMap` for HTTP mutations (cancels in-flight if re-triggered), `concatMap` for ordered queues, `mergeMap` for parallel.

---

## 14. Test Configuration

### tsconfig.spec.json for Angular libs

Angular libs must use `bundler` module resolution in `tsconfig.spec.json`:

```json
{
  "compilerOptions": {
    "module": "es2015",
    "moduleResolution": "bundler"
  }
}
```

**Why:** Nx generator defaults to `node10` which cannot resolve Angular's package exports.
**Scope:** Angular/frontend libs only. Backend and pure shared libs can keep `node10`.

---

## 15. Accessibility & E2E Testability

### Icon Buttons — Always add `aria-label`

```html
<!-- GOOD -->
<button mat-icon-button aria-label="Delete" matTooltip="Delete">
  <mat-icon>delete</mat-icon>
</button>
```

Every interactive element must have an accessible name via `aria-label`, `<mat-label>`, or visible text.

### Error Messages — Use `role="alert"`

Use `<console-error-message>` component (renders `role="alert"`) instead of raw `<p class="text-red-500">`.

### State Indicators

| State | Pattern | E2E selector |
|-------|---------|-------------|
| Loading | `aria-busy="true"` on container | `locator('[aria-busy="true"]')` |
| Empty | Visible descriptive text | `getByText('No items found')` |
| Error | `role="alert"` or `<console-error-message>` | `getByRole('alert')` |

### `data-testid` Policy

Use as escape hatch when semantic selectors are insufficient (looped items, custom components with no ARIA role). Prefer `getByRole`, `getByLabel`, `getByText` first.

---

## Quick Reference

### Signal APIs

| Old | New (v17+) |
|-----|------------|
| `@Input() name: T` | `name = input<T>()` |
| `@Output() evt = new EventEmitter<T>()` | `evt = output<T>()` |
| `@Input()/@Output()` pair | `value = model<T>()` |
| `@ViewChild('ref')` | `ref = viewChild<T>('ref')` |
| Writable derived signal | `linkedSignal(() => source())` (stable v21) |

### Template Syntax

| Old | New |
|-----|-----|
| `*ngIf="cond"` | `@if (cond) {}` |
| `*ngFor="let x of items"` | `@for (x of items; track x.id) {}` |
| `[ngSwitch]` + `*ngSwitchCase` | `@switch (val) { @case (x) {} }` |
| Repeated expressions | `@let name = expr` |
| `<img src="...">` | `<img ngSrc="..." width height>` |

### Architecture

| Feature | Status |
|---------|--------|
| Standalone components | Default (NgModule deprecated) |
| Zoneless change detection | Stable, default in v21 |
| linkedSignal | Stable in v21 |
| resource() / httpResource() | Experimental |
| Signal Forms | Experimental |
| Incremental hydration | Stable (v20+) |
