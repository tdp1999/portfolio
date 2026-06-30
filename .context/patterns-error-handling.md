# Error Handling Patterns

> How errors flow from a thrown `DomainError` on the API to a toast or inline `mat-error` in the
> console. Read this before adding a new error code, wiring up a new form, or debugging "why is
> the user not seeing the error?"

## Backend: throw → response shape

### Throw site

Errors are thrown as `DomainError` (or `InfrastructureError` for DB/external failures) from
**command/query handlers**, never from controllers. Controllers are thin transport adapters.

```ts
// Application layer
import { ValidationError, NotFoundError } from '@portfolio/shared/errors';
import { ExperienceErrorCode } from '@portfolio/shared/errors';

if (!result.success) {
  throw ValidationError(ExperienceErrorCode.INVALID_INPUT, formatZodError(result.error));
}
if (!exp) {
  throw NotFoundError(ExperienceErrorCode.NOT_FOUND, 'Experience not found');
}
```

Factories live in `libs/shared/utils/errors/src/lib/domain.error.ts`. Use them — don't `throw new Error()`.

### Error code naming

- Stored in per-domain enums under `libs/shared/utils/errors/src/lib/error-codes/`.
- Convention: `<DOMAIN>_<REASON>` — e.g. `EXPERIENCE_INVALID_INPUT`, `SKILL_CIRCULAR_REFERENCE`.
- **Validation suffix:** any code ending in `_INVALID_INPUT` or `_VALIDATION_ERROR` is treated as
  a field-level validation error by the FE handler. Use these suffixes for Zod `safeParse` failures.

### Response envelope

`DomainExceptionFilter` (apps/api/src/shared/filters/domain-exception.filter.ts) shapes
the HTTP response:

```json
{
  "statusCode": 400,
  "errorCode": "EXPERIENCE_INVALID_INPUT",
  "error": "Bad Request",
  "message": "Validation failed",
  "data": { "endDate": ["startDate must be before endDate"] },
  "remarks": "[APPLICATION] Experience update validation failed"
}
```

- `errorCode` — machine-readable discriminator. **Always set it** when throwing a `DomainError`.
- `message` — generic fallback. Keep short and code-agnostic ("Validation failed", not "End date must…").
  Specific user-facing copy lives in the FE dictionary, not here.
- `data` — for validation errors, a `{ field: [msg, ...] }` map produced by `formatZodError`.
- `remarks` — internal observability hint, stripped in production.

## Frontend: response → user

```
HttpErrorResponse
   │
   ▼
[interceptor] ──► ConsoleErrorHandler.handleHttpError()   ◄── apps/console/src/app/error-handler.provider.ts
                      │
       ┌──────────────┼──────────────────────────────┐
       │              │                              │
   401 / 0 / 429 /   errorCode ends in            errorCode in
   403 / 500         _INVALID_INPUT or            ERROR_DICTIONARY
   (special-cased)   _VALIDATION_ERROR            ──► toast(dict[code])
                     ──► ValidationErrorService       ──► ErrorDataService.push
                          │
                          ▼
                   ServerErrorDirective
                   [formGroup][consoleServerErrorMap]
                          │
                   ┌──────┴──────────┐
                   ▼                 ▼
             control.setErrors   SERVER_ERROR_FALLBACK
             ({ server: msg })   (toast for unmatched fields)
                   │
                   ▼
             <mat-error>{{ control | formError }}</mat-error>
             renders inline next to the field
```

### Layers

| Layer | File | Responsibility |
|---|---|---|
| Global handler | `apps/console/src/app/error-handler.provider.ts` | Routes HTTP errors to the right place. Special-cases 0/401/403/429/500. |
| `extractApiError` | `libs/console/shared/util/.../api-error.ts` | Parses `HttpErrorResponse` into `{ statusCode, errorCode, message, data }`. |
| `ERROR_DICTIONARY` | `libs/console/shared/util/.../error-dictionary.ts` | Maps `errorCode` → user-facing message. Single source of truth for copy. |
| `ValidationErrorService` | same dir | Signal-based store of `{ field: [msg] }`. Pushed to by handler, consumed by directive. |
| `ServerErrorDirective` | same dir | Wired via `[consoleServerErrorMap]` on a `<form>`. Reads field errors → `setErrors({ server: msg })`. Unmatched fields → `SERVER_ERROR_FALLBACK`. |
| `SERVER_ERROR_FALLBACK` | provided in `error-handler.provider.ts` | `ToastService.error` shim for unmatched validation field names (e.g. cross-field errors with no matching control). |
| `FormErrorPipe` | same dir | `mat-error` content. Resolves `control.errors` → message via `DEFAULT_VALIDATION_MESSAGES`. The `server` key returns the BE message verbatim. |

