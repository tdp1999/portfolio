# Angular Style Guide (v21+)

Modern Angular syntax standards for this project. All code must follow these patterns.

---

## 1. Signal-Based APIs

### Inputs & Outputs

```typescript
// Inputs
name = input.required<string>();
variant = input<'primary' | 'secondary'>('primary');

// Outputs
clicked = output<void>();
valueChanged = output<string>();

// Two-way binding
value = model<string>('');
selectedId = model.required<number>();
```

**Never use:** `@Input()`, `@Output()`, `EventEmitter`

### Queries

```typescript
// Single elements
submitButton = viewChild<ElementRef>('submitBtn');
submitButtonRequired = viewChild.required<ElementRef>('submitBtn');

// Multiple elements
listItems = viewChildren<ElementRef>('item');

// Content projection
contentHeader = contentChild<HeaderComponent>(HeaderComponent);
contentItems = contentChildren<ItemComponent>(ItemComponent);
```

**Never use:** `@ViewChild`, `@ViewChildren`, `@ContentChild`, `@ContentChildren`, `QueryList`

### Computed & Effects

```typescript
// Derived state
fullName = computed(() => `${this.firstName()} ${this.lastName()}`);

// Side effects only
constructor() {
  effect(() => {
    console.log('User changed:', this.userId());
  });
}
```

### Linked Signals (v19+)

For derived state that needs to remain writable:

```typescript
import { linkedSignal } from '@angular/core';

// Selection that resets when options change
options = signal(['A', 'B', 'C']);
selectedOption = linkedSignal(() => this.options()[0]); // Resets when options change

// Writable derived state
basePrice = signal(100);
adjustedPrice = linkedSignal({
  source: this.basePrice,
  computation: (base) => base * 1.1,
}); // Can be updated: adjustedPrice.set(150)
```

**Use when:** You need derived state that can be manually overridden but still tracks source changes.

### Resource API (v19, Experimental)

Async data handling with signals:

```typescript
import { resource } from '@angular/core';

// Basic resource
userId = signal(1);
userResource = resource({
  request: () => ({ id: this.userId() }),
  loader: ({ request }) => fetch(`/api/users/${request.id}`).then((r) => r.json()),
});

// Template usage: userResource.value(), userResource.isLoading(), userResource.error()
```

**Use when:** Loading async data that depends on signals. **Note:** Experimental API.

---

## 2. Built-In Control Flow

```html
<!-- Conditionals -->
@if (isLoading()) {
<app-spinner />
} @else if (error()) {
<app-error [message]="error()" />
} @else {
<app-content [data]="data()" />
}

<!-- Loops -->
@for (item of items(); track item.id) {
<app-item [data]="item" />
} @empty {
<p>No items found</p>
}

<!-- Switch -->
@switch (status()) { @case ('loading') { <app-spinner /> } @case ('error') { <app-error /> }
@default {
<p>Unknown</p>
} }
```

**Never use:** `*ngIf`, `*ngFor`, `*ngSwitch`, `*ngSwitchCase`, `*ngSwitchDefault`

### Template Variables (@let)

Declare local variables in templates (v18.1+):

```html
<!-- Store computed values -->
@let fullName = firstName() + ' ' + lastName();
<h1>{{ fullName }}</h1>
<p>Welcome, {{ fullName }}!</p>

<!-- Cache async results -->
@let user = userSignal(); @if (user) {
<p>{{ user.name }} - {{ user.email }}</p>
}

<!-- Complex expressions -->
@let isEligible = age() >= 18 && hasLicense(); @if (isEligible) {
<button>Apply Now</button>
}
```

**Use when:** Avoiding repeated expressions or storing intermediate values. **Note:** Cannot be reassigned, scoped to current view.

---

## 3. Deferred Loading

Lazy load components to improve initial load time:

