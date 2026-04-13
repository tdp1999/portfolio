---
name: Reward Early, Punish Late
category: principle
tags: [validation, feedback-timing, form, error-handling]
---

## Statement

When correcting errors, give success feedback immediately (reward early). When editing valid input, defer error feedback until the user is done (punish late).

## Key Takeaways

- Errors shown on blur (when user leaves the field), not on keystroke
- Error messages removed on change (as soon as user starts typing correction)
- Positive validation (success state) shown immediately when a previously errored field becomes valid
- Previously valid fields are not re-validated until blur or submit
- Reduces unnecessary distractions and layout shifts

## Application in UI

- **On error field:** listen to `input`/`change` event → validate → if valid, show success immediately
- **On valid field:** listen to `blur` event only → validate → if invalid, show error
- **On untouched field:** no validation until form submission
- **Angular reactive forms:** use `updateOn: 'blur'` for initial validation, switch to `updateOn: 'change'` after first error

## Sources

- [Mihael Konjević: Inline Validation in Forms — Designing the Experience](https://medium.com/wdstack/inline-validation-in-forms-designing-the-experience-123fb34088ce) (original research)
- [Smart Interface Design Patterns: Inline Validation UX](https://smart-interface-design-patterns.com/articles/inline-validation-ux/)
