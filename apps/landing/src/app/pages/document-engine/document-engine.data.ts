import type { TranslatableJson } from '@portfolio/shared/types';

/**
 * Static facts for the hero's bottom row. The live ones (versions, downloads,
 * last commit) are NOT here — they are fetched, and a hardcoded copy would only
 * ever be a number waiting to go stale.
 *
 * `id` is the stable key the template branches on (the Status fact gets a live
 * dot); label and value are both translatable so the strip localises with the
 * rest of the page. The VI wiring is interim — it uses the existing `locale()` +
 * `getLocalized` pattern and migrates to the task 388 JSON source when that lands.
 */
export interface HeroFact {
  readonly id: 'licence' | 'status';
  readonly label: TranslatableJson;
  readonly value: TranslatableJson;
}

export const HERO_FACTS: readonly HeroFact[] = [
  { id: 'licence', label: { en: 'Licence', vi: 'Giấy phép' }, value: { en: 'MIT', vi: 'MIT' } },
  { id: 'status', label: { en: 'Status', vi: 'Trạng thái' }, value: { en: 'Live', vi: 'Đang chạy' } },
];

/**
 * Stands in for the logo wall a commercial product page opens with. There are no
 * customer logos to show, so this says only what is true and verifiable instead.
 */
export const PROOF_CLAIMS: readonly TranslatableJson[] = [
  { en: 'Published on npm', vi: 'Đã publish trên npm' },
  { en: 'Powers every word on this site', vi: 'Chạy mọi con chữ trên trang này' },
  { en: 'Framework-free document core', vi: 'Document core không phụ thuộc framework' },
  { en: 'Structured JSON, never an HTML blob', vi: 'JSON có cấu trúc, không phải một cục HTML' },
];

/** Public source. Both packages ship from this one repository. */
export const REPO_SLUG = 'phuong-tran-redoc/document-engine';
export const REPO_URL = `https://github.com/${REPO_SLUG}`;

/**
 * The two published packages.
 *
 * Version and download numbers are deliberately NOT hardcoded here. A pinned
 * version is a number that starts rotting the moment it is written, and on a
 * page whose entire argument is "these are real, published packages" a stale
 * badge does active damage. They are fetched live from the npm registry in the
 * browser instead, and simply do not render if the lookup fails.
 *
 * `name`, `shortName` and `label` stay language-neutral (package names and the
 * one-word badge key are technical identifiers); only `role` is translatable.
 */
export interface EnginePackage {
  readonly name: string;
  /** Scope-free name, for places where the full string would dominate the line. */
  readonly shortName: string;
  /**
   * The one word that distinguishes this package from the other one, for the
   * hero badges. Both published names share the `document-engine-` stem, so in a
   * badge that already sits under a `Packages` label on a page called Document
   * Engine, the stem is nine characters of pure repetition — it pushed the live
   * version and download figures, which are the only part a reader is scanning
   * for, out past the badge's own edge.
   */
  readonly label: string;
  readonly role: TranslatableJson;
  readonly npmUrl: string;
}

export const PACKAGES: readonly EnginePackage[] = [
  {
    name: '@phuong-tran-redoc/document-engine-core',
    shortName: 'document-engine-core',
    label: 'core',
    role: {
      en: 'Framework-free. Owns the document model, the schema versioning, and the migration path between versions.',
      vi: 'Không phụ thuộc framework. Làm chủ document model, việc schema versioning, và đường migrate giữa các version.',
    },
    npmUrl: 'https://www.npmjs.com/package/@phuong-tran-redoc/document-engine-core',
  },
  {
    name: '@phuong-tran-redoc/document-engine-angular',
    shortName: 'document-engine-angular',
    label: 'angular',
    role: {
      en: 'The Angular binding. Editor component, directives, and configuration. Swap this layer to target another framework.',
      vi: 'Lớp binding cho Angular. Editor component, các directive, và cấu hình. Đổi lớp này để nhắm tới một framework khác.',
    },
    npmUrl: 'https://www.npmjs.com/package/@phuong-tran-redoc/document-engine-angular',
  },
];

/**
 * Why it exists. Deliberately generic: the problem is common to any regulated
 * industry that generates documents from templates, and naming a client would
 * add nothing a reader needs. Ordered so the one the author lived with first —
 * customisation — leads.
 */
export interface EngineProblem {
  readonly title: TranslatableJson;
  readonly body: TranslatableJson;
}

