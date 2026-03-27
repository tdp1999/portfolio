# Domain: Portfolio

## Glossary

| Term | Definition | Type |
|------|-----------|------|
| Profile | Personal information of the site owner (name, bio, avatar, social links) | Entity |
| Experience | A professional career entry with company, role, dates, and description | Entity |
| Skill | A technical or professional competency with proficiency level | Entity |
| Testimonial | A recommendation or quote from a colleague or client | Entity |
| Project | A side project or portfolio piece with metadata and technologies used | Aggregate |
| ProjectDetail | Extended information about a Project (process, challenges, outcomes) | Entity |
| Technology | A technology or tool associated with a Project | Value Object |
| Post | A blog article with content, metadata, and publication status | Aggregate |
| Category | A grouping label for Posts | Entity |
| Tag | A keyword associated with a Post for filtering | Value Object |
| SiteConfig | Site-wide settings (theme defaults, analytics, SEO metadata) | Entity |
| Resume | A generated CV document (docx/pdf) built from Profile, Experience, and Skill data | Entity |
| Language | A supported locale for the site (e.g., en, vi) | Value Object |
| PostStatus | The publication state of a Post: Draft, Published, Private, Unlisted | Value Object |

## Flows

### Update Personal Info
- **Trigger:** Owner wants to update profile, experience, skills, or testimonials
- **Actors:** Owner (via Console)
- **Happy path:**
  1. Owner navigates to the relevant Console section
  2. Owner edits content (Profile, Experience, Skill, or Testimonial)
  3. System validates and saves changes
  4. Landing Page reflects updated content on next visit
- **Error paths:**
  - Validation failure: System rejects invalid input, Owner corrects and resubmits
- **End states:** Content updated and visible on Landing Page

### Publish Blog Post
- **Trigger:** Owner wants to create or publish a blog article
- **Actors:** Owner (via Console), Post, Category, Tag
- **Happy path:**
  1. Owner creates a new Post in Console
  2. Owner writes or pastes content, assigns Category and Tags
  3. Owner sets PostStatus (Draft, Published, Private, or Unlisted)
  4. System validates and saves the Post
  5. If Published — Post appears in public blog listing on Landing Page
  6. If Unlisted — Post is accessible via direct link only, not listed
- **Variations:**
  - Save as Draft: Owner saves without publishing, Post is not visible to visitors
  - Edit existing Post: Owner modifies content or changes PostStatus
- **Error paths:**
  - Validation failure: System rejects (e.g., missing required fields)
- **End states:** Post saved with chosen PostStatus

## Rules

### Post
- PST-001: A Post must have a title and content body before it can be Published or Unlisted
- PST-002: A Draft Post is only visible to the Owner in Console
- PST-003: A Private Post is only accessible by the Owner (even with direct link)
- PST-004: An Unlisted Post is accessible via direct link but not shown in public blog listing
- PST-005: A Published Post appears in the public blog listing on Landing Page

### Profile
- PRF-001: Only one Profile exists (single-owner site)

## Invariants
- The Landing Page only displays content that has been saved and is in a public-visible state
- All content changes go through Console — Landing Page is read-only for visitors

## Edge Cases
- **Post status transition:** Owner changes a Published Post to Draft — Post is immediately removed from public listing
- **Unlisted Post discovery:** An Unlisted Post URL shared externally remains accessible as long as status is Unlisted

## Changelog
- [2026-03-27] Created — initial domain model with content management and blog flows
