# Task: Document Design System Patterns

## Status: pending

## Goal

Update `.context/patterns.md` with comprehensive design system documentation.

## Context

Final task of Design System epic. Documentation ensures future development follows established patterns and makes the design system usable.

## Acceptance Criteria

- [ ] Design System section added to `.context/patterns.md`
- [ ] Three-layer token architecture explained
- [ ] Color token usage documented with examples
- [ ] Typography token usage documented
- [ ] Component usage patterns documented (Button, Card, Input, Badge, Link, Container, Section)
- [ ] Icon system usage documented
- [ ] Tailwind + SCSS hybrid approach explained
- [ ] Dark mode testing instructions included
- [ ] BEM naming convention examples

## Technical Notes

Documentation structure to add:

````markdown
## Design System

### Token Architecture

Three-layer system following industry best practices:

1. **Primitive Tokens (Layer 1):** Raw values - Tailwind defaults + custom HSL palette
2. **Semantic Tokens (Layer 2):** Contextual mappings - --color-primary, --color-surface
3. **Component Tokens (Layer 3):** Component-specific - defined in component SCSS

### Color Usage

```html
<!-- Use semantic tokens in components -->
<div class="bg-surface text-text border-border">
  <span class="text-primary">Primary text</span>
</div>

<!-- Direct accent access when needed -->
<div class="bg-accent-100 text-accent-700">Light accent container</div>
```
````

### Typography Usage

```html
<h1 class="text-5xl font-semibold">Hero heading</h1>
<p class="text-base text-text-secondary">Body text</p>
<code class="font-mono text-sm">Code snippet</code>
```

### Component Usage

[Examples for each component]

### Icon Usage

```html
<lib-icon name="arrow-right" size="md" class="text-primary" />
```

Available sizes: sm (16px), md (20px), lg (24px), xl (32px)

### Dark Mode

Add `.dark` class to `<html>` to activate dark mode:

```javascript
document.documentElement.classList.add('dark');
```

### Tailwind + SCSS Hybrid

- Tailwind for utilities (spacing, layout, effects)
- SCSS for Angular Material mixins
- Component styles use @apply with Tailwind classes
- BEM naming for custom CSS classes

```

## Files to Touch
- `.context/patterns.md` (add Design System section)
- `.context/decisions.md` (ensure ADR for Tailwind + SCSS hybrid exists)

## Dependencies
- 039-verify-phase4-components (all components working)

## Complexity: M

## Progress Log
```