### Procedure for a new submit form

1. **Add the `<DOMAIN>_INVALID_INPUT` code** to the appropriate enum in `error-codes/`.
2. **Add a friendly message** for that code (and any other domain codes you raise) to
   `ERROR_DICTIONARY`. Generic for `_INVALID_INPUT` (e.g. "Please fix the highlighted fields and
   try again."), specific for business rules (e.g. "A skill cannot be its own parent.").
3. **Throw `ValidationError(YourEnum.INVALID_INPUT, formatZodError(err))`** in the command handler
   when `safeParse` fails.
4. **On the form template,** add `[consoleServerErrorMap]="{}"` to the `<form>`:
   ```html
   <form [formGroup]="form" [consoleServerErrorMap]="{}" (ngSubmit)="submit()">
   ```
   Use `{ apiField: 'controlName' }` only when API field names differ from form control names.
5. **Add `ServerErrorDirective`** to component imports.
6. **Trim the error callback** to just spinner cleanup:
   ```ts
   error: () => this.saving.set(false)
   ```
   Do not call `toast.error` or set local error signals — the global handler owns that.
7. **Make sure each input has** `<mat-error>{{ form.controls.<x> | formError }}</mat-error>`.
   The `server` error key is wired by default in `DEFAULT_VALIDATION_MESSAGES`.

### When a field doesn't have a control

Cross-field errors emit a path on a real control (`endDate` for "startDate must be before
endDate"), so they bind to the corresponding `<mat-error>`. Errors with **no matching control**
flow to `SERVER_ERROR_FALLBACK` and toast — that's the safety net.

### When the BE-emitted code is unknown to the FE

Handler falls back to `apiError.message` (the generic BE message). The user still gets *something*
but loses the curated copy. **Treat unknown codes as a bug.** See "Adding a new error code" below.

## Toast vs inline placement

| Situation | Where it shows |
|---|---|
| Validation (`_INVALID_INPUT`) on a mapped field | Inline `<mat-error>` next to the field **and** a summary toast (dictionary message) |
| Validation, unmapped field name | Inline if mapped; otherwise toast (via `SERVER_ERROR_FALLBACK`) |
| Domain error with `errorCode` in dictionary | Toast (curated message) |
| Domain error with unknown `errorCode` | Toast (BE message verbatim) |
| Network / 0 / 429 | Toast (hardcoded message) |
| 403 / 500 | Navigate to `/error/<status>`, dialogs closed |
| 401 (non-auth route) | Silent — refresh interceptor handles it |

**Do not show errors at the bottom of the form.** Users miss them. Inline + toast covers the
ground.

## Adding a new error code

1. Add to the enum in `libs/shared/utils/errors/src/lib/error-codes/<domain>.error-codes.ts`.
2. Add a message to `ERROR_DICTIONARY` in
   `libs/console/shared/util/src/lib/errors/error-dictionary.ts`. **TypeScript will refuse to
   compile until you do** — the dictionary is typed as `Record<AllErrorCodes, string>` where
   `AllErrorCodes` is a union of every enum value via the `${EnumName}` template-literal trick.
   This is intentional: a BE code without a FE message is a bug.
3. If the code is a validation code, suffix with `_INVALID_INPUT` so the global handler routes it
   to `ValidationErrorService` instead of toasting.

## Anti-patterns to avoid

- **`toast.error` inside a form's `subscribe({ error })`** — the global handler already toasts.
  Causes double-toasts.
- **`extractApiError` + local `serverError` signal + form-end error block** — superseded by
  `ServerErrorDirective`. Inline is more visible than form-end.
- **Throwing `new Error()` or `BadRequestException` from a handler** — bypasses `errorCode` →
  user sees a generic message with no dictionary lookup possible.
- **Throwing from controllers** — controllers are transports. Move it to the handler.
- **Putting user-facing copy in BE `message`** — that string is a fallback, not the canonical text.
  The dictionary is the source of truth, not the BE.

