## Overview

TDP is a set of Claude Code plugins my team and I use to do **task-driven development** — a workflow where vision, epics, tasks, and progress are explicit text artifacts in the repo, and Claude works inside that structure rather than against it. The public set is open-source; the team has an internal extension on top.

The proof point is the site you are currently reading. Every page, every shipped task, every architecture decision in this portfolio was planned and executed through TDP. The case study you are reading right now exists as `.context/tasks/296-content-project-3-case-study.md`, was decomposed from an epic plan, and the AI assistance that helped write it followed task acceptance criteria the file defines.

That is the meta-loop the project is built around: the system used to ship the work is the same system used to describe the work, in the same files, in the same repo. Nothing about the portfolio is reverse-engineered after the fact.

![TDP — a slash command running a task breakdown in Claude Code](/assets/projects/tdp-plugins/fig-01-breakdown.png "/ctx:breakdown decomposing an epic plan into individual task files with acceptance criteria")

## The Problem

Two things broke the moment I started shipping non-trivial work with AI assistance.

**Drift.** Without a structure that survives between sessions, every conversation starts from scratch. The AI has no memory of what was decided last week, what was tried and rejected, why a certain pattern is in place. The conversation is fast in the moment and forgotten by the next morning. Output quality stays high; *coherence* across days collapses.

**Scope creep at the prompt level.** A "small fix" turns into a refactor turns into a half-finished restructure, because there is nothing in the loop forcing the question "is this the task I picked up, or am I improvising?". A task list in a Notion board does not help — Claude does not read your Notion board, and pasting it in every prompt rots fast.

Procida 3 framing: before, AI assistance produced strong individual sessions and weak weeklong continuity, and the repo carried no durable record of why decisions were made; what changed is the project surface itself — vision, architecture, epic plans, task files, decisions log — now lives as text in `.context/` and is the first thing Claude reads on every session; the outcome is the AI assists *inside* the structure, the structure outlives any single conversation, and a recap of a week's work is a `git log` away.

> The smallest correct unit of AI-assisted work is not a prompt. It is a task file with acceptance criteria, a known dependency chain, and a place to write progress as the work happens.

## Approach

TDP is two layers.

**The plugins.** Slash commands and skills installed into Claude Code that operate on a `.context/` folder. `/ctx:vision` writes the vision file. `/ctx:architecture` captures patterns. `/ctx:epic` plans a feature. `/ctx:breakdown` decomposes an epic into task files. `/ctx:task` loads one task and works on it against its acceptance criteria. `/ctx:progress` and `/ctx:sync` keep the per-task status and the rolled-up index in sync. The skills know the conventions — what a task file looks like, where it lives, how to update progress — so the prompts a user types stay short.

**The discipline.** The structure does most of the work. A task file is small (single screen, ≤ 12 lines of acceptance criteria), names its dependencies, and has a place for progress log entries. An epic file is a planning document, not a status board — once tasks exist, the epic is reference, not work-in-progress. The decisions log captures the *why* of non-obvious choices so a future contributor (or a future you, in a new session) can pick up the thread.

What the plugins explicitly do not do: replace the human judgement on what to build, what to ship, what to cut. The system makes structure cheap; it does not make decisions for you.

![TDP — the .context folder for this portfolio, showing vision, plans, tasks, decisions](/assets/projects/tdp-plugins/fig-02-context-folder.png "Every task that built this site lives in .context/ — over 300 task files across the lifetime of the project")

## Outcome

This portfolio is the outcome. Roughly 300 task files across the project's lifetime, every one with acceptance criteria, dependencies, and a progress log. Every architecture decision worth remembering is in `decisions.md`. Every epic is documented in `plans/` with a phase outline and exit criteria. The recap of any given week of work is a single command.

The compounding effect shows up at the unglamorous end. When I needed to pick up a half-finished landing page sub-task after two weeks away, the task file told me what was done, what was acceptance-criteria-pending, and which decisions I had already made — no archaeology, no re-deriving. The plugins are open-source and the workflow has held up across two side projects beyond this one.

The internal team extension adds task-board sync, sprint planning hooks, and a recap aggregator across multiple repos. The public set stays minimal so the workflow is the focus, not the tooling surface.

## What I'd Change

Two honest things.

**Onboarding is steep.** The system rewards discipline. The discipline rewards reading the conventions document first. A new contributor who installs the plugins and starts typing slash commands without reading the conventions is going to write task files that miss the point. I have not yet found the right "first ten minutes" experience that teaches the discipline without overwhelming. The README does the best it can; the workflow itself is the better teacher, but only after a few cycles.

**No web UI.** Everything is text in the repo, which is exactly the point — and exactly the friction. A read-only web view of `.context/` with cross-linking, task graph visualisation, and a search would lower the barrier without compromising the source-of-truth-is-text principle. It is queued. It is not the next thing I will build, because the workflow works without it, but it is the next thing I would build if onboarding were the priority.

If I rebuilt from scratch tomorrow I would publish the conventions doc as its own readable site at the same time as the plugin set, instead of as a `.md` inside the package. The discipline is the product; the slash commands are the delivery mechanism. The current README inverts the emphasis.
