# Database Architecture Requirements Questionnaire

This questionnaire will help design a robust, scalable, and extendable database architecture for the portfolio project.

---

## 1. Functional Requirements

**Core Entities & Use Cases:**
- What are the primary business entities? (e.g., Users, Projects, Blog Posts, Contact Messages, Skills, Experience, Testimonials)
- Is this purely a portfolio showcase, or will it have interactive features (comments, likes, contact forms, analytics)?
- Will there be an admin interface for content management?
- Do you need multi-tenancy (multiple portfolios) or single-user?

---

## 2. Data Characteristics

**Volume & Growth:**
- Expected number of portfolio items/projects to display?
- Will you store media (images, videos) metadata or actual files?
- Do you anticipate user-generated content (comments, messages)?
- Growth projection: static content vs. dynamic/growing data?

---

## 3. Access Patterns

**Read vs. Write:**
- Portfolio sites are typically read-heavy. Confirm this assumption?
- What are the most frequent queries? (e.g., "get all projects by category", "get latest blog posts", "search by skill/tag")
- Any complex queries like full-text search, filtering by multiple criteria, or aggregations?
- Do you need pagination, infinite scroll, or cursor-based navigation?

---

## 4. Performance & Consistency

**Latency & Throughput:**
- Target response time for API calls? (e.g., <100ms, <500ms)
- Expected concurrent users? (portfolio sites typically low, but spikes possible)
- Strong consistency required, or is eventual consistency acceptable for some data?
- Caching strategy preferences? (Redis, CDN, in-memory)

---

## 5. Compliance & Security

**Regulations & Data Protection:**
- Will you collect PII (emails, names from contact forms)?
- GDPR compliance needed? (EU visitors)
- Data retention policies? (how long to keep contact messages, analytics)
- Encryption requirements? (at-rest, in-transit)
- Audit logging needed?

---

## 6. Integration & Future-Proofing

**External Systems:**
- Sync with GitHub API for project data?
- Integration with CMS (headless CMS like Strapi, Sanity)?
- Analytics integration (custom vs. third-party)?
- Will an LLM/AI need to crawl or query this data?
- Webhook support for external notifications?
- Future mobile app considerations?

---

## 7. Technical Constraints

**Given your current stack (NestJS, Angular, Nx):**
- Database preference? (PostgreSQL, MongoDB, SQLite for simplicity)
- ORM preference? (Prisma, TypeORM, Drizzle, MikroORM)
- Hosting environment? (Vercel, Railway, self-hosted, cloud provider)
- Budget constraints affecting database choice?

---

## How to Answer

Fill in your answers below each question, or create a response section at the bottom. Once completed, we can proceed with the database schema design.

### Your Answers:

<!-- Add your answers here -->
