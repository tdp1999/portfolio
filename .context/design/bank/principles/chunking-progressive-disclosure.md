---
name: Chunking & Progressive Disclosure
category: principle
tags: [cognitive-load, forms, information-architecture]
---

## Statement
Break complex content into a small number of meaningful groups, and reveal advanced
or rarely-needed detail only on demand — both reduce cognitive load and improve
completion rates.

## Key Takeaways
- Working memory holds ~4 chunks reliably; design accordingly
- Showing every option at once trades completeness for paralysis
- Progressive disclosure works only when the first level covers the 80% case
- Chunking requires meaningful grouping — arbitrary splits hurt more than help
- 69% of users abandon forms due to usability issues (Baymard) — chunking is one
  of the highest-leverage mitigations

## Application in UI
- Group long forms into 4–8 sections, each with 3–8 fields
- Section name = short noun answering one user question ("Who am I?", "What do I do?")
- Place required / high-priority sections first
- Use "Show advanced" toggle to hide ~60–70% of rarely-used fields
- Use conditional fields that appear only when a trigger is set
- For dynamic lists (skills, links), use inline "+ Add another"
- Provide section-level status indicators: ✓ saved · ● editing · ⚠ error · ○ untouched
- Mutually exclusive, collectively exhaustive section labels (Nielsen)

## Sources
- [NN/G — Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/)
- [NN/G — 4 Principles to Reduce Cognitive Load in Forms](https://www.nngroup.com/articles/4-principles-reduce-cognitive-load/)
- [Interaction Design Foundation — Progressive Disclosure (2026)](https://ixdf.org/literature/topics/progressive-disclosure)
- [Baymard — Avoid Extensive Multi-Column Layouts](https://baymard.com/blog/avoid-multi-column-forms)