```html
<!-- Basic defer -->
@defer {
<heavy-component />
} @placeholder {
<p>Loading...</p>
}

<!-- Viewport trigger -->
@defer (on viewport) {
<analytics-widget />
} @loading (minimum 1s) {
<app-spinner />
} @error {
<p>Failed to load</p>
}

<!-- Prefetch on idle -->
@defer (on interaction; prefetch on idle) {
<user-dashboard />
}
```

**Triggers:** `idle` (default), `viewport`, `interaction`, `hover`, `immediate`, `timer(ms)`, `when condition`

**Best practices:**

- Use for large components below the fold
- Deferred dependencies must be standalone
- Add `prefetch` for better UX
- Avoid nested cascading @defer blocks

---

## 4. Image Optimization

Use `NgOptimizedImage` for automatic performance optimization:

```typescript
// Component
import { NgOptimizedImage } from '@angular/common';
imports: [NgOptimizedImage];
```

```html
<!-- Basic usage -->
<img ngSrc="cat.jpg" width="400" height="200" alt="Cat" />

<!-- Priority for LCP images -->
<img ngSrc="hero.jpg" width="1200" height="600" priority alt="Hero" />

<!-- Fill mode (parent must be positioned) -->
<img ngSrc="bg.jpg" fill alt="Background" />

<!-- Responsive sizing -->
<img
  ngSrc="product.jpg"
  width="800"
  height="600"
  sizes="(max-width: 768px) 100vw, 50vw"
  alt="Product"
/>
```

**Features:**

- Automatic `srcset` generation
- Lazy loading by default (non-priority)
- Preconnect links for CDNs
- Prevents layout shifts

**Never use:** Regular `<img src="...">` for content images

---

## 5. Signal Forms (Experimental)

Type-safe forms with automatic synchronization:

```typescript
import { form, FormField, required, email } from '@angular/forms/signals';

// Component
@Component({
  imports: [FormField],
})
export class SignupComponent {
  userForm = form({
    name: ['', [required()]],
    email: ['', [required(), email()]],
  });

  onSubmit() {
    if (this.userForm.valid()) {
      console.log(this.userForm.value());
    }
  }
}
```

**Note:** Signal Forms are experimental. Use reactive forms for production stability.

---

## 6. Dependency Injection

### inject() Function

Modern DI pattern (v14+, enhanced v16):

```typescript
import { inject } from '@angular/core';

export class UserService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // Works in functions, guards, resolvers
  loadUser(id: string) {
    return this.http.get(`/api/users/${id}`);
  }
}

// Functional guards
export const authGuard = () => {
  const authService = inject(AuthService);
  return authService.isAuthenticated();
};

// Outside injection context (with injector)
const injector = inject(Injector);
runInInjectionContext(injector, () => {
  const service = inject(SomeService);
});
```

**Never use:** Constructor injection for new code (except in tests or when required).

---

## 7. Zoneless Change Detection (v18+, Default v21)

Remove zone.js for better performance (20-30% faster):

```typescript
// Bootstrap without zone.js
import { provideExperimentalZonelessChangeDetection } from '@angular/core';

bootstrapApplication(AppComponent, {
  providers: [provideExperimentalZonelessChangeDetection()],
});
```

**Requirements:**

- Use signals for all reactive state
- Use `async` pipe or signal-based state management
- Manual `ChangeDetectorRef.markForCheck()` for non-signal state
- Test thoroughly - some third-party libs may rely on zone.js

**Benefits:** Smaller bundle, faster rendering, cleaner stack traces.

---

## 8. Template Best Practices

```html
<!-- Self-closing tags -->
<app-header />
<input type="text" [value]="name()" />
<img ngSrc="logo.png" width="100" height="50" alt="Logo" />

<!-- Direct class/style bindings -->
<div [class.active]="isActive()" [class.disabled]="isDisabled()">...</div>
<div [style.color]="textColor()" [style.font-size.px]="fontSize()">...</div>
```

