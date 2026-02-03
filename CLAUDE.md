# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nx monorepo for a professional portfolio website with:
- **Angular 21 landing app** (SSR/SSG public site)
- **NestJS API** (backend service)
- **Shared libraries** (types, utils, ui, api-client)

**Current Phase:** TDD Infrastructure Setup
**Development Philosophy:** Pragmatic Test-Driven Development

## Quick Reference

- **Commands:** See `.context/commands.md` for all dev/build/test commands
- **Testing:** See `.context/testing-guide.md` for TDD workflow and patterns
- **Architecture:** See `.context/patterns.md` for code patterns and conventions
- **Vision:** See `.context/vision.md` for project goals and philosophy

## Architecture

**Backend:** NestJS with layered architecture (Controllers → Services → Repositories)
**Frontend:** Angular 21 with SSR, Signals, feature modules
**Stage 1:** Mock JSON data (no database yet)

See `.context/patterns.md` for detailed architecture patterns and module structure.

## Test-Driven Development (TDD)

Follow Red → Green → Refactor workflow. Write tests BEFORE implementation.
**Delegate all test execution to the test-runner subagent** (runs affected tests only).

See `.context/testing-guide.md` for full TDD workflow, coverage targets, and patterns.

## Code Patterns

See `.context/patterns.md` for file naming, exports, and all code conventions.

## Key Decisions

- **Stage 1:** API uses mock JSON data (no database)
- **TDD:** Write tests before implementation, use test-runner subagent
- See `.context/decisions.md` for architectural decision records

## Tech Stack

- **Angular:** 21.1.0 (Signals, SSR, standalone components)
- **NestJS:** 11.0.0
- **Nx:** 22.4.4
- **Package Manager:** pnpm
- **Node:** 20+ LTS required

## Working with Nx

- Projects defined in `apps/*/project.json` or `libs/*/project.json`
- Use `nx affected` commands to only run tasks on changed projects
- Use `pnpm graph` to visualize project dependencies

## Context Files

The `.context/` directory contains project documentation:
- `vision.md` - Project goals and philosophy
- `patterns.md` - Architecture and code patterns
- `testing-guide.md` - TDD workflow and patterns
- `commands.md` - All dev/build/test commands
- `decisions.md` - Architecture decision records
- `progress.md` - Task completion tracking
- `tasks/*.md` - Individual task definitions
- `plans/*.md` - Epic and feature plans
