# Domain: Portfolio

## Glossary

| Term | Definition | Type |
|------|-----------|------|
| Profile | Personal information of the site owner — composed of 6 section value objects (Identity, WorkAvailability, Contact, Location, SocialLinks, SeoOg). Single record with translatable JSON fields. | Aggregate |
| Identity | Profile section: display name, full name (translatable), title (translatable), bio (translatable), avatar reference | Value Object |
| WorkAvailability | Profile section: employment status, weekly hours, hourly rate, timezone, openTo flags (Freelance, Consulting, Side Project, Full-time, Speaking, Open Source) | Value Object |
| Contact | Profile section: email, phone | Value Object |
| Location | Profile section: city, country | Value Object |
| SocialLinks | Profile section: collection of SocialLink entries (platform → URL/handle) | Value Object |
| SeoOg | Profile section: OG image reference, meta title (translatable), meta description (translatable) | Value Object |
| Experience | A professional career entry — company, role (translatable), employment type, location type, dates, achievements, skills used, and company logo. Single record per job with translatable JSON fields for position, description, achievements, teamRole | Entity |
| EmploymentType | The contract/engagement type of a work experience: Full-time, Part-time, Contract, Freelance, Internship, Self-employed | Value Object |
| LocationType | The work arrangement of a role: Remote, Hybrid, On-site | Value Object |
| ExperienceSkill | Junction linking an Experience to the Skills/technologies used in that role | Relation |
| Skill | A technical or professional competency with proficiency level | Entity |
| Testimonial | A recommendation or quote from a colleague or client | Entity |
| Project | A portfolio project showcasing personal or open-source work. Contains translatable fields (oneLiner, description, motivation, role), technical highlights, gallery images, and skill associations. Supports soft delete, featured flag, and manual ordering. | Aggregate |
| TechnicalHighlight | A structured technical narrative (Challenge → Approach → Outcome) attached to a Project. 2-4 per project max. All fields translatable. Optional codeUrl links to specific file/PR. | Entity |
| ProjectImage | Junction linking a Project to Media, with displayOrder. Layout decides contextual placement — no placement hints stored. | Relation |
| ProjectSkill | Junction linking a Project to the Skills/technologies used in that project | Relation |
| Post | A blog article with content, metadata, and publication status | Aggregate |
| Category | A grouping label for Posts | Entity |
| Tag | A keyword associated with a Post for filtering | Value Object |
| SiteConfig | Site-wide settings (theme defaults, analytics, SEO metadata) | Entity |
| Resume | A generated CV document (docx/pdf) built from Profile, Experience, and Skill data | Entity |
| Language | A supported locale for the site (e.g., en, vi) | Value Object |
| PostStatus | The publication state of a Post: Draft, Published, Private, Unlisted | Value Object |
| ContactMessage | A visitor inquiry submitted via the landing page contact form, with lifecycle status tracking | Entity |
| ContactPurpose | The intent behind a contact message: General, Job Opportunity, Freelance, Collaboration, Bug Report, Other | Value Object |
| ContactMessageStatus | The lifecycle state of a message: Unread, Read, Replied, Archived | Value Object |
| EmailTemplate | A reusable email template with locale support and variable interpolation | Entity |
| Certification | A professional certification stored as JSON on Profile (name, issuer, year, URL) | Value Object |
| SocialLink | A social media profile link with platform enum, URL, and optional handle | Value Object |
| TranslatableJson | A JSON object with locale keys (en, vi) for multilingual content display | Value Object |
| Media | An uploaded asset (image, document, video) stored externally. Belongs to a named Folder for organization. Supports soft delete and metadata (alt text, caption). | Entity |
| MediaFolder | A named category for organizing uploaded Media assets (e.g., skill, avatar, og-image, resume, general). Assigned at upload time, immutable. | Value Object |

## Flows