**Never use:** `NgClass`, `NgStyle`

---

## 9. Component Structure

```typescript
import { Component, input, output, computed, inject } from '@angular/core';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [
    /* minimal imports */
  ],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  // Dependency injection
  private analytics = inject(AnalyticsService);

  // Inputs
  variant = input<'primary' | 'secondary'>('primary');
  disabled = input<boolean>(false);

  // Outputs
  clicked = output<void>();

  // Computed
  buttonClass = computed(() => `btn-${this.variant()}`);

  handleClick() {
    if (!this.disabled()) {
      this.analytics.track('button_click');
      this.clicked.emit();
    }
  }
}
```

**Always:** Use standalone components. **Avoid:** `CommonModule` imports (rarely needed with built-in control flow).

---

## 10. Advanced Composition

### Host Directives (v16+)

Compose behaviors without inheritance:

```typescript
@Component({
  selector: 'app-menu',
  standalone: true,
  hostDirectives: [
    HasColor, // Apply directive behavior
    { directive: Tooltipable, inputs: ['tooltip: menuTooltip'] }, // Rename inputs
  ],
})
export class MenuComponent {}
```

**Use when:** Sharing cross-cutting concerns (logging, accessibility, validation) across components.

### Router Input Binding (v16+)

Bind route params directly to component inputs:

```typescript
// Route config
{ path: 'user/:id', component: UserComponent }

// Component - automatic binding
export class UserComponent {
  id = input.required<string>(); // Automatically bound from route param
}
```

**Enable:** Add `withComponentInputBinding()` to router providers.

---

## 11. SSR & Hydration (v16+)

Improved server-side rendering:

```typescript
// Enable hydration
import { provideClientHydration } from '@angular/platform-browser';

bootstrapApplication(AppComponent, {
  providers: [provideClientHydration()],
});
```

**Features:**

- Full app hydration (v16+)
- Event replay for better interactivity (v18+)
- i18n hydration support (v18+)
- Streamed SSR for faster TTFB (v20+)

**Best practices:** Test with SSR enabled, avoid DOM manipulation in constructors, use `afterNextRender()` for browser-only code.

---

## Quick Reference

### Signal APIs

| Old Syntax                              | New Syntax (v17+)                     |
| --------------------------------------- | ------------------------------------- |
| `@Input() name: T`                      | `name = input<T>()`                   |
| `@Input({ required: true })`            | `name = input.required<T>()`          |
| `@Output() evt = new EventEmitter<T>()` | `evt = output<T>()`                   |
| `@Input()/@Output()` pair               | `value = model<T>()`                  |
| `@ViewChild('ref')`                     | `ref = viewChild<T>('ref')`           |
| Writable derived signal                 | `linkedSignal(() => source())` (v19+) |

### Template Syntax

| Old Syntax                     | New Syntax (v17+)                  |
| ------------------------------ | ---------------------------------- |
| `*ngIf="cond"`                 | `@if (cond) {}`                    |
| `*ngFor="let x of items"`      | `@for (x of items; track x.id) {}` |
| `[ngSwitch]` + `*ngSwitchCase` | `@switch (val) { @case (x) {} }`   |
| Template variable repetition   | `@let name = expression` (v18.1+)  |
| `<img src="...">`              | `<img ngSrc="..." width height>`   |
| Lazy load                      | `@defer { <component /> }` (v17+)  |

### Dependency Injection

| Old Syntax (v13-)                      | New Syntax (v14+)               |
| -------------------------------------- | ------------------------------- |
| `constructor(private svc: Service) {}` | `private svc = inject(Service)` |

### Architecture

| Feature                 | Old (v15-)             | New (v16+)       |
| ----------------------- | ---------------------- | ---------------- |
| Components              | NgModule-based         | Standalone       |
| Change Detection        | zone.js (automatic)    | Zoneless (v21+)  |
| Async data with signals | Manual signal + effect | resource() (v19) |
