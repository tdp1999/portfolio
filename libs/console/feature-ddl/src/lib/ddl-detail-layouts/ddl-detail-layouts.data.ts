/** Prototype fixtures for the detail-layout study. Content mirrors the real
 * `projects` records so the density problem shows up honestly: one record with
 * every field filled (long bilingual prose + 3 highlights + gallery), one with
 * almost nothing. */

export interface Bilingual {
  en: string;
  vi: string;
}

export interface DemoHighlight {
  title: string;
  challenge: string;
  approach: string;
  outcome: string;
  codeUrl: string | null;
}

export interface DemoRecord {
  title: string;
  slug: string;
  status: 'PUBLISHED' | 'DRAFT';
  featured: boolean;
  displayOrder: number;
  period: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  oneLiner: Bilingual;
  motivation: Bilingual;
  description: Bilingual;
  role: Bilingual;
  highlights: DemoHighlight[];
  thumbnailUrl: string | null;
  images: { url: string; alt: string }[];
  links: { type: string; label: string; url: string }[];
  skills: string[];
}

export const RICH_RECORD: DemoRecord = {
  title: 'Loan Document Engine',
  slug: 'loan-document-engine',
  status: 'PUBLISHED',
  featured: true,
  displayOrder: 2,
  period: 'May 2023 — Feb 2024',
  createdAt: '12 Jun 2026, 09:14',
  updatedAt: '2 days ago',
  updatedBy: 'Phuong Tran',
  oneLiner: {
    en: 'A templating and generation engine for regulated loan documents: bilingual PDFs, every field traceable to an audit trail, built to survive a compliance review.',
    vi: 'Engine sinh tài liệu vay có kiểm soát: PDF song ngữ, mọi trường đều truy vết được, đủ chuẩn cho một đợt rà soát tuân thủ.',
  },
  motivation: {
    en: 'Regulated documents are where a small rendering bug becomes a legal problem. I find that kind of high-stakes plumbing genuinely satisfying: real consequences, real users.',
    vi: 'Tài liệu pháp lý là nơi một lỗi render nhỏ trở thành vấn đề pháp lý. Mình thấy loại công việc nền tảng nhiều rủi ro đó rất đáng làm.',
  },
  description: {
    en: 'A document engine that turns loan data into regulated, bilingual PDFs from versioned templates. Every generated field carries a trail back to its source value and the template revision that produced it, so a document can be defended months later. It replaced a brittle copy-paste-into-Word ritual that no one wanted to own, and it now backs every disbursement letter the product sends.',
    vi: 'Engine biến dữ liệu khoản vay thành PDF song ngữ theo template có phiên bản. Mỗi trường sinh ra đều truy vết được về giá trị gốc và bản template đã tạo ra nó, nên tài liệu vẫn bảo vệ được sau nhiều tháng.',
  },
  role: {
    en: 'Frontend and template-pipeline engineer. I owned the template authoring UI and the bilingual layout system, and built the round-trip between editable templates and the generation service.',
    vi: 'Kỹ sư frontend và pipeline template. Mình phụ trách giao diện soạn template, hệ thống layout song ngữ, và vòng round-trip giữa template và service sinh tài liệu.',
  },
  highlights: [
    {
      title: 'Bilingual layout that never overflows',
      challenge:
        'The same clause runs 40% longer in the local script than in English, and legal required both columns to stay aligned page by page.',
      approach:
        'Measured every block server-side before pagination, then reflowed the pair as a unit instead of laying out each language independently.',
      outcome: 'Zero overflow defects across 12k generated documents in the first quarter.',
      codeUrl: 'https://github.com/example/doc-engine/blob/main/src/layout/pair.ts',
    },
    {
      title: 'Field-level audit trail',
      challenge:
        'Compliance had to answer "where did this number come from" months after a document was signed, and nobody could.',
      approach:
        'Attached a source pointer plus template revision to every rendered field and persisted it alongside the PDF as a sidecar record.',
      outcome: 'Review time for a disputed document dropped from days to minutes.',
      codeUrl: null,
    },
    {
      title: 'Template versioning without breaking history',
      challenge: 'Editing a live template silently changed how old documents would re-render.',
      approach: 'Made templates immutable on publish and pinned each generated document to the exact revision used.',
      outcome: 'Historical re-renders are now byte-identical to the original.',
      codeUrl: 'https://github.com/example/doc-engine/blob/main/src/templates/revision.ts',
    },
  ],
  thumbnailUrl: 'https://picsum.photos/seed/thumb-loan-document-engine/1200/800',
  images: [
    { url: 'https://picsum.photos/seed/doc-1/400/300', alt: 'Template editor' },
    { url: 'https://picsum.photos/seed/doc-2/400/300', alt: 'Generated PDF preview' },
    { url: 'https://picsum.photos/seed/doc-3/400/300', alt: 'Audit trail panel' },
    { url: 'https://picsum.photos/seed/doc-4/400/300', alt: 'Revision history' },
  ],
  links: [
    { type: 'repo', label: 'Source on GitHub', url: 'https://github.com/example/doc-engine' },
    { type: 'demo', label: 'Live demo', url: 'https://example.com/demo' },
    { type: 'case-study', label: 'Write-up', url: 'https://example.com/case-study' },
  ],
  skills: ['TypeScript', 'Angular', 'NestJS', 'Prisma', 'Postgres', 'ProseMirror', 'Playwright', 'Nx'],
};