### Update Personal Info
- **Trigger:** Owner wants to update profile, experience, skills, or testimonials
- **Actors:** Owner (via Console)
- **Happy path:**
  1. Owner navigates to the relevant Console section
  2. Owner edits content (Profile, Experience, Skill, or Testimonial)
  3. System validates input — including JSON fields (translatable, socialLinks, certifications)
  4. System updates the target section via section command (Identity, WorkAvailability, Contact, Location, SocialLinks, or SeoOg)
  5. Only the section's fields are persisted — other sections untouched
  6. JSON-LD Person structured data is regenerated from updated Profile
  7. Landing Page reflects updated content on next visit
- **Variations:**
  - First-time setup: Profile does not exist yet — upsert creates it (initial setup flow)
  - Per-section save: Owner updates one section at a time — each section validates and persists independently
- **Error paths:**
  - Validation failure: System rejects invalid input (e.g., malformed JSON, invalid URL in socialLinks)
  - Media not found: Avatar or OG Image ID references non-existent Media — rejected
- **End states:** Profile saved, JSON-LD updated, Landing Page reflects changes

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

### Import Markdown Post
- **Trigger:** Owner wants to import an article written in Obsidian/markdown
- **Actors:** Owner (via Console)
- **Happy path:**
  1. Owner clicks "Import Markdown" in Console editor
  2. Owner uploads .md file (optionally with images as .zip or folder)
  3. System extracts image references (standard markdown + Obsidian `![[]]` syntax)
  4. System uploads referenced images to Media module (Cloudinary)
  5. System replaces local image paths with Cloudinary URLs
  6. System converts Obsidian-specific syntax to standard markdown
  7. Parsed content loaded into ProseMirror editor as new DRAFT
  8. Owner reviews, adds metadata (category, tags, featured image), then saves
- **Variations:**
  - No images in markdown: skip image upload, load content directly
  - Broken image references (file not provided): flagged as missing, user fixes manually in editor
- **Error paths:**
  - Invalid file type: System rejects (only .md accepted)
  - Image upload failure: Partial import — content loaded, failed images flagged
- **End states:** Draft post created with imported content, images uploaded to Media

### Receive Contact Message
- **Trigger:** Visitor submits the contact form on Landing Page
- **Actors:** Visitor (anonymous), System
- **Happy path:**
  1. Visitor fills in contact form (name, email, purpose, subject, message, GDPR consent)
  2. System validates input and runs spam checks (honeypot, rate limit, disposable email)
  3. System stores ContactMessage with status UNREAD and expiresAt = createdAt + 12 months
  4. System sends auto-reply email to visitor in their locale (en/vi)
  5. System sends notification email to admin's configured personal email
- **Variations:**
  - Spam detected (honeypot filled): System returns 201 but does not store message or send emails
  - Rate limit exceeded: System returns 429
  - Disposable email: System rejects with validation error
- **Error paths:**
  - Validation failure: System rejects (missing required fields, invalid email format)
  - Email service failure: Message is still stored; email sending failure is logged but does not block submission
- **End states:** ContactMessage stored, auto-reply sent, admin notified

### Manage Contact Messages
- **Trigger:** Owner wants to review and respond to visitor inquiries
- **Actors:** Owner (via Console)
- **Happy path:**
  1. Owner opens Messages inbox in Console (default: active, non-archived messages)
  2. Owner clicks a message — status transitions to READ, readAt is set
  3. Owner clicks Reply — mailto: link opens with pre-filled subject and recipient; status transitions to REPLIED, repliedAt is set
  4. Owner archives message — status transitions to ARCHIVED, archivedAt is set
- **Variations:**
  - Mark as unread: Owner toggles READ back to UNREAD (clears readAt)
  - Soft delete: Owner deletes message (sets deletedAt), can restore within 30 days
  - Bulk actions: Owner selects multiple messages for mark-read, archive, or delete
  - Filter/search: Owner filters by status, purpose, or searches by name/email/subject
- **Error paths:**
  - Message not found or already hard-deleted: System returns 404
- **End states:** Messages triaged — read, replied, archived, or deleted

### Manage Projects
- **Trigger:** Owner wants to add, edit, or remove portfolio projects
- **Actors:** Owner (via Console)
- **Happy path:**
  1. Owner navigates to Projects section in Console
  2. Owner creates or edits a project (title, translatable fields, highlights, images, skills)
  3. System validates input — including translatable JSON fields and nested CAO highlights (max 4)
  4. System generates slug from title (on create, regenerated on title change)
  5. System manages child records atomically: TechnicalHighlight, ProjectImage, ProjectSkill (replace-all strategy)
  6. Public `/projects` and `/projects/:slug` pages reflect changes on next visit