export const PROBLEMS: readonly EngineProblem[] = [
  {
    title: { en: 'Customisation hits a ceiling', vi: 'Customization chạm trần' },
    body: {
      en: 'Regulated document work runs on rules a general-purpose editor never shipped: which fields a person may touch, what stays locked, how a placeholder resolves. Past a point you are working around the vendor’s model instead of with it.',
      vi: 'Công việc tài liệu trong các ngành bị kiểm soát chặt vận hành trên những quy tắc mà một editor phổ thông không bao giờ có sẵn: field nào người dùng được đụng, phần nào phải khoá cứng, một placeholder được resolve ra sao. Quá một mức, bạn phải lách quanh mô hình của nhà cung cấp thay vì làm việc thuận theo nó.',
    },
  },
  {
    title: { en: 'Licence cost that never ends', vi: 'Chi phí licence không có điểm dừng' },
    body: {
      en: 'Commercial editors bill every year, per seat or per domain, for as long as the product lives. It is a line item that only ever grows.',
      vi: 'Các editor thương mại tính tiền hằng năm, theo từng seat hoặc từng domain, suốt vòng đời của sản phẩm. Đó là một khoản chi chỉ có tăng chứ không giảm.',
    },
  },
  {
    title: { en: 'A dependency you cannot see into', vi: 'Một dependency bạn không nhìn được vào bên trong' },
    body: {
      en: 'When the component that produces legally binding documents is one you cannot read, every integration is a negotiation and every upgrade carries risk.',
      vi: 'Khi cái component tạo ra những tài liệu có giá trị pháp lý lại là thứ bạn không đọc được mã, mỗi lần tích hợp là một cuộc thương lượng và mỗi lần nâng cấp là một rủi ro.',
    },
  },
];

/**
 * `name` is a feature term kept in English across locales (Dynamic fields,
 * Restricted editing, …); only the explanatory `body` translates.
 */
export interface EngineFeature {
  readonly name: string;
  readonly body: TranslatableJson;
}

/** Verified against the published packages, not aspirational. */
export const FEATURES: readonly EngineFeature[] = [
  {
    name: 'Dynamic fields',
    body: {
      en: 'Placeholders such as {{customer_name}} live in the document as real nodes, not as text a regex has to find later.',
      vi: 'Những placeholder như {{customer_name}} nằm trong tài liệu dưới dạng node thật, không phải đoạn text để một regex đi tìm lại sau.',
    },
  },
  {
    name: 'Restricted editing',
    body: {
      en: 'Mark regions the author may change and regions they may not. The lock is part of the document, so it survives a round-trip.',
      vi: 'Đánh dấu vùng tác giả được sửa và vùng không được sửa. Cái khoá là một phần của tài liệu, nên nó sống sót qua một vòng round-trip.',
    },
  },
  {
    name: 'Read-only presentation',
    body: {
      en: 'The same document renders as a finished, non-editable artefact without a second renderer to keep in sync.',
      vi: 'Cùng một tài liệu render ra thành một bản hoàn chỉnh, không sửa được, mà không cần một renderer thứ hai phải đồng bộ theo.',
    },
  },
  {
    name: 'Tables',
    body: {
      en: 'Create and edit tables inline, stored structurally rather than as nested markup.',
      vi: 'Tạo và sửa bảng ngay tại chỗ, lưu theo cấu trúc chứ không phải dưới dạng markup lồng nhau.',
    },
  },
  {
    name: 'Templates',
    body: {
      en: 'Start from a prepared document instead of an empty page, which is how document work actually begins.',
      vi: 'Bắt đầu từ một tài liệu dựng sẵn thay vì một trang trắng, đúng như cách công việc tài liệu thật sự bắt đầu.',
    },
  },
  {
    name: 'Structured data model',
    body: {
      en: 'A document is JSON with a schema version, so it can be queried, diffed, migrated, and rendered anywhere. Not an HTML string.',
      vi: 'Một tài liệu là JSON kèm schema version, nên có thể query, diff, migrate và render ở bất cứ đâu. Không phải một HTML string.',
    },
  },
];

/** Preset actions on the live demo, for readers who are not going to explore a toolbar. */
export interface DemoPreset {
  readonly id: 'field' | 'table' | 'reset' | 'clear';
  readonly label: TranslatableJson;
  readonly hint: TranslatableJson;
}

export const DEMO_PRESETS: readonly DemoPreset[] = [
  {
    id: 'field',
    label: { en: 'Insert a dynamic field', vi: 'Chèn một dynamic field' },
    hint: { en: 'Adds a {{customer_name}} placeholder', vi: 'Thêm một placeholder {{customer_name}}' },
  },
  {
    id: 'table',
    label: { en: 'Load a template', vi: 'Nạp một template' },
    hint: { en: 'Replaces the document with a prepared one', vi: 'Thay tài liệu bằng một bản dựng sẵn' },
  },
  // A prepared document is a good opening, and a bad place to *try* something.
  // Blank is the only state where what appears in the stored panel is provably
  // the reader's own typing rather than something that was already there.
  {
    id: 'clear',
    label: { en: 'Clear all', vi: 'Xoá hết' },
    hint: { en: 'Empties the editor so you can type your own', vi: 'Dọn trống editor để bạn tự gõ' },
  },
  {
    id: 'reset',
    label: { en: 'Reset', vi: 'Đặt lại' },
    hint: { en: 'Back to the starting document', vi: 'Về lại tài liệu ban đầu' },
  },
];