export const SPARSE_RECORD: DemoRecord = {
  title: 'Untitled project',
  slug: 'untitled-project',
  status: 'DRAFT',
  featured: false,
  displayOrder: 0,
  period: 'Mar 2026 — Present',
  createdAt: '18 Jul 2026, 16:02',
  updatedAt: '4 minutes ago',
  updatedBy: 'Phuong Tran',
  oneLiner: { en: 'An internal tool for scheduling deploys.', vi: '' },
  motivation: { en: '', vi: '' },
  description: { en: '', vi: '' },
  role: { en: '', vi: '' },
  highlights: [],
  thumbnailUrl: null,
  images: [],
  links: [],
  skills: ['Angular'],
};

/** The common real case: neither full nor empty. Story is half-written, one
 * highlight is a stub, the Vietnamese side trails the English one. This is the
 * record shape the layout has to handle *gracefully*, not the two extremes. */
export const PARTIAL_RECORD: DemoRecord = {
  ...RICH_RECORD,
  title: 'SME Loan Operations Dashboard',
  slug: 'sme-loan-operations-dashboard',
  status: 'DRAFT',
  featured: false,
  displayOrder: 5,
  period: 'Apr 2022 — Mar 2023',
  updatedAt: '6 hours ago',
  oneLiner: {
    en: 'The operations cockpit for an SME lending team: pipeline, exceptions, and ageing in one screen.',
    vi: 'Bảng điều khiển vận hành cho đội cho vay SME: pipeline, ngoại lệ và tuổi nợ trên cùng một màn hình.',
  },
  motivation: {
    en: 'I sat with the ops team for a week before writing a line. Their real bottleneck was finding the few cases that were stuck, not staring at totals.',
    vi: '',
  },
  description: { en: '', vi: '' },
  role: {
    en: 'Frontend engineer. I built the dashboard views and tuned the queries behind the slowest screen.',
    vi: '',
  },
  highlights: [
    {
      title: 'Exception queue that surfaces the stuck cases',
      challenge:
        'The old dashboard showed totals. Nobody could answer "which twelve applications will breach SLA today" without exporting to a spreadsheet.',
      approach:
        'Modelled ageing as a first-class query and put the breach window on the server so the list is the same for everyone looking at it.',
      outcome: 'The morning spreadsheet ritual stopped in the first week.',
      codeUrl: null,
    },
    {
      title: 'Query tuning on the ageing screen',
      challenge: 'The ageing screen took eleven seconds to load and the team had stopped opening it.',
      approach: '',
      outcome: '',
      codeUrl: null,
    },
  ],
  images: [],
  links: [{ type: 'case-study', label: 'Internal write-up', url: 'https://example.com/sme-dashboard' }],
  skills: ['Angular', 'Angular Material', 'TypeScript', 'SCSS', 'Postgres'],
};