- **Variations:**
  - Draft: Owner saves without publishing — project not visible publicly
  - Featured: Owner marks project as featured — appears in landing teaser
  - Soft delete: Owner hides project (sets deletedAt), can restore
  - Reorder: Owner updates displayOrder for manual sorting
  - Ongoing project: endDate is null, displayed as "Present"
- **Error paths:**
  - Validation failure: System rejects invalid input (malformed translatable JSON, too many highlights, invalid URLs)
  - Slug collision: System appends numeric suffix (-2, -3)
  - Media not found: thumbnailId or imageIds reference non-existent Media — rejected
  - Skill not found: skillIds reference non-existent Skill — rejected
- **End states:** Project saved with child records, public pages reflect changes

### Manage Work History
- **Trigger:** Owner wants to add, edit, or remove professional experience entries
- **Actors:** Owner (via Console)
- **Happy path:**
  1. Owner navigates to Experience section in Console
  2. Owner creates or edits an experience entry (company, role, dates, skills, achievements, logo)
  3. System validates input — including translatable JSON fields (position, description, achievements, teamRole)
  4. System generates slug from companyName + position.en (on create only, immutable)
  5. System manages ExperienceSkill junction (replace strategy: delete existing + insert new)
  6. Landing page Experience timeline reflects updated content on next visit
- **Variations:**
  - Soft delete: Owner hides experience from public view (sets deletedAt)
  - Restore: Owner restores soft-deleted experience
  - Reorder: Owner updates displayOrder for manual sorting override
  - Current position: endDate is null, displayed as "Present" on landing page
- **Error paths:**
  - Validation failure: System rejects invalid input (e.g., malformed translatable JSON, unknown skill IDs)
  - Slug collision: System appends numeric suffix (-2, -3)
  - Media not found: companyLogoId references non-existent Media — rejected
- **End states:** Experience saved, skills linked, landing page reflects changes

## Rules

### Post
- PST-001: A Post must have a title and content body before it can be Published or Unlisted
- PST-002: A Draft Post is only visible to the Owner in Console
- PST-003: A Private Post is only accessible by the Owner (even with direct link)
- PST-004: An Unlisted Post is accessible via direct link but not shown in public blog listing
- PST-005: A Published Post appears in the public blog listing on Landing Page
- PST-006: readTimeMinutes is auto-calculated on save (content word count / 200, rounded up). Manual override allowed.
- PST-007: publishedAt is auto-set on first transition to PUBLISHED; not modified on subsequent status changes. Manual override allowed via admin.
- PST-008: Markdown import always creates a DRAFT post; user must explicitly publish

### Contact Message
- CTM-001: A ContactMessage requires name, email, message, and GDPR consent
- CTM-002: Spam-detected submissions are silently accepted (201) but flagged; no auto-reply sent
- CTM-003: ContactMessage expires 12 months after creation (hard-deleted by cron)
- CTM-004: Soft-deleted messages are hard-deleted 30 days after deletion
- CTM-005: Auto-reply email is sent in the same locale as the form submission

### Experience
- EXP-001: Slug auto-generated from companyName + position.en, immutable after creation. Collision handled with numeric suffix
- EXP-002: Public endpoint excludes private fields (address lines, postal code, client metadata, audit fields)
- EXP-003: Default sort is startDate DESC; displayOrder overrides when > 0 (ORDER BY displayOrder ASC, startDate DESC)
- EXP-004: No ContentStatus — all non-deleted experiences are publicly visible
- EXP-005: Translatable fields use fallback chain: requested locale -> en -> first available
- EXP-006: ExperienceSkill uses replace strategy on update — deletes existing associations, inserts new set

