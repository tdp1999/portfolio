# rte-tiptap

Concrete Tiptap editor (`RteTiptapEditor`) wrapping
`@phuong-tran-redoc/document-engine-angular`, satisfying the `RteEditor` contract.
The **only** lib allowed to import the engine package (enforced by ESLint module
boundaries). Console wires it via `provide(RTE_EDITOR, RteTiptapEditor)`.

## Running unit tests

Run `nx test rte-tiptap` to execute the unit tests.
