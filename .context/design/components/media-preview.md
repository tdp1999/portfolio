# `console-media-preview` — stored pictures in the console

One component for every place the console shows a stored asset. It exists because three
decisions were being re-made (and re-got-wrong) at each `<img>`: what to call the picture,
how big a file to fetch, and whether it can be opened.

## Behavior contract

**The label ladder is `caption → filename → altText → "Untitled"`.**
Caption is the only field written _about the picture_, so it leads. `altText` is written for
screen readers, which makes it the worst label and therefore the last rung, not the first.
Blank and whitespace-only values fall through. `"Untitled"` is reachable only when all three
are genuinely absent.

**The `alt` attribute is a separate question, with its own order: `altText → caption → filename → ""`.**
It never falls back to `"Untitled"` — announcing a UI placeholder helps nobody, so an image
with no usable description is announced as empty instead.

**The fetched size is derived from `tileSize`, never from the source.**
`tileSize` is the rendered CSS width. The component doubles it for retina, rounds up to a
160px step so distinct tiles share Cloudinary derivatives, and applies `c_limit` — which
shrinks but never upscales, so a small source is served untouched. Non-Cloudinary urls (the
local storage adapter, seeded links) pass through: there is no transform engine behind them.

**One `items` array is one Quick Look group.** Passing the thumbnail and the gallery together
means ←/→ walks the whole record, not one picture at a time. A single-element array is fine;
the overlay simply has nothing to navigate to.

## Anti-patterns

| Don't                                    | Why                                                                                                                                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<img [src]="url">` with a raw media url | Downloads the original. A 3200px screenshot in a 230px tile is ~48× the pixels needed. Use the component, or `\| mediaThumb: <css width>` where the slot has its own chrome. |
| `altText \|\| 'Untitled'` as a label     | This was the bug. Every asset has a filename; almost none have alt text, so the whole grid read "Untitled".                                                                  |
| A per-tile Quick Look                    | Each tile would be its own group and the arrows would be dead. Give the component the whole list.                                                                            |
| Guessing `tileSize`                      | It is the CSS width in the stylesheet next to it. Read it; do not round it up "for safety" — that is how the landing gallery ended up declaring 720 for a 333px cell.        |

## Where the same rule lives outside this component

`MediaThumbPipe` (`url \| mediaThumb: <css width>`) applies the identical sizing rule for slots
that carry their own chrome — overlay Replace/Remove buttons, drag-handle rows, list cells.
Both read `mediaThumbTransform`, so there is one definition of "how big a file for how big a box".

Landing has its own equivalent: `buildCloudinaryWidthSet` + a `sizes` attribute, because a
landing image's width changes with the viewport while a console tile's does not. See
`landing-gallery.md`.
