---
auto_validation: enabled
---

# Vision

## Summary

A multi-page professional portfolio website designed as a startup-style landing page to attract recruiters, managers, and employers while serving as the central hub for personal brand and project showcase.

## Target Users

- Recruiters and hiring managers
- Potential employers and clients
- Professional network and industry peers
- Anyone interested in viewing professional work and achievements

## Scale

Personal/professional showcase

## Timeline

Full product (implementing complete vision)

## Design Philosophy

- Clear, straightforward, and simple (minimize steps to CTA)
- Beautiful and modern aesthetic
- Clean feel with minimal or no animations
- Every important aspect gets its own dedicated page

## Project Scope

### Core Pages

- **Home Page**: Hero section, "About Me" summary, brief work overview, clear CTA
- **Experience Page**: Detailed professional career history
- **Side Projects Page**: Personal projects showcase
- **Contact Page**: Simple contact form or communication method
- **Blog/Articles Section**: Technical writing, case studies, thought leadership
- **Project Detail Pages**: Deep dives into individual projects with process, challenges, outcomes

### Key Features

- **Theme Support**: Dark, Light, and System/Device theme toggle
- **Multi-language Support**: Entire site supports multiple languages
- **Dynamic Resume Download**: Automatically matches selected language
- **Google Analytics**: Visitor tracking integration
- **AI Readiness**: llm.txt file for AI crawlers
- **Testimonials/Recommendations**: Social proof from colleagues or clients
- **Skills Timeline**: Interactive visualization of skill development over time

### Technical Requirements

- Multi-page website structure (not SPA single-scroll)
- Responsive design for all devices
- Fast loading and performance optimized
- SEO optimized for discoverability
- Accessibility features (screen reader optimization, keyboard navigation)
- Print stylesheet for resume/experience
- PWA capabilities for offline viewing

## Development Philosophy

### Test-Driven Development (TDD)

**Approach:** Pragmatic TDD - write tests for critical paths first

> **Full TDD details in `.context/testing-guide.md`** (single source of truth)

**Key Points:**

- Red → Green → Refactor workflow
- All test execution delegated to **test-runner subagent** (runs affected tests only)
- **build-validator subagent** for type checking and builds
- Coverage: 80-90% business logic, 90%+ API endpoints, 70-80% complex components

**Critical Paths Requiring Tests:**

- All API endpoints (GET, POST, PUT, DELETE)
- Authentication and authorization logic
- Data validation and transformation
- Business logic (resume generation, content formatting)
- Complex UI interactions (theme switching, language toggle, form submissions)

## Notes

**On llm.txt for AI crawlers:**
This is a forward-thinking idea. An llm.txt file helps AI assistants (like ChatGPT, Claude, etc.) accurately represent your work when users ask about you or your projects. It's low effort to implement and positions you as tech-savvy. Recommended to include in MVP.

**On animations:**
Keeping animations minimal aligns with your "clear and simple" philosophy. Consider only:

- Smooth page transitions (fade-in)
- Subtle hover states on interactive elements
- Avoid complex scroll-triggered animations that can feel gimmicky

## Changelog

### [2026-02-01] Added Test-Driven Development Approach

- **Added:** TDD development philosophy with pragmatic coverage targets
- **Testing Stack:** Jest (unit/integration) + Playwright (E2E)
- **Coverage Targets:** 80-90% for business logic, 90%+ for API endpoints, 70-80% for complex components
- **Workflow:** Red-Green-Refactor cycle with tests written before implementation
- **Reason:** Ensure code quality, prevent regressions, and maintain confidence during rapid development
- **Impact:** All new features must follow TDD approach starting from next task
