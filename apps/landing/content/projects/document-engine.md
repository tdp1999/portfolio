## Overview

Document Engine is the document-authoring substrate I built at Redoc to replace CKEditor across the loan and finance products a Singapore bank runs on us. Two npm packages — a framework-agnostic core on top of Tiptap / ProseMirror, and an Angular wrapper — both authored, versioned, and released by me. Four loan products share the same engine today. The CKEditor license is gone, the editor behaves the same in every product, and a compliance change ships once and propagates everywhere.

I have shipped a lot of things in five years. This is the one I am most willing to name. It is the cleanest example of "patterns before code" I have on file — a contract lib, a concrete implementation, two distribution shapes, four downstream apps, all aligned to one editor model.

![Document Engine — restricted-edit mode in a loan agreement template](/assets/projects/document-engine/fig-01-restricted-edit.png "Restricted-edit mode — locked clauses keep their structure; dynamic fields like {{customer_name}} stay editable")

## The Problem

The bank's loan and finance stack at Redoc — four products, all Angular — was authoring documents through CKEditor 5 commercial. Three things made that the wrong default by the time it became my problem.

**Annual licensing fees** that scaled with seat count and renewed on the bank's procurement calendar, not ours. Every new feature flag negotiation included a license check.

**Customisation ceilings.** The bank's loan workflows have compliance constraints — clauses that must stay verbatim, fields that must stay machine-parseable, edit permissions that depend on who is reviewing. CKEditor's plugin surface and licensing model made deep customisation slow and contractual.

**Per-product divergence.** Each of the four loan products had cloned the same editor wiring and started drifting — different toolbar, different shortcuts, different bug surface. A fix in one did not propagate.

The decision before me was: keep paying, patch around the ceilings, accept the drift — or own the editor.

Procida 3 framing: before, the four loan products each bent a commercial editor to fit their compliance rules and paid annually for the privilege; what changed is the firm now owns the editor stack end-to-end and the same upgrade lands in all four products at once; the outcome is the license bill is zero and a compliance change in the bank's terms-of-service template ships once, not four times.

## Approach

The choice that defined the project was making the engine **framework-agnostic at the core**.

`@redoc/document-engine-core` knows about Tiptap, ProseMirror schemas, marks, and nodes. It does not know about Angular, React, or any UI framework. It exposes a contract — extension registration, schema composition, command surface, serialisation — that any wrapper can implement. The point of the contract is that a future React product (or a server-side render path, or a CLI document-validator) can implement it without rewriting the editor's behaviour.

`@redoc/document-engine-angular` is the wrapper the four loan products consume today. It binds the core's command surface to Angular forms, plugs the schema into the bank's design tokens, and surfaces the restricted-edit and dynamic-field modes as `<doc-editor>` inputs. The wrapper is thin; almost everything that matters is in the core.

> The strongest case for splitting core from wrapper only becomes visible at the second product. By the fourth, the question is not whether the split was worth it but how anyone would manage four divergent editors otherwise.

**Compliance-aware nodes.** The two features that earned the rewrite, beyond cost:

- **Dynamic fields** — placeholders like `{{customer_name}}`, `{{loan_amount}}` that the editor recognises as first-class nodes. They render visually as pills, never split across save boundaries, and have a contract with the bank's document-generation service so the same `{{customer_name}}` resolves the same way every time.
- **Restricted-edit mode** — a per-node permission flag the schema enforces. Locked clauses cannot be deleted or reformatted; only authorised marks (signatures, dates) can be added. The compliance team writes a template once, ships it, and editors downstream cannot accidentally break the legal text.

Both features are core-level — schema and command — not wrapper-level. That is the test for whether the split was honest: if a feature could only live in the Angular wrapper, the core was wrong.

![Document Engine — dynamic field nodes in a draft contract](/assets/projects/document-engine/fig-02-dynamic-fields.png "Dynamic fields render as pills in the editor; the document-generation service resolves the same tokens at render time")

## Outcome

Four loan products on one editor, today. Zero CKEditor licensing renewals since rollout. Both packages on the public npm registry — `@redoc/document-engine-core` and `@redoc/document-engine-angular` — versioned together, semver-disciplined, with the core as the source of truth.

The compliance-team workflow is the outcome I am most proud of. Their loan-agreement template author used to file a ticket for any structural change; now they edit the template themselves in a restricted-edit document that the engine enforces. The structure stays correct because the schema forbids breaking it. They have shipped roughly two dozen template revisions through the editor without engineering involvement.

The architecture also passed the only test I really trust: a fifth product was added to the bank's stack mid-2025 and the engine integration was a one-week wrapper-config job, not a one-quarter rewrite. The core did not change.

## What I'd Change

Two things.

**Documentation depth.** The npm READMEs cover installation and a happy path. They do not cover the extension contract well, do not have a worked example of a custom node, and do not yet have a migration guide for teams coming from CKEditor. The framework-agnostic core's strongest argument is portability, and that argument lives or dies on the docs. The team has the answers in heads; the docs do not.

**Test coverage of the schema.** Editor behaviour is unit-tested at the command level — `setMark`, `insertNode`, `splitListItem` — and Playwright covers the end-to-end loan-agreement flow. The schema rules themselves, the part that prevents a restricted-edit document from being broken, do not have property-based tests yet. Compliance-aware editors are exactly the surface where property-based testing earns its keep. That is the next sprint.

If I rebuilt from scratch tomorrow the only structural choice I would change is to publish a thin **React** wrapper at the same time as the Angular one, even if no product needed it yet — strictly to keep the core honest. Without a second wrapper consumer, "framework-agnostic" is a claim, not a contract. Owning a React wrapper would have caught two contract leaks I only found in year two.
