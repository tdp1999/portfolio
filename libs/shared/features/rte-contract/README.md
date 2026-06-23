# rte-contract

Angular DI contract for the rich-text editor: the abstract `RteEditor`
(ControlValueAccessor base) and the `RTE_EDITOR` token. Concrete editors
(`rte-tiptap`) implement it; consumers `provide(RTE_EDITOR, …)` and never import a
concrete impl. Framework-agnostic shared values (types, `RICH_TEXT_WHITELIST`,
`sanitizeRichText`) live in `rte-core`, not here.

## Running unit tests

Run `nx test rte-contract` to execute the unit tests.
