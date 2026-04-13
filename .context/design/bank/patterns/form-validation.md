---
name: Form Validation
category: pattern
principles: [reward-early-punish-late, error-prevention]
tags: [form, validation, input, error-handling, inline-validation]
---

## Research-Backed Guidelines

- **Timing — "Reward Early, Punish Late":** When user is fixing an error, validate immediately on change (reward). When user edits a previously correct field, validate only on blur or submit (punish late).
- **Empty fields:** Never validate before submission. Showing "field required" on an untouched field is premature and hostile.
- **Error removal:** Remove error message as soon as user starts typing the correction — don't wait for blur.
- **Positive feedback:** Show green checkmark/success state as user completes each field correctly, reinforcing progress.
- **Error message content:** Tell the user HOW to fix it, not just what's wrong. "Please enter a valid email (e.g., name@example.com)" not "Invalid email."
- **Error message placement:** Inline, directly next to the field. Never in a summary banner alone — minimizes working-memory load.
- **Short forms (< 5 fields):** Consider submit-only validation. Inline validation adds complexity without proportional benefit.
- **Override mechanism:** Let users bypass validation with explicit confirmation when the system incorrectly rejects valid input.
- **Real-time validation exceptions:** Use real-time (keystroke) validation ONLY for password strength indicators or character counters — never for general fields.

## Anti-patterns

- Validating on keystroke or focus for fresh fields (user hasn't finished typing)
- Showing errors on empty/untouched fields before submission
- Removing error messages before the user has read them
- Relying only on color (red/green) without text — fails accessibility
- Summary-only error banners at page top without inline indicators
- No override when validation incorrectly rejects valid international formats (phone, postal code, names)

## Sources

- [Smart Interface Design Patterns: Inline Validation UX](https://smart-interface-design-patterns.com/articles/inline-validation-ux/)
- [Baymard Institute: Usability Testing of Inline Form Validation](https://baymard.com/blog/inline-form-validation)
- [NNGroup: 10 Design Guidelines for Reporting Errors in Forms](https://www.nngroup.com/articles/errors-forms-design-guidelines/)
- [Mihael Konjević: Inline Validation in Forms — Designing the Experience](https://medium.com/wdstack/inline-validation-in-forms-designing-the-experience-123fb34088ce)
