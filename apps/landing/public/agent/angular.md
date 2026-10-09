# Angular rules

Copy into Angular projects only, alongside `rules.md`.

| Rule | Why |
| --- | --- |
| Never call methods or getters in templates; use a computed signal, a row view model, or a pure pipe. | Template calls re-run on every change detection cycle. |
| Never nest subscriptions; chain with `switchMap`, `concatMap`, or `mergeMap`. | Nested subscriptions leak and lose cancellation and ordering. |
| Keep templates type-safe: no `$any`, no casts, no `FormGroup.get('x')`; use typed form controls. | Each of these switches off template type checking. |
| Build a payload from a form by spreading the form value and overriding what differs, not by listing every field again. | Field-by-field mapping bloats and drifts when fields are added. |
| Use `routerLink` for a click that only navigates. | A real link keeps open-in-new-tab, prefetching, and accessibility. |