### Project
- PRJ-001: Slug auto-generated from title (English), regenerated on title change. Collision handled with numeric suffix (-2, -3). Unique constraint at DB level.
- PRJ-002: Maximum 4 TechnicalHighlights per project
- PRJ-003: Public endpoints return only published + non-deleted projects
- PRJ-004: Featured query filters by featured=true + published + non-deleted
- PRJ-005: Child records (highlights, images, skills) use replace-all strategy on update — delete existing, insert new, within transaction
- PRJ-006: ProjectImage ordered by displayOrder; layout decides contextual placement (no placement hints in data)
- PRJ-007: SEO meta tags auto-generated from title + oneLiner — no manual override fields

### Profile
- PRF-001: Only one Profile exists (single-owner site)
- PRF-002: Profile uses upsert — create if not exists, update if exists. No separate create/update
- PRF-003: Public profile endpoint excludes private fields (phone, postal code, address lines)
- PRF-004: Translatable fields fall back: requested locale → en → first available
- PRF-005: Social links, certifications, and openTo are validated JSON arrays (not free-form)

### Upload Media
- **Trigger:** Owner wants to upload an asset (image, document, video)
- **Actors:** Owner (via Console)
- **Happy path:**
  1. Owner selects a file and chooses a MediaFolder
  2. System validates file type and size
  3. System stores asset externally and records the Folder assignment
  4. Media becomes available in pickers filtered by that Folder
- **Error paths:**
  - Invalid file type or size: System rejects upload
- **End states:** Media stored with Folder, available in listings and pickers

## Rules

### Media
- MED-001: A Media asset belongs to exactly one MediaFolder, assigned at upload time and not changeable after
- MED-002: Filtering Media by Folder uses exact Folder match — a Media without a Folder only appears in unfiltered (show-all) listings
- MED-003: Soft-deleted Media is excluded from all listings and pickers unless explicitly requested

## Invariants
- The Landing Page only displays content that has been saved and is in a public-visible state
- All content changes go through Console — Landing Page is read-only for visitors
- Contact form submission is the only public write operation (no auth required)
- All message management (read, archive, delete) requires admin authentication

## Edge Cases
- **Post status transition:** Owner changes a Published Post to Draft — Post is immediately removed from public listing
- **Unlisted Post discovery:** An Unlisted Post URL shared externally remains accessible as long as status is Unlisted
- **Profile not yet created:** Landing page shows placeholder/coming soon content until admin creates Profile
- **Stale enum in socialLinks JSON:** If a SocialPlatform value is removed from enum, existing socialLinks JSON may contain stale values — validate gracefully, don't reject entire Profile
- **Markdown import with unsupported syntax:** Obsidian plugins (dataview, mermaid) produce syntax the editor can't render — stripped silently, user informed of what was removed
- **Post with inline images deleted from Media:** Content references Cloudinary URLs that may be deleted — broken images display placeholder. No cascading delete from Media to post content.

## Changelog
- [2026-04-19] Added Media domain — glossary (Media, MediaFolder), Upload Media flow, rules MED-001 to MED-003. Fixed: folder stored as explicit DB column, not derived from publicId.
- [2026-03-31] Expanded Post domain — added Import Markdown Post flow, added rules PST-006 to PST-008 (readTime, publishedAt, import=draft), added edge cases (unsupported markdown syntax, inline image deletion)
- [2026-03-31] Added Project domain — updated glossary (Project expanded, removed ProjectDetail/Technology, added TechnicalHighlight, ProjectImage, ProjectSkill), added Manage Projects flow, added rules PRJ-001 to PRJ-007
- [2026-03-29] Added Experience domain — updated glossary (Experience expanded, EmploymentType, LocationType, ExperienceSkill), added Manage Work History flow, added rules EXP-001 to EXP-006
- [2026-03-29] Expanded Profile domain — updated glossary (Certification, SocialLink, TranslatableJson), refined Update Personal Info flow (upsert, JSON-LD), added rules PRF-002 to PRF-005, edge cases (profile not created, stale enum)
- [2026-03-29] Added ContactMessage domain — glossary (ContactMessage, ContactPurpose, ContactMessageStatus, EmailTemplate), flows (Receive + Manage), rules (CTM-001 to CTM-005), invariants (public write, admin auth)
- [2026-03-27] Created — initial domain model with content management and blog flows
