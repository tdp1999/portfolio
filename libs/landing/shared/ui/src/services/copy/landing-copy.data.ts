import type { LandingCopyEntry } from './landing-copy.types';

/**
 * THE single source for landing's **static UI copy** (task 388 / ADR-0xx).
 *
 * Scope — strings that live in code: labels, ledes, button text, states, hints,
 * errors, breadcrumbs, aria labels. **Not** authored content from the API
 * (`Profile.*`, `project.oneLiner`, …) — that stays on `translatable` /
 * `getLocalized`, with prod as its source of truth.
 *
 * Read it through {@link LandingCopyService.t} in TypeScript or the
 * `landingCopy` pipe in templates. Never index this object directly in a
 * component — the resolver owns the fallback chain.
 *
 * **When NOT to add a key.** HTML-rich copy (an `<em>` accent, an inline
 * `<landing-link>`, a list) stays in `<landing-t>`; a dictionary of strings
 * cannot hold markup without reintroducing an HTML-in-JSON sanitizing problem.
 * Index-addressed lists (month names) also stay as arrays where they are read.
 *
 * Each entry carries the `file:line` it came from so the origin stays findable
 * after migration.
 */
export const LANDING_COPY = {
  // ── Page names ────────────────────────────────────────────────────────────
  /**
   * One entry per page, shared by **four** surfaces: breadcrumbs, the header
   * nav, the footer site-map, and the command palette. Namespaced `page` rather
   * than `breadcrumb` on purpose — whoever adds a nav item next must land here
   * instead of minting a second copy of the same word.
   */
  'common.page.home': { en: 'Home', vi: 'Trang chủ' },
  'common.page.about': { en: 'About', vi: 'Về mình' },
  'common.page.projects': { en: 'Projects', vi: 'Dự án' },
  /** the /blog route reads as "Blog" in nav, "Writing" as a breadcrumb crumb */
  'common.page.blog': { en: 'Blog', vi: 'Blog' },
  'common.page.writing': { en: 'Writing', vi: 'Bài viết' },
  'common.page.contact': { en: 'Contact', vi: 'Liên hệ' },
  'common.page.terms': { en: 'Terms', vi: 'Điều khoản' },
  'common.page.privacy': { en: 'Privacy', vi: 'Bảo mật' },
  'common.page.notFound': { en: 'Not found', vi: 'Không tìm thấy' },
  /** proper nouns — the page name is the same in both languages */
  'common.page.colophon': { en: 'Colophon', vi: 'Colophon' },
  'common.page.uses': { en: 'Uses', vi: 'Uses' },
  'common.page.version': { en: 'Version', vi: 'Version' },
  /** product names — never translated */
  'common.page.documentEngine': { en: 'Document Engine', vi: 'Document Engine' },
  'common.page.ddl': { en: 'DDL', vi: 'DDL' },

  /** copy-to-clipboard button, shared by /contact and /document-engine */
  'common.copy': { en: 'Copy', vi: 'Sao chép' },
  'common.copied': { en: 'Copied', vi: 'Đã sao chép' },
  /** blog share row — copies the post's absolute URL */
  'common.copyLink': { en: 'Copy link', vi: 'Sao chép liên kết' },
  /** in-page nav label — legal pages, blog detail, project detail */
  'common.onThisPage': { en: 'On this page', vi: 'Trong trang này' },
  /** busy state, shared by load-more, spinners and the /version meta strip */
  'common.loading': { en: 'Loading…', vi: 'Đang tải…' },
  /**
   * Prefix before a `<time>` element in a meta strip. Read by the /about hero,
   * /uses and /colophon — `common` rather than `about.hero` so the next page
   * with a "last updated" line lands here instead of minting a fourth copy.
   */
  'common.lastUpdated': { en: 'Last updated', vi: 'Cập nhật lần cuối' },

  // ── SEO metadata ──────────────────────────────────────────────────────────
  // `<title>` and `<meta name="description">` for every page that sets its own.
  //
  // Two conventions hold across all of them:
  // 1. **The author's name follows the locale**: `Phuong Tran` in English titles,
  //    `Phương Trần` in Vietnamese ones (see commit 9514dce7).
  // 2. **A description stays a full description.** These are not on-page ledes —
  //    a search result with one clause under it tells a reader nothing, so the
  //    long form is correct here even where the page's visible lede is one line.
  //
  // Caveat worth knowing: SSR resolves the locale to `en` (LandingLocaleService
  // has no server-side cookie read yet), so a crawler only ever sees the English
  // half. Real bilingual SEO needs per-locale URLs plus `hreflang` — a separate
  // piece of work. These entries are here so there is one source per string, not
  // because they make the site bilingual to Google today.
  'site.meta.title': { en: 'Phuong Tran | Frontend Engineer', vi: 'Phương Trần | Frontend Engineer' },
  'site.meta.description': {
    en: 'The portfolio of Phuong Tran, a Frontend Engineer building complex, production-grade web platforms for banking and fintech with Angular and TypeScript.',
    vi: 'Portfolio của Phương Trần, một Frontend Engineer xây những nền tảng web phức tạp, đạt chuẩn production cho ngành ngân hàng và fintech bằng Angular và TypeScript.',
  },
  'projects.meta.title': { en: 'Projects | Phuong Tran', vi: 'Dự án | Phương Trần' },
  'projects.meta.description': {
    en: 'Full archive of projects by Phuong Tran: what I have shipped, built, and learned from.',
    vi: 'Toàn bộ danh mục dự án của Phương Trần: những gì mình đã ship, đã dựng, và đã học được.',
  },
  'blog.meta.title': { en: 'Writing | Phuong Tran', vi: 'Bài viết | Phương Trần' },
  'blog.meta.description': {
    en: 'Long-form deep-dives, short notes, and the occasional retro from building this portfolio.',
    vi: 'Bài phân tích dài, ghi chú ngắn, và đôi khi là bài tổng kết từ quá trình dựng portfolio này.',
  },
  'uses.meta.title': { en: 'Uses | Phuong Tran', vi: 'Uses | Phương Trần' },
  'uses.meta.description': {
    en: 'Hardware, editor, terminal, CLI, browser, and fonts I reach for daily.',
    vi: 'Thiết bị, editor, terminal, CLI, trình duyệt, và font chữ mình dùng mỗi ngày.',
  },
  'colophon.meta.title': { en: 'Colophon | Phuong Tran', vi: 'Colophon | Phương Trần' },
  'colophon.meta.description': {
    en: 'The stack, tools, and sources behind this site, credited honestly.',
    vi: 'Stack, công cụ, và nguồn tham khảo đứng sau trang này, ghi công đầy đủ.',
  },
  'contact.meta.title': { en: 'Get in touch | Phuong Tran', vi: 'Liên hệ | Phương Trần' },
  'contact.meta.description': {
    en: 'Reach out about a full-time role, a freelance project, collaboration, press, or just to say hi. Usually reply within a few days.',
    vi: 'Nhắn mình về một vị trí full-time, một dự án freelance, chuyện hợp tác, báo chí, hoặc chỉ để chào một tiếng. Mình thường phản hồi trong vài ngày.',
  },
  'documentEngine.meta.title': { en: 'Document Engine | Phuong Tran', vi: 'Document Engine | Phương Trần' },
  'documentEngine.meta.description': {
    en: 'A headless document editor built as two packages: a framework-free core that owns the document model, and an Angular binding. Try it live.',
    vi: 'Một document editor headless dựng thành hai package: phần core không phụ thuộc framework làm chủ document model, và một lớp binding cho Angular. Dùng thử ngay.',
  },
  'version.meta.title': { en: 'Version | Phuong Tran', vi: 'Version | Phương Trần' },

  // ── Generic components, own defaults (pagination.ts:24, load-more.ts:21, …) ─
  /**
   * These are component **defaults**, resolved inside the component rather than
   * passed down by each caller. An `input()` override still wins; the point is
   * that a new caller inherits both languages instead of silently shipping
   * English. See `.context/landing-i18n.md` §3.
   */
  'common.pagination.prev': { en: 'Prev', vi: 'Trước' },
  'common.pagination.next': { en: 'Next', vi: 'Sau' },
  'common.loadMore': { en: 'Load more', vi: 'Tải thêm' },
  'common.showing': { en: 'Showing {loaded} of {total}', vi: 'Đang xem {loaded} trong {total}' },
  'common.showMore': { en: 'See more', vi: 'Xem thêm' },
  'common.showLess': { en: 'See less', vi: 'Thu gọn' },
  'common.select.placeholder': { en: 'Select…', vi: 'Chọn…' },
  /** native `title=` tooltip on a section-heading anchor */
  'common.heading.copyLink': { en: 'Copy link to this section', vi: 'Sao chép liên kết tới mục này' },

  /**
   * View-toggle options, shared by /projects and /blog. `label` becomes the
   * button's aria-label, `desc` the visible tooltip. One set because the two
   * pages had drifted into two different tooltip wordings for the same two modes.
   */
  'common.view.row': { en: 'Row', vi: 'Hàng' },
  'common.view.row.desc': {
    en: 'List view: title + meta dominant.',
    vi: 'Xem dạng danh sách: tiêu đề và thông tin phụ là chính.',
  },
  'common.view.grid': { en: 'Grid', vi: 'Lưới' },
  'common.view.grid.desc': {
    en: 'Grid view: cover-dominant cards.',
    vi: 'Xem dạng lưới: thẻ lấy ảnh bìa làm chính.',
  },
  'common.view.timeline': { en: 'Timeline', vi: 'Dòng thời gian' },
  'common.view.timeline.desc': {
    en: 'Timeline view, grouped by year.',
    vi: 'Xem dạng dòng thời gian, nhóm theo năm.',
  },
  'common.sort.newest': { en: 'Newest', vi: 'Mới nhất' },
  'common.sort.oldest': { en: 'Oldest', vi: 'Cũ nhất' },
  /**
   * Result counts. `unit` arrives already localized from the caller, in two forms
   * because English inflects for number and Vietnamese does not — a Vietnamese
   * caller passes the same noun twice. This replaced a hardcoded `${unit}s`,
   * which was English morphology baked into a shared component.
   */
  'common.results.filtered': { en: 'Showing {v} of {t} {unit}', vi: 'Đang xem {v} trong {t} {unit}' },
  'common.results.unit.one': { en: 'item', vi: 'mục' },
  'common.results.unit.other': { en: 'items', vi: 'mục' },
  'projects.unit.one': { en: 'project', vi: 'dự án' },
  'projects.unit.other': { en: 'projects', vi: 'dự án' },
  'blog.unit.one': { en: 'post', vi: 'bài viết' },
  'blog.unit.other': { en: 'posts', vi: 'bài viết' },

  // ── Accessibility labels ──────────────────────────────────────────────────
  /**
   * Text only assistive technology reads: `aria-label` on landmarks and
   * icon-only controls, plus `sr-only` section headings. Invisible on screen,
   * which is exactly why it drifted — nobody proofreads what nobody sees.
   *
   * Two rules specific to this block:
   *
   * 1. **A UI term a Vietnamese speaker already says in English stays English.**
   *    `slide`, `carousel`, `panel`, `editor`, `menu`, `tab`, `Stack`, `build`
   *    are the words a Vietnamese developer and user actually use; inventing
   *    `bản chiếu` or `băng chuyền ảnh` would make a screen reader *less*
   *    intelligible, not more. Only genuinely everyday words get translated.
   * 2. **A landmark label is not a heading.** It answers "what region am I in",
   *    so it stays a noun phrase — never a sentence, never punctuation.
   *
   * Surface-specific labels (a section landmark on one page, a share button)
   * live in that page's block instead, next to the visible copy they sit beside.
   */
  /** landmark names — `<nav aria-label>` / `<section aria-label>` */
  'a11y.nav.primary': { en: 'Primary', vi: 'Điều hướng chính' },
  'a11y.nav.breadcrumb': { en: 'Breadcrumb', vi: 'Đường dẫn trang' },
  'a11y.nav.pagination': { en: 'Pagination', vi: 'Phân trang' },
  'a11y.nav.sections': { en: 'Section navigation', vi: 'Điều hướng theo mục' },
  'a11y.nav.minimap': { en: 'Mini-map', vi: 'Bản đồ thu nhỏ' },
  'a11y.nav.siteMap': { en: 'Site map', vi: 'Sơ đồ trang' },
  'a11y.nav.siteMenu': { en: 'Site menu', vi: 'Menu của trang' },

  /** icon-only buttons */
  'a11y.button.close': { en: 'Close', vi: 'Đóng' },
  'a11y.button.openMenu': { en: 'Open menu', vi: 'Mở menu' },
  'a11y.button.closeMenu': { en: 'Close menu', vi: 'Đóng menu' },
  'a11y.button.switchLanguage': { en: 'Switch language', vi: 'Đổi ngôn ngữ' },
  'a11y.button.prevPage': { en: 'Previous page', vi: 'Trang trước' },
  'a11y.button.nextPage': { en: 'Next page', vi: 'Trang sau' },
  'a11y.button.scrollToTop': { en: 'Scroll to top', vi: 'Cuộn lên đầu trang' },
  'a11y.button.clearInput': { en: 'Clear input', vi: 'Xóa nội dung đã nhập' },
  'a11y.button.scrollTabsLeft': { en: 'Scroll tabs left', vi: 'Cuộn dải tab sang trái' },
  'a11y.button.scrollTabsRight': { en: 'Scroll tabs right', vi: 'Cuộn dải tab sang phải' },
  'a11y.button.themeToLight': { en: 'Switch to light theme', vi: 'Chuyển sang giao diện sáng' },
  'a11y.button.themeToDark': { en: 'Switch to dark theme', vi: 'Chuyển sang giao diện tối' },
  /**
   * `{v}` is the value itself, not a noun for it — the label reads "Copy
   * hello@example.com", so a screen-reader user hears what lands on the
   * clipboard instead of a generic "Copy".
   */
  'a11y.button.copyValue': { en: 'Copy {v}', vi: 'Sao chép {v}' },

  /** progress bars — `role="progressbar"` needs a name of its own */
  'a11y.progress.reading': { en: 'Reading progress', vi: 'Tiến độ đọc' },
  'a11y.progress.loadingPage': { en: 'Loading next page', vi: 'Đang tải trang tiếp theo' },

  /** command palette + any search field */
  'a11y.search': { en: 'Search', vi: 'Tìm kiếm' },
  'a11y.search.query': { en: 'Search query', vi: 'Từ khóa tìm kiếm' },
  'a11y.search.clear': { en: 'Clear search', vi: 'Xóa từ khóa tìm kiếm' },
  /** the palette trigger names its own shortcut: `Open command palette (⌘+K)` */
  'a11y.palette.open': { en: 'Open command palette ({v})', vi: 'Mở command palette ({v})' },

  /**
   * Carousel and lightbox. `aria-roledescription="carousel"` / `"slide"` stay
   * hardcoded English in the templates on purpose: they override the *role* a
   * screen reader announces, and both words are the ones Vietnamese speakers
   * use for these widgets anyway.
   */
  'a11y.carousel.default': { en: 'Image carousel', vi: 'Carousel ảnh' },
  'a11y.slide.position': { en: '{n} of {total}', vi: '{n} trong {total}' },
  /**
   * The `aria-live` region announced on every slide change. Says the word `Slide`
   * where `a11y.slide.position` (a slide's own name, read in context) does not —
   * a live region fires with no surrounding context to lean on.
   */
  'a11y.slide.live': { en: 'Slide {n} of {total}', vi: 'Slide {n} trong {total}' },
  'a11y.slide.prev': { en: 'Previous slide', vi: 'Slide trước' },
  'a11y.slide.next': { en: 'Next slide', vi: 'Slide sau' },
  'a11y.slide.choose': { en: 'Choose slide', vi: 'Chọn slide' },
  'a11y.slide.goTo': { en: 'Go to slide {n}', vi: 'Tới slide {n}' },
  'a11y.slide.show': { en: 'Show slide {n}', vi: 'Xem slide {n}' },
  'a11y.image.prev': { en: 'Previous image', vi: 'Ảnh trước' },
  'a11y.image.next': { en: 'Next image', vi: 'Ảnh sau' },
  'a11y.image.choose': { en: 'Choose image', vi: 'Chọn ảnh' },
  'a11y.image.show': { en: 'Show image {n}', vi: 'Xem ảnh {n}' },
  'a11y.image.zoomIn': { en: 'Zoom in', vi: 'Phóng to' },
  'a11y.image.zoomOut': { en: 'Zoom out', vi: 'Thu nhỏ' },
  'a11y.image.download': { en: 'Download image', vi: 'Tải ảnh về' },
  /** lightbox dialog name; `{alt}` appends the image's own description when it has one */
  'a11y.image.position': { en: 'Image {n} of {total}', vi: 'Ảnh {n} trong {total}' },

  /** grouped controls — `role="group"` / `role="radiogroup"` */
  'a11y.group.viewLayout': { en: 'View layout', vi: 'Cách hiển thị' },
  'a11y.group.categoryFilter': { en: 'Category filter', vi: 'Lọc theo chủ đề' },
  'a11y.group.sections': { en: 'Sections', vi: 'Các mục' },

  /** interactive globe on /contact — two names, one per interaction mode */
  'a11y.globe.interactive': { en: 'Globe, drag to rotate', vi: 'Quả địa cầu, kéo để xoay' },
  'a11y.globe.static': { en: 'Globe showing locations', vi: 'Quả địa cầu hiển thị các vị trí' },

  /** anchor button revealed on heading hover; `{v}` is the heading's slug */
  'a11y.heading.anchor': { en: 'Anchor link to {v}', vi: 'Liên kết tới mục {v}' },

  // ── Command palette (command-palette.html:39-81, .types.ts:28-137) ─────────
  /** the "no matches" line itself stays in `<landing-t>` — it bolds the query in `<strong>` */
  'palette.emptyHint': {
    en: 'Try a page name, a section, or an action.',
    vi: 'Bạn thử tên trang, tên mục, hoặc một hành động xem sao.',
  },
  /**
   * command-palette.html:19 — the input's own placeholder. A *visible* string,
   * found while sweeping this template for aria labels: it sits on an attribute,
   * so none of the three guardrail patterns could see it either.
   */
  'palette.placeholder': {
    en: 'Search pages, projects, actions…',
    vi: 'Tìm trang, dự án, hành động…',
  },
  'palette.hint.navigate': { en: 'navigate', vi: 'di chuyển' },
  'palette.hint.open': { en: 'open', vi: 'mở' },
  'palette.hint.close': { en: 'close', vi: 'đóng' },
  'palette.group.pages': { en: 'Pages', vi: 'Trang' },
  'palette.group.sections': { en: 'Sections', vi: 'Mục' },
  'palette.group.actions': { en: 'Actions', vi: 'Hành động' },
  /**
   * Page descriptions. Three of these were stale when task 388 reached them:
   * /about and /blog both still said "Coming soon" long after shipping, and the
   * Get in Touch section pointed at §07 when it is §06.
   */
  'palette.page.home.desc': { en: 'Landing: hero, stack, story', vi: 'Trang chính: hero, stack, câu chuyện' },
  'palette.page.about.desc': {
    en: 'Background, how I think, what I got wrong',
    vi: 'Quá trình, cách mình suy nghĩ, những chỗ mình làm sai',
  },
  'palette.page.projects.desc': { en: 'Selected work index', vi: 'Danh mục công việc chọn lọc' },
  'palette.page.blog.desc': { en: 'Deep dives, notes, retros', vi: 'Bài phân tích sâu, ghi chú, bài tổng kết' },
  'palette.page.uses.desc': { en: 'Hardware, editor, services', vi: 'Thiết bị, editor, dịch vụ' },
  'palette.page.colophon.desc': {
    en: 'Stack and tooling behind this site',
    vi: 'Stack và công cụ đứng sau trang này',
  },
  'palette.page.ddl.desc': { en: 'Design sandbox', vi: 'Khu thử nghiệm thiết kế' },

  // ── Keyboard shortcuts (shell.ts:86-112, command-palette.ts:127) ───────────
  /**
   * Registration runs once in a constructor, so these cannot be plain strings —
   * a locale change would never re-register them. `KeyboardShortcut.description`
   * and `.category` hold **keys**; the palette resolves them where it renders.
   */
  'shortcut.palette.open': { en: 'Open command palette', vi: 'Mở bảng lệnh' },
  'shortcut.theme.toggle': { en: 'Toggle theme', vi: 'Đổi giao diện sáng tối' },
  'shortcut.goHome': { en: 'Go to Home', vi: 'Về trang chủ' },
  'shortcut.goProjects': { en: 'Go to Projects', vi: 'Tới trang Dự án' },
  'shortcut.goDdl': { en: 'Go to DDL (design sandbox)', vi: 'Tới DDL (khu thử nghiệm thiết kế)' },
  'shortcut.category.appearance': { en: 'Appearance', vi: 'Giao diện' },
  'shortcut.category.navigation': { en: 'Navigation', vi: 'Điều hướng' },

  // ── Home section names (home.ts:58, command-palette.types.ts:92) ───────────
  /** Shared by the Home floating-pill nav and the palette's Sections group. */
  'home.section.hero': { en: 'Hero', vi: 'Hero' },
  'home.section.who': { en: 'Who I Am', vi: 'Mình là ai' },
  'home.section.work': { en: 'Selected Work', vi: 'Sản phẩm chọn lọc' },
  /** `Stack` is a technical term — kept in English, minus the article Vietnamese has no use for. */
  'home.section.stack': { en: 'The Stack', vi: 'Stack' },
  'home.section.story': { en: 'The Story', vi: 'Câu chuyện' },
  'home.section.getInTouch': { en: 'Get in Touch', vi: 'Liên hệ' },

  // ── /version (version.html:3-41, version.ts:51) ────────────────────────────
  'version.lede': {
    en: 'Build and runtime details for the instance currently serving this page.',
    vi: 'Thông tin build và runtime của bản đang phục vụ trang này.',
  },
  'version.field.environment': { en: 'Environment', vi: 'Môi trường' },
  'version.field.serverStarted': { en: 'Server started', vi: 'Server khởi động lúc' },
  'version.notSet': { en: 'Not set', vi: 'Chưa đặt' },
  'version.error.title': { en: 'Version unavailable', vi: 'Không đọc được thông tin phiên bản' },
  'version.error.message': {
    en: 'The API did not answer /api/version. The site is still served, but build metadata could not be read.',
    vi: 'API không trả lời /api/version. Trang vẫn chạy bình thường, nhưng mình không đọc được thông tin build.',
  },
  'version.loadingBody': { en: 'Reading build metadata…', vi: 'Đang đọc thông tin build…' },
  'version.meta.unreachable': { en: 'API unreachable.', vi: 'Không kết nối được API.' },
  /** version.html:8 — sr-only heading naming the build-info section */
  'version.a11y.buildInfo': { en: 'Build information', vi: 'Thông tin bản build' },

  // ── Header nav + mega-menu (header.data.ts:11, header.ts:81/158/342-390) ───
  /** overflow-menu trigger, and the mobile-sheet group for unsectioned items */
  'nav.more': { en: 'More', vi: 'Khác' },
  /** mega-menu column title + the matching mobile-sheet group, also footer col */
  'nav.explore': { en: 'Explore', vi: 'Khám phá' },
  'nav.products': { en: 'Products', vi: 'Sản phẩm' },
  'nav.documents': { en: 'Documents', vi: 'Tài liệu' },
  'nav.resume': { en: 'Resume', vi: 'CV' },
  'nav.product.documentEngine.desc': {
    en: 'A framework-agnostic rich-text engine for structured, versioned documents.',
    vi: 'Rich-text engine không phụ thuộc framework, dành cho tài liệu có cấu trúc và có phiên bản.',
  },
  'nav.product.documentEngine.cta': { en: 'Explore the engine', vi: 'Tìm hiểu về Document Engine' },
  /** fallback CTA on any product card that declares no `cta` of its own */
  'nav.product.ctaFallback': { en: 'Explore', vi: 'Tìm hiểu sản phẩm' },

  // ── Footer (footer-banner.ts:36-56) ───────────────────────────────────────
  'footer.column.general': { en: 'General', vi: 'Tổng quát' },
  'footer.column.legal': { en: 'Legal', vi: 'Pháp lý' },

  // ── /404 (not-found.html:3-10, not-found.ts:22) ───────────────────────────
  'notFound.lede': {
    en: "Either you mistyped the URL, or I haven't built this page yet. Both fixable.",
    vi: 'Hoặc là bạn gõ nhầm URL, hoặc là mình chưa tạo kịp trang này. Cả hai đều có thể khắc phục.',
  },
  'notFound.backHome': { en: 'Back to home', vi: 'Về trang chủ' },
  'notFound.browseProjects': { en: 'Browse projects', vi: 'Xem các dự án' },
  'notFound.meta.title': { en: 'Not found | Phuong Tran', vi: 'Không tìm thấy | Phương Trần' },
  /**
   * not-found.html:12-13 — the sr-only heading and the landmark label for the
   * same block of links. Two strings rather than one: a heading names a section
   * of the document, a landmark names a region to navigate to, and screen
   * readers announce them in different contexts.
   */
  'notFound.a11y.recovery': { en: 'Recovery', vi: 'Tìm lại đường' },
  'notFound.a11y.recoveryLinks': { en: 'Recovery links', vi: 'Các liên kết tìm lại đường' },

  // ── Profile availability (about.hero.data.ts:44 + enum-labels.ts:39) ───────
  'profile.availability.openToWork': { en: 'Open to work', vi: 'Sẵn sàng nhận việc' },
  'profile.availability.freelancing': { en: 'Freelancing', vi: 'Đang nhận freelance' },
  'profile.availability.employed': { en: 'Employed', vi: 'Có việc full-time' },
  'profile.availability.notAvailable': { en: 'Not available', vi: 'Chưa có dự định làm thêm' },

  // ── /contact ──────────────────────────────────────────────────────────────
  /** contact.ts:203 — hero lede under "Let's talk." */
  'contact.hero.lede': {
    en: "If you want to have a deep conversation, or just a quick chat about anything, you can find me on social media, or send me a message here. I'll usually reply within a day.",
    vi: 'Nếu bạn muốn trò chuyện sâu, hay chỉ tán gẫu nhanh về bất cứ chuyện gì, bạn có thể tìm mình trên mạng xã hội, hoặc gửi tin nhắn ngay tại đây. Mình thường phản hồi trong vòng một ngày.',
  },
  /** contact.html:14 — sr-only section heading */
  'contact.form.srHeading': { en: 'Send a message', vi: 'Gửi tin nhắn' },
  /** contact.html:52 — purpose chip strip label */
  'contact.form.purposeLabel': { en: "What's this about?", vi: 'Bạn muốn trao đổi chuyện gì?' },
  /** contact.ts:179 — aria-label on the chip strip */
  'contact.form.purposeAria': { en: 'Reason for contact', vi: 'Lý do liên hệ' },
  'contact.purpose.hire': { en: 'Hire me', vi: 'Tuyển dụng' },
  'contact.purpose.freelance': { en: 'Freelance', vi: 'Freelance' },
  'contact.purpose.collab': { en: 'Collab', vi: 'Hợp tác' },
  'contact.purpose.press': { en: 'Press', vi: 'Báo chí' },
  'contact.purpose.hi': { en: 'Just say hi', vi: 'Chào hỏi' },

  /** contact.ts:182 / :183 — field labels */
  'contact.form.name.label': { en: 'Name', vi: 'Tên' },
  'contact.form.message.label': { en: 'Message', vi: 'Tin nhắn' },
  /** contact.ts:171 — character-count hint under the textarea */
  'contact.form.message.hint': { en: '10 to 5000 characters.', vi: 'Tối thiểu 10 ký tự, tối đa 5000.' },

  /** contact.ts:144-167 - per-field validation errors */
  'contact.form.name.error': { en: 'Please enter your name.', vi: 'Vui lòng nhập tên.' },
  'contact.form.email.error': { en: 'Please enter a valid email address.', vi: 'Vui lòng nhập email hợp lệ.' },
  'contact.form.message.error': {
    en: 'Please write a message (10 to 5000 characters).',
    vi: 'Vui lòng viết tin nhắn (10 tới 5000 ký tự).',
  },
  'contact.form.consent.error': { en: 'You must agree before sending.', vi: 'Bạn cần đồng ý trước khi gửi.' },
  /** contact.ts:213 — ends before the Privacy Policy link, which the template renders separately */
  'contact.form.consent.label': {
    en: 'I agree to the processing of my data to receive a reply, per the',
    vi: 'Mình đồng ý cho phép xử lý dữ liệu để nhận phản hồi, theo',
  },
  /** contact.html:129 — the linked phrase after the consent label */
  'contact.form.consent.privacyLink': { en: 'Privacy Policy', vi: 'Chính sách Bảo mật' },

  /** contact.ts:219 — submit button, both states */
  'contact.form.submit.idle': { en: 'Send message', vi: 'Gửi tin nhắn' },
  'contact.form.submit.busy': { en: 'Sending…', vi: 'Đang gửi…' },
  /** contact.ts:420 / :437 — form-level errors raised before the request goes out */
  'contact.form.error.required': {
    en: 'Please fill out the required fields.',
    vi: 'Vui lòng điền đầy đủ các trường bắt buộc.',
  },
  'contact.form.error.challenge': {
    en: 'Please complete the bot challenge before submitting.',
    vi: 'Vui lòng hoàn tất bước xác minh chống bot.',
  },

  /** contact.ts:289 — Turnstile widget states */
  'contact.turnstile.error': {
    en: "Couldn't load the bot challenge. Try again.",
    vi: 'Mình không tải được bước xác minh chống bot. Bạn thử lại giúp mình nha.',
  },
  'contact.turnstile.expired': {
    en: 'The challenge expired. Tap to refresh it.',
    vi: 'Bước xác minh đã hết hạn. Bạn bấm vào đây để làm lại nha.',
  },
  'contact.turnstile.retry': { en: 'Refresh', vi: 'Tải lại' },

  /** contact.html:25 — post-submit success panel */
  'contact.success.heading': {
    en: "Your message is sent. I'll reply soon.",
    vi: 'Tin nhắn đã được gửi đi. Mình sẽ phản hồi sớm.',
  },
  'contact.success.body': {
    en: "I'll reply within a few days. Check your inbox (and spam folder, just in case).",
    vi: 'Mình sẽ phản hồi trong vài ngày. Kiểm tra hộp thư (và thư mục spam, để chắc chắn).',
  },
  'contact.success.again': { en: 'Send another message', vi: 'Gửi tin nhắn khác' },

  /** contact.html:181 — channels column */
  'contact.channels.heading': { en: 'Other ways', vi: 'Các kênh khác' },
  'contact.channels.copyAria': { en: 'Copy email', vi: 'Sao chép email' },
  /** contact.html:233 — caption under the interactive globe */
  'contact.globe.caption': {
    en: 'Based in Ho Chi Minh City, working comfortably with teams across APAC and beyond. Drag to spin the globe.',
    vi: 'Mình ở TP.HCM, làm việc thoải mái với các đội ngũ trên khắp APAC và xa hơn. Bạn kéo để xoay quả địa cầu.',
  },

  /** contact-form.error-messages.ts — API error codes mapped to user-facing copy */
  'error.contact.fallback': {
    en: 'Something went wrong. Please try again, or email me directly.',
    vi: 'Có sự cố xảy ra. Vui lòng thử lại hoặc gửi email trực tiếp.',
  },
  'error.contact.disposableEmail': {
    en: "I don't accept disposable email addresses. Please use a regular one so I can reply.",
    vi: 'Mình không nhận email tạm thời. Vui lòng dùng email cá nhân hoặc email công việc để mình có thể phản hồi.',
  },
  'error.contact.rateLimited': {
    en: "You've sent quite a few messages already. Please wait an hour before trying again.",
    vi: 'Bạn đã gửi khá nhiều tin từ địa chỉ này. Vui lòng thử lại sau 1 giờ.',
  },
  'error.contact.invalidInput': {
    en: 'Some fields look invalid. Please check and try again.',
    vi: 'Một số trường không hợp lệ. Vui lòng kiểm tra và thử lại.',
  },
  'error.contact.spamDetected': {
    en: 'Your message was flagged. Please rephrase and try again.',
    vi: 'Tin nhắn bị đánh dấu là spam. Vui lòng diễn đạt khác và thử lại.',
  },

  // ── /document-engine ──────────────────────────────────────────────────────
  /** document-engine.html:28 */
  'documentEngine.hero.lede': {
    en: 'Most rich-text editors give you back an HTML string, and the structure is then yours to rebuild. Document Engine stores the structured, versioned document itself, in a core that knows nothing about your framework.',
    vi: 'Phần lớn rich-text editor chỉ trả về cho bạn một HTML string, còn phần cấu trúc thì bạn phải tự dựng lại. Document Engine lưu thẳng chính tài liệu đã được cấu trúc và có version, trong một core không biết gì về framework của bạn.',
  },
  'documentEngine.hero.tryLive': { en: 'Try it live', vi: 'Dùng thử trực tiếp' },
  /** document-engine.html:76 / :494 — npm stat units */
  'documentEngine.stat.perWeek': { en: '/week', vi: '/tuần' },
  'documentEngine.stat.downloadsPerWeek': { en: 'downloads/week', vi: 'lượt tải/tuần' },
  /** document-engine.html:103-157 - repo/demo badge strip */
  'documentEngine.badge.source': { en: 'Source', vi: 'Mã nguồn' },
  'documentEngine.badge.sourceInline': { en: 'source', vi: 'mã nguồn' },
  'documentEngine.badge.liveDemo': { en: 'Live demo', vi: 'Bản demo trực tiếp' },
  'documentEngine.badge.tryEditor': { en: 'try the editor', vi: 'dùng thử editor' },
  'documentEngine.badge.lastCommit': { en: 'Last commit', vi: 'Commit gần nhất' },

  /** document-engine.html:218 — §01 demonstration lede */
  'documentEngine.demo.lede': {
    en: 'Everything in the right-hand panel is what actually gets stored. No HTML string, nothing to parse back out later. Change one word and watch it move.',
    vi: 'Mọi thứ trong panel bên phải chính là thứ thật sự được lưu. Không có HTML string, không có gì phải parse ngược lại sau này. Đổi một chữ và nhìn nó chuyển ngay.',
  },
  'documentEngine.editor.placeholder': { en: 'Start typing…', vi: 'Bắt đầu gõ…' },
  'documentEngine.editor.lazyHint': {
    en: 'Editor loads when it scrolls into view',
    vi: 'Editor sẽ tải khi cuộn tới',
  },
  'documentEngine.editor.loading': { en: 'Loading editor…', vi: 'Đang tải editor…' },
  'documentEngine.pane.stored': { en: 'Stored', vi: 'Lưu trữ' },
  'documentEngine.pane.rendered': { en: 'Rendered', vi: 'Hiển thị' },
  'documentEngine.pane.blocks': { en: 'blocks', vi: 'block' },
  'documentEngine.pane.expand': { en: 'Expand', vi: 'Mở rộng' },
  'documentEngine.pane.collapse': { en: 'Collapse', vi: 'Thu gọn' },
  'documentEngine.pane.expandTitle': { en: 'Fill the screen', vi: 'Lấp đầy màn hình' },
  'documentEngine.pane.collapseTitle': { en: 'Collapse (Esc)', vi: 'Thu gọn (Esc)' },

  /** document-engine.html:367 — §02 problems lede */
  'documentEngine.problems.lede': {
    en: 'Document generation is a solved problem right up until the documents matter. In regulated work the editor stops being a text box and becomes part of the product, and a third-party one can only bend so far.',
    vi: 'Sinh tài liệu là bài toán đã giải xong, cho tới khi chính tài liệu đó trở nên quan trọng. Trong các lĩnh vực bị kiểm soát chặt, editor thôi không còn là một ô nhập chữ mà trở thành một phần của sản phẩm, và một editor bên thứ ba chỉ uốn được tới một mức nào đó.',
  },
  /** document-engine.html:406 — §03 features lede */
  'documentEngine.features.lede': {
    en: 'The generic formatting is table stakes. These are the things that made building one worth it.',
    vi: 'Phần format thông thường chỉ là mức tối thiểu. Đây mới là những thứ khiến việc tự xây trở nên đáng công.',
  },
  /** document-engine.html:442 — §04 architecture lede */
  'documentEngine.architecture.lede': {
    en: 'The split is a requirement, not a preference. The same document model has to serve stacks that are not Angular, so the core imports nothing framework-shaped: it can be read on a server, validated in a test, and migrated by a script. Everything Angular lives in the binding, and swapping that layer is how another framework gets supported.',
    vi: 'Việc tách đôi là một yêu cầu bắt buộc, không phải một sở thích. Cùng một document model phải phục vụ cả những stack không phải Angular, nên phần core không import bất cứ thứ gì dính tới framework: nó có thể đọc trên server, kiểm trong test, và migrate bằng một script. Mọi thứ thuộc về Angular sống trong binding, và đổi lớp đó chính là cách một framework khác được hỗ trợ.',
  },
  'documentEngine.architecture.yourApp': { en: 'Your app', vi: 'App của bạn' },
  'documentEngine.architecture.bindingCaption': {
    en: 'framework binding',
    vi: 'lớp binding cho framework',
  },
  'documentEngine.architecture.coreCaption': {
    en: 'document model · zero framework imports',
    vi: 'document model · không import framework nào',
  },
  'documentEngine.architecture.viewOnNpm': { en: 'View on npm', vi: 'Xem trên npm' },
  /** document-engine.html:514 — closing note under the architecture diagram */
  'documentEngine.architecture.note': {
    en: 'This site is one of its consumers. The editor behind every word published here runs on these two packages, which is a harder test than a demo page could ever be.',
    vi: 'Chính trang này là một trong những consumer của nó. Cái editor đứng sau mọi con chữ được publish ở đây chạy trên đúng hai package này, và đó là một phép thử khắt khe hơn bất kỳ trang demo nào.',
  },
  /** document-engine.html:540 — §07 closing CTA */
  'documentEngine.cta.lede': {
    en: 'How it started, what it replaced, and the parts that did not go to plan.',
    vi: 'Nó bắt đầu ra sao, nó thay thế cái gì, và những phần nào đã không diễn ra như dự tính.',
  },
  'documentEngine.cta.action': { en: 'Read the case study', vi: 'Đọc case study' },

  /**
   * Everything below moved out of `document-engine.data.ts`, whose own docblock
   * called its inline `{ en, vi }` objects an interim wiring pending this
   * dictionary. Package names, `shortName`, `label` and URLs stayed in the data
   * file — they are technical identifiers, not copy.
   */
  'documentEngine.packagesLabel': { en: 'Packages', vi: 'Các package' },
  'documentEngine.fact.licence.label': { en: 'Licence', vi: 'Giấy phép' },
  'documentEngine.fact.licence.value': { en: 'MIT', vi: 'MIT' },
  'documentEngine.fact.status.label': { en: 'Status', vi: 'Trạng thái' },
  'documentEngine.fact.status.value': { en: 'Live', vi: 'Đang chạy' },
  /** §02 proof strip — stands in for the logo wall a commercial page would open with */
  /**
   * document-engine.html:159/196/217/241/251 — landmark and control labels around
   * the live demo. `demoEditor` names a contenteditable region, so it has to say
   * what the region *is*; the other four name groups whose buttons already carry
   * their own labels.
   */
  'documentEngine.a11y.atAGlance': { en: 'At a glance', vi: 'Tóm lược' },
  'documentEngine.a11y.demoShortcuts': { en: 'Demo shortcuts', vi: 'Lối tắt cho demo' },
  'documentEngine.a11y.demoEditor': {
    en: 'Document Engine live demo editor',
    vi: 'Editor demo trực tiếp của Document Engine',
  },
  'documentEngine.a11y.closePanel': { en: 'Close the expanded panel', vi: 'Đóng panel đang mở rộng' },
  'documentEngine.a11y.documentView': { en: 'Document view', vi: 'Chế độ xem tài liệu' },
  'documentEngine.proof.npm': { en: 'Published on npm', vi: 'Đã publish trên npm' },
  'documentEngine.proof.powersSite': {
    en: 'Powers every word on this site',
    vi: 'Chạy mọi con chữ trên trang này',
  },
  'documentEngine.proof.frameworkFree': {
    en: 'Framework-free document core',
    vi: 'Document core không phụ thuộc framework',
  },
  'documentEngine.proof.structuredJson': {
    en: 'Structured JSON, never an HTML blob',
    vi: 'JSON có cấu trúc, không phải một cục HTML',
  },
  'documentEngine.package.core.role': {
    en: 'Framework-free. Owns the document model, the schema versioning, and the migration path between versions.',
    vi: 'Không phụ thuộc framework. Làm chủ document model, việc schema versioning, và đường migrate giữa các version.',
  },
  'documentEngine.package.angular.role': {
    en: 'The Angular binding. Editor component, directives, and configuration. Swap this layer to target another framework.',
    vi: 'Lớp binding cho Angular. Editor component, các directive, và cấu hình. Đổi lớp này để nhắm tới một framework khác.',
  },
  /** §03 Why it exists */
  'documentEngine.problem.customisation.title': {
    en: 'Customisation hits a ceiling',
    vi: 'Customization chạm trần',
  },
  'documentEngine.problem.customisation.body': {
    en: 'Regulated document work runs on rules a general-purpose editor never shipped: which fields a person may touch, what stays locked, how a placeholder resolves. Past a point you are working around the vendor’s model instead of with it.',
    vi: 'Công việc tài liệu trong các ngành bị kiểm soát chặt vận hành trên những quy tắc mà một editor phổ thông không bao giờ có sẵn: field nào người dùng được đụng, phần nào phải khoá cứng, một placeholder được resolve ra sao. Quá một mức, bạn phải lách quanh mô hình của nhà cung cấp thay vì làm việc thuận theo nó.',
  },
  'documentEngine.problem.licenceCost.title': {
    en: 'Licence cost that never ends',
    vi: 'Chi phí licence không có điểm dừng',
  },
  'documentEngine.problem.licenceCost.body': {
    en: 'Commercial editors bill every year, per seat or per domain, for as long as the product lives. It is a line item that only ever grows.',
    vi: 'Các editor thương mại tính tiền hằng năm, theo từng seat hoặc từng domain, suốt vòng đời của sản phẩm. Đó là một khoản chi chỉ có tăng chứ không giảm.',
  },
  'documentEngine.problem.opacity.title': {
    en: 'A dependency you cannot see into',
    vi: 'Một dependency bạn không nhìn được vào bên trong',
  },
  'documentEngine.problem.opacity.body': {
    en: 'When the component that produces legally binding documents is one you cannot read, every integration is a negotiation and every upgrade carries risk.',
    vi: 'Khi cái component tạo ra những tài liệu có giá trị pháp lý lại là thứ bạn không đọc được mã, mỗi lần tích hợp là một cuộc thương lượng và mỗi lần nâng cấp là một rủi ro.',
  },
  /**
   * §04 Features. The `name` entries are feature terms and read the same in both
   * languages — they are here rather than as bare literals so the decision is
   * visible in the dictionary instead of buried in a code comment.
   */
  'documentEngine.feature.dynamicFields.name': { en: 'Dynamic fields', vi: 'Dynamic fields' },
  'documentEngine.feature.dynamicFields.body': {
    en: 'Placeholders such as {{customer_name}} live in the document as real nodes, not as text a regex has to find later.',
    vi: 'Những placeholder như {{customer_name}} nằm trong tài liệu dưới dạng node thật, không phải đoạn text để một regex đi tìm lại sau.',
  },
  'documentEngine.feature.restrictedEditing.name': { en: 'Restricted editing', vi: 'Restricted editing' },
  'documentEngine.feature.restrictedEditing.body': {
    en: 'Mark regions the author may change and regions they may not. The lock is part of the document, so it survives a round-trip.',
    vi: 'Đánh dấu vùng tác giả được sửa và vùng không được sửa. Cái khoá là một phần của tài liệu, nên nó sống sót qua một vòng round-trip.',
  },
  'documentEngine.feature.readOnly.name': { en: 'Read-only presentation', vi: 'Read-only presentation' },
  'documentEngine.feature.readOnly.body': {
    en: 'The same document renders as a finished, non-editable artefact without a second renderer to keep in sync.',
    vi: 'Cùng một tài liệu render ra thành một bản hoàn chỉnh, không sửa được, mà không cần một renderer thứ hai phải đồng bộ theo.',
  },
  'documentEngine.feature.tables.name': { en: 'Tables', vi: 'Tables' },
  'documentEngine.feature.tables.body': {
    en: 'Create and edit tables inline, stored structurally rather than as nested markup.',
    vi: 'Tạo và sửa bảng ngay tại chỗ, lưu theo cấu trúc chứ không phải dưới dạng markup lồng nhau.',
  },
  'documentEngine.feature.templates.name': { en: 'Templates', vi: 'Templates' },
  'documentEngine.feature.templates.body': {
    en: 'Start from a prepared document instead of an empty page, which is how document work actually begins.',
    vi: 'Bắt đầu từ một tài liệu dựng sẵn thay vì một trang trắng, đúng như cách công việc tài liệu thật sự bắt đầu.',
  },
  'documentEngine.feature.structuredModel.name': { en: 'Structured data model', vi: 'Structured data model' },
  'documentEngine.feature.structuredModel.body': {
    en: 'A document is JSON with a schema version, so it can be queried, diffed, migrated, and rendered anywhere. Not an HTML string.',
    vi: 'Một tài liệu là JSON kèm schema version, nên có thể query, diff, migrate và render ở bất cứ đâu. Không phải một HTML string.',
  },
  /** §05 demo presets */
  'documentEngine.preset.field.label': { en: 'Insert a dynamic field', vi: 'Chèn một dynamic field' },
  'documentEngine.preset.field.hint': {
    en: 'Adds a {{customer_name}} placeholder',
    vi: 'Thêm một placeholder {{customer_name}}',
  },
  'documentEngine.preset.table.label': { en: 'Load a template', vi: 'Nạp một template' },
  'documentEngine.preset.table.hint': {
    en: 'Replaces the document with a prepared one',
    vi: 'Thay tài liệu bằng một bản dựng sẵn',
  },
  'documentEngine.preset.clear.label': { en: 'Clear all', vi: 'Xoá hết' },
  'documentEngine.preset.clear.hint': {
    en: 'Empties the editor so you can type your own',
    vi: 'Dọn trống editor để bạn tự gõ',
  },
  'documentEngine.preset.reset.label': { en: 'Reset', vi: 'Đặt lại' },
  'documentEngine.preset.reset.hint': {
    en: 'Back to the starting document',
    vi: 'Về lại tài liệu ban đầu',
  },

  // ── /about ────────────────────────────────────────────────────────────────
  /** about.data.ts:3 — browser title */
  'about.meta.title': { en: 'About | Phuong Tran', vi: 'Về mình | Phương Trần' },
  /** about.data.ts:8 — heading fallback when the API has none */
  'about.meta.defaultHeading': {
    en: 'Frontend Engineer building DDD-grade web platforms for fintech & SaaS teams.',
    vi: 'Frontend Engineer xây dựng nền tảng web DDD cho các đội fintech & SaaS.',
  },
  'about.meta.defaultLede': {
    en: 'Six years shipping production systems: payments, dashboards, content tools. I keep teams honest about complexity and trade-offs, and I am picky about who I work with.',
    vi: 'Sáu năm xây dựng hệ thống production: payments, dashboard, content tools. Mình giúp team giữ thái độ trung thực với độ phức tạp và đánh đổi, và mình khá kén chọn người làm cùng.',
  },
  /**
   * Section names — each is read **three** times: the floating nav pill
   * (`about.ts:58`), the section eyebrow, and (for Experience) the section H2.
   * One entry so a rename cannot leave the pill and the eyebrow disagreeing.
   */
  'about.section.experience': { en: 'Experience', vi: 'Kinh nghiệm' },
  'about.section.howIThink': { en: 'How I think', vi: 'Cách mình suy nghĩ' },
  'about.section.failures': { en: 'Failures', vi: 'Thất bại' },
  'about.section.nextSteps': { en: 'Next steps', vi: 'Bước tiếp theo' },

  /** §01 Experience */
  'about.experience.current': { en: '· Current', vi: '· Hiện tại' },
  'about.experience.domain': { en: 'Domain', vi: 'Lĩnh vực' },
  'about.experience.dayToDay': { en: 'Day-to-day', vi: 'Công việc hàng ngày' },
  /** end of a date range for a role with no end date (about.experience.util.ts:60) */
  'about.experience.present': { en: 'Present', vi: 'Hiện tại' },
  /** team-size meta items — `{n}` / `{min}` / `{max}` interpolate at the call site */
  'about.experience.teamOf': { en: 'Team of {n}', vi: 'Nhóm {n} người' },
  'about.experience.teamOfRange': { en: 'Team of {min}-{max}', vi: 'Nhóm {min} tới {max} người' },
  'about.experience.empty': {
    en: 'Career history coming soon.',
    vi: 'Lịch sử công việc sẽ sớm được cập nhật.',
  },
  /**
   * about.experience.html:74/143/183 — the vertical tablist of employers, the
   * badge on the role currently held, and the skills list. `currentRole` names a
   * dot that is otherwise a bare coloured square to a screen reader.
   */
  'about.experience.a11y.companies': { en: 'Companies', vi: 'Các công ty' },
  'about.experience.a11y.currentRole': { en: 'Current role', vi: 'Vai trò hiện tại' },
  'about.experience.a11y.skills': { en: 'Skills', vi: 'Kỹ năng' },

  /** §02 How I think */
  'about.howIThink.lede': {
    en: 'A working set of stances I will defend in PRs.',
    vi: 'Đây là bộ quan điểm mình đang dùng, và mình sẵn sàng bảo vệ chúng trong PR.',
  },
  'about.howIThink.empty': {
    en: 'Principles coming soon.',
    vi: 'Các nguyên tắc sẽ sớm được cập nhật.',
  },

  /** §03 Failures */
  'about.failures.lede': {
    en: 'Three short, matter-of-fact notes: what I chose, what went wrong, and what changed afterwards.',
    vi: 'Ba ghi chú ngắn và thẳng thắn: mình đã lựa chọn ra sao, cái nào không đúng, và sau đó mình đã thay đổi điều gì.',
  },
  'about.failures.decision': { en: 'Decision', vi: 'Quyết định' },
  'about.failures.consequence': { en: 'Consequence', vi: 'Hậu quả' },
  'about.failures.lesson': { en: 'Lesson', vi: 'Bài học' },
  'about.failures.empty': {
    en: 'Field notes coming soon.',
    vi: 'Các ghi chú sẽ sớm được cập nhật.',
  },

  /** §04 Next steps — about.cta.data.ts */
  'about.cta.heading': {
    en: 'If any of this resonated, the door is open.',
    vi: 'Nếu bạn thấy hợp, bạn cứ gõ cửa nha.',
  },
  'about.cta.lede': {
    en: 'Engagement, freelance, or a long-form conversation about a hard system. Pick the door that fits.',
    vi: 'Hợp tác, freelance, hay một cuộc trò chuyện dài về một hệ thống khó. Bạn thấy hướng nào phù hợp thì cứ chọn hướng đó.',
  },
  /** about.cta.ts:50 - the CTA row; which items render depends on the profile */
  'about.cta.item.contact': { en: 'Get in touch', vi: 'Liên hệ' },
  'about.cta.item.linkedin': { en: 'LinkedIn', vi: 'LinkedIn' },
  'about.cta.item.github': { en: 'GitHub', vi: 'GitHub' },
  'about.cta.item.cv': { en: 'Download CV', vi: 'Tải CV' },

  // ── Home ──────────────────────────────────────────────────────────────────
  'home.selectedWork.empty': {
    en: 'Selected work coming soon.',
    vi: 'Các dự án chọn lọc sẽ sớm được cập nhật.',
  },
  /** home.get-in-touch.ts:26 */
  'home.getInTouch.copy': {
    en: "Whatever the reason, the door's open.\nI read every message and usually reply within a few days.",
    vi: 'Nhắn tin cho mình nha, mình đọc hết và thường phản hồi trong vài ngày.',
  },
  'home.getInTouch.cta.hire': {
    en: "Let's talk about a full-time role",
    vi: 'Trao đổi về một vị trí full-time',
  },
  'home.getInTouch.cta.freelance': {
    en: 'Tell me about a freelance or contract project',
    vi: 'Kể mình nghe về một dự án freelance hoặc hợp đồng ngắn hạn',
  },
  'home.getInTouch.cta.hi': { en: 'Or just say hi', vi: 'Hoặc chỉ muốn chào mình một tiếng' },
  'home.getInTouch.fallbackPrompt': {
    en: 'Prefer your own mail client?',
    vi: 'Dùng email client của bạn:',
  },

  /**
   * §2 Hero. The mono-caps rail keys (`STATUS`, `CORE STACK`, `LOCATION`) stay in
   * English on purpose — see the note on the bio-card rail below.
   */
  /**
   * Both halves are framed positively — open to new work / focused on a project —
   * rather than as "hire me" / "no". The rail applies `text-transform: uppercase`,
   * so the caps here are source style only, not what makes it render.
   */
  'home.hero.status.available': { en: 'AVAILABLE FOR HIRE', vi: 'SẴN SÀNG VỚI CÔNG VIỆC MỚI' },
  'home.hero.status.busy': { en: 'BUSY', vi: 'ĐANG TẬP TRUNG DỰ ÁN' },
  /** home.ts:72 — shown until the public profile resolves (or when it has no name) */
  'home.fullName.fallback': { en: 'Portfolio in progress', vi: 'Portfolio đang hoàn thiện' },
  /**
   * home.hero.html:23 — names the `<dl>` holding the availability dot. The three
   * section landmarks on Home (`Hero`, `The Stack`, `The Story`) reuse
   * `home.section.*` instead of getting a11y keys of their own: the pill nav
   * already labels those regions, and two names for one region is how "Who" and
   * "Who I Am" drifted apart in the first place.
   */
  'home.hero.a11y.hireStatus': { en: 'Hire status', vi: 'Trạng thái nhận việc' },

  /**
   * §3 Bio card grid. `LOCAL`, `HOURS`, `BASE` and the `§2.x IDENTITY / BIO /
   * CONTACT` eyebrows are **not** in here: they are 4-to-8 character mono-caps
   * keys in a narrow rail, and no Vietnamese equivalent fits that width without
   * breaking the column rhythm. Same exception class as `Commit` / `Branch` /
   * `Deployment ID` on /version. Prose-length labels do get translated.
   */
  'home.bio.connectNow': { en: 'Connect now', vi: 'Kết nối ngay' },
  /**
   * home.bio-card-grid.html:35 — the rotate button swapping the hours rail
   * between the owner's timezone and the visitor's. Both labels describe the
   * *result* of pressing, which is what an icon-only toggle has to do: the icon
   * alone says "rotate", not "rotate to what".
   */
  'home.bio.a11y.hoursToLocal': { en: 'Show hours in your local timezone', vi: 'Xem giờ theo múi giờ của bạn' },
  'home.bio.a11y.hoursToOwner': { en: 'Show hours in owner timezone', vi: 'Xem giờ theo múi giờ của chủ trang' },
  /** home.ts:94 — used when the author has set no `contactIntro` */
  'home.bio.contactNote.fallback': {
    en: 'Open to talks · engagements from June',
    vi: 'Sẵn sàng trò chuyện · nhận việc từ tháng 6',
  },

  /** §4 Selected work */
  'home.selectedWork.viewArchive': {
    en: 'View the full archive at /projects',
    vi: 'Xem toàn bộ dự án tại /projects',
  },
  'home.selectedWork.readMore': { en: 'Read more', vi: 'Đọc tiếp' },
  /**
   * Highlight rail on a featured project. Kept in English in both locales, with
   * the rest of the mono-caps rail keys: they are the case-study's own column
   * headers and stay terse enough to hold the narrow rail.
   */
  'home.selectedWork.decision.challenge': { en: 'CHALLENGE', vi: 'CHALLENGE' },
  'home.selectedWork.decision.approach': { en: 'APPROACH', vi: 'APPROACH' },
  'home.selectedWork.decision.outcome': { en: 'OUTCOME', vi: 'OUTCOME' },

  /**
   * Default labels for a project link when the author leaves `label` blank.
   * One set for the whole site: the Home strip and the project detail page had
   * drifted into two different wordings for the same five link types
   * (`Source code` vs `Repository`, `Docs` vs `Documentation`).
   */
  /** the first three are developer-facing terms of art — same in both languages */
  'project.link.repo': { en: 'Source code', vi: 'Source code' },
  'project.link.demo': { en: 'Live demo', vi: 'Live demo' },
  'project.link.caseStudy': { en: 'Case study', vi: 'Case study' },
  'project.link.doc': { en: 'Docs', vi: 'Tài liệu' },
  'project.link.post': { en: 'Write-up', vi: 'Bài viết' },

  /** §5 The Stack — icon-set credit line */
  'home.stack.creditLabel': { en: 'icons', vi: 'bộ icon của' },

  /**
   * §6 The Story — the lamp/pen easter egg. Dark theme reads as a desk lamp,
   * light theme as a fountain pen, so the credit and the hint both swap.
   */
  'home.story.credit.sketch': { en: 'sketch', vi: 'bản vẽ' },
  'home.story.credit.penOnPaper': { en: 'pen on paper', vi: 'bút mực trên giấy' },
  'home.story.credit.illustration': { en: 'illustration', vi: 'hình minh họa' },
  'home.story.hint.mark': { en: 'click to mark', vi: 'bấm để gạch chân' },
  'home.story.hint.rest': { en: 'click to rest', vi: 'bấm để cất bút' },
  'home.story.hint.turnOn': { en: 'click to turn on', vi: 'bấm để bật đèn' },
  'home.story.hint.dim': { en: 'click to dim', vi: 'bấm để tắt đèn' },

  // ── /blog list (blog.list.html, blog.list.data.ts) ────────────────────────
  'blog.lede': {
    en: 'What I have been figuring out.',
    vi: 'Những gì mình đang tìm hiểu.',
  },
  'blog.search.placeholder': {
    en: 'Search posts by title or excerpt…',
    vi: 'Tìm bài theo tiêu đề hoặc đoạn mô tả…',
  },
  /** category filter — the "no category selected" chip */
  'blog.category.all': { en: 'All', vi: 'Tất cả' },
  'blog.loading': { en: 'Loading posts…', vi: 'Đang tải bài viết…' },
  'blog.empty.filtered': {
    en: 'No posts match the current filters.',
    vi: 'Không có bài nào khớp với Filters hiện tại.',
  },
  'blog.clearFilters': { en: 'Clear filters', vi: 'Bỏ Filters' },

  // ── Blog detail (blog.detail.html, blog.detail.ts) ────────────────────────
  // The locale here is the **post's own language**, not the site toggle: a post
  // is single-language, so its chrome reads in the language it was written in.
  /** `{n}` interpolates at the call site */
  'blog.readTime': { en: '{n} min read', vi: 'đọc {n} phút' },
  'blog.relatedPosts': { en: 'Related posts', vi: 'Bài liên quan' },
  'blog.allPosts': { en: 'All posts', vi: 'Tất cả bài viết' },
  'blog.authorBio': {
    en: "I build long-lived web systems, currently focused on Angular SSR, Nx monorepos, and the small rituals that keep design and engineering honest. This site is my notebook in public: retrospectives, deep dives, and the occasional opinion I'm willing to defend.",
    vi: 'Mình xây những hệ thống web sống lâu, hiện tập trung vào Angular SSR, Nx monorepo, và mấy thói quen nhỏ giữ cho thiết kế và kỹ thuật trung thực với nhau. Trang này là sổ tay công khai của mình: bài tổng kết, bài phân tích sâu, và đôi khi là một quan điểm mình sẵn sàng bảo vệ.',
  },
  /**
   * blog.list.html:9/126/251 + blog.detail.html:13/127 + blog.share-row.ts —
   * sr-only headings and landmark labels. `a11y.floatingToc` is deliberately
   * distinct from `common.onThisPage`: the floating rail and the inline TOC hold
   * the same links, so a screen reader hitting two identically-named landmarks
   * would have no way to tell the user which one it landed in.
   */
  'blog.a11y.featured': { en: 'Featured posts', vi: 'Bài nổi bật' },
  'blog.a11y.floatingToc': { en: 'On this page (floating)', vi: 'Trong trang này (bảng nổi)' },
  'blog.a11y.authorBio': { en: 'About the author', vi: 'Về tác giả' },
  'blog.share.group': { en: 'Share', vi: 'Chia sẻ' },
  'blog.share.x': { en: 'Share on X', vi: 'Chia sẻ lên X' },
  'blog.share.linkedin': { en: 'Share on LinkedIn', vi: 'Chia sẻ lên LinkedIn' },
  'blog.share.copied': { en: 'Link copied', vi: 'Đã sao chép liên kết' },
  'blog.detail.loading': { en: 'Loading post…', vi: 'Đang tải bài viết…' },
  'blog.detail.notFound.title': { en: 'Post not found', vi: 'Không tìm thấy bài viết' },
  'blog.detail.notFound.message': {
    en: 'This article may have been moved, unpublished, or never existed.',
    vi: 'Bài này có thể đã bị chuyển đi, đã ẩn, hoặc chưa từng tồn tại.',
  },
  'blog.detail.browseAll': { en: 'Browse all articles', vi: 'Xem tất cả bài viết' },
  /** post-type chip, derived from category + read time (blog.detail.ts:167) */
  'blog.postType.note': { en: 'Note', vi: 'Ghi chú' },
  'blog.postType.deepDive': { en: 'Deep dive', vi: 'Phân tích sâu' },
  'blog.postType.essay': { en: 'Essay', vi: 'Bài luận' },

  // ── /projects index (projects.html, projects.types.ts) ────────────────────
  'projects.lede': {
    en: 'Everything I have shipped.',
    vi: 'Toàn bộ những gì mình đã ship.',
  },
  /** `Filters` stays English everywhere it appears, including inside a sentence. */
  'projects.filters': { en: 'Filters', vi: 'Filters' },
  'projects.clearAll': { en: 'Clear all', vi: 'Bỏ hết' },
  'projects.clearAllFilters': { en: 'Clear all filters', vi: 'Bỏ hết Filters' },
  'projects.loading': { en: 'Loading projects…', vi: 'Đang tải dự án…' },
  'projects.empty.filtered': {
    en: 'No projects match these filters',
    vi: 'Không có dự án nào khớp với Filters này',
  },
  'projects.empty.none': { en: 'No projects published yet', vi: 'Chưa có dự án nào được đăng' },
  /** projects.html:12 — sr-only heading over the result grid */
  'projects.a11y.list': { en: 'Projects list', vi: 'Danh sách dự án' },
  /**
   * Project field labels — read by **both** the /projects filter bar and the
   * detail page's metadata rail. One set so `Year` in the filter and `Year` in
   * the rail cannot drift apart.
   */
  'project.field.role': { en: 'Role', vi: 'Vai trò' },
  'project.field.stack': { en: 'Stack', vi: 'Stack' },
  'project.field.year': { en: 'Year', vi: 'Năm' },
  'project.field.status': { en: 'Status', vi: 'Trạng thái' },

  /**
   * Lifecycle status. Also shared by the filter chips, which used to render the
   * raw enum (`LIVE`, `SHIPPED`) while the detail rail rendered `Live`, `Shipped`.
   */
  'project.status.live': { en: 'Live', vi: 'Đang chạy' },
  'project.status.shipped': { en: 'Shipped', vi: 'Đã ship' },
  'project.status.archived': { en: 'Archived', vi: 'Đã lưu trữ' },
  'project.status.beta': { en: 'Beta', vi: 'Beta' },
  'project.status.ongoing': { en: 'Ongoing', vi: 'Đang làm' },

  // ── Project detail (project.detail.html, .types.ts, .ts) ──────────────────
  'project.detail.imagePending': { en: 'image pending', vi: 'chưa có ảnh' },
  'project.detail.imagePendingSub': {
    en: 'cover screenshot not yet captured',
    vi: 'chưa chụp ảnh bìa cho dự án này',
  },
  /** eyebrow above the title — term of art, same in both */
  'project.detail.caseStudy': { en: 'case study', vi: 'case study' },
  'project.detail.moreDetails': { en: 'More details', vi: 'Xem thêm chi tiết' },
  'project.detail.lessDetails': { en: 'Less details', vi: 'Thu gọn chi tiết' },
  /**
   * Synthesized section headings, used when a project has no rich-text body.
   * The same four titles feed `FALLBACK_TOC`, so the sidebar and the headings
   * it links to always agree.
   */
  'project.detail.section.overview': { en: 'Overview', vi: 'Tổng quan' },
  'project.detail.section.motivation': { en: 'Motivation', vi: 'Lý do làm' },
  'project.detail.section.role': { en: 'My role', vi: 'Vai trò của mình' },
  'project.detail.section.highlights': { en: 'Highlights', vi: 'Điểm nổi bật' },
  /** highlight labels — English in both locales, same call as the Home rail */
  'project.detail.cao.challenge': { en: 'Challenge', vi: 'Challenge' },
  'project.detail.cao.approach': { en: 'Approach', vi: 'Approach' },
  'project.detail.cao.outcome': { en: 'Outcome', vi: 'Outcome' },
  'project.detail.notFound.title': { en: 'Project not found', vi: 'Không tìm thấy dự án' },
  'project.detail.notFound.message': {
    en: 'That slug does not match any project.',
    vi: 'Slug này không khớp với dự án nào.',
  },
  'project.detail.backToProjects': { en: 'Back to projects', vi: 'Về danh sách dự án' },

  // ── /uses (uses.html:3, uses.data.ts) ─────────────────────────────────────
  // Section titles keep the words that are tool-chain vocabulary in Vietnamese
  // too (`Editor`, `Terminal`, `CLI`); only the ones with a settled Vietnamese
  // equivalent get translated.
  'uses.lede': {
    en: 'What I use daily.',
    vi: 'Những công cụ mình sử dụng hàng ngày.',
  },
  'uses.section.hardware': { en: 'Hardware', vi: 'Thiết bị' },
  'uses.section.editor': { en: 'Editor', vi: 'Editor' },
  'uses.section.terminal': { en: 'Terminal', vi: 'Terminal' },
  'uses.section.cli': { en: 'CLI', vi: 'CLI' },
  'uses.section.browser': { en: 'Browser', vi: 'Trình duyệt' },
  'uses.section.fonts': { en: 'Fonts', vi: 'Font chữ' },
  'uses.section.other': { en: 'Other', vi: 'Khác' },
  /** uses.html:12 — sr-only heading over the whole inventory */
  'uses.a11y.inventory': { en: 'Uses inventory', vi: 'Danh sách công cụ' },
  'uses.reason.thinkpad': {
    en: '14" Intel i7, 32 GB RAM. Daily driver since 2023, sturdy keyboard, runs Windows 11.',
    vi: '14" Intel i7, 32 GB RAM. Máy chính từ năm 2023, bàn phím chắc tay, chạy Windows 11.',
  },
  'uses.reason.vscode': {
    en: 'Primary editor. GitHub Dark theme, format-on-save, Vim keymap off.',
    vi: 'Editor chính. Theme GitHub Dark, format-on-save, tắt Vim keymap.',
  },
  'uses.reason.cursor': {
    en: 'When a refactor needs Claude in the loop. Opens the same workspace as VS Code.',
    vi: 'Dùng khi một đợt refactor cần có Claude tham gia. Mở đúng workspace mà VS Code đang mở.',
  },
  'uses.reason.windowsTerminal': {
    en: 'PowerShell 7 host with WSL2 (Ubuntu) and Git Bash as side tabs.',
    vi: 'Chạy PowerShell 7 làm chính, WSL2 (Ubuntu) và Git Bash nằm ở tab bên cạnh.',
  },
  'uses.reason.pnpm': {
    en: 'Workspace package manager: tighter disk usage than npm, faster cold installs.',
    vi: 'Package manager cho workspace: tốn ít dung lượng đĩa hơn npm, cài từ đầu nhanh hơn.',
  },
  'uses.reason.nx': {
    en: 'Monorepo orchestrator. `nx affected` is the daily workhorse for tests and builds.',
    vi: 'Bộ điều phối monorepo. `nx affected` là câu lệnh mình gọi mỗi ngày để chạy test và build.',
  },
  'uses.reason.gh': {
    en: 'GitHub CLI: PR review and check status without leaving the terminal.',
    vi: 'GitHub CLI: review PR và xem trạng thái check mà không cần rời terminal.',
  },
  'uses.reason.chrome': {
    en: 'Daily browser. DevTools + Lighthouse is where I tune landing performance.',
    vi: 'Trình duyệt dùng mỗi ngày. Mình tinh chỉnh hiệu năng trang landing bằng DevTools và Lighthouse.',
  },
  'uses.reason.firefox': {
    en: 'Second opinion on render quirks and color-space behaviour.',
    vi: 'Chỗ để đối chiếu lại những lỗi render lạ và cách trình duyệt xử lý color space.',
  },
  'uses.reason.inter': {
    en: 'UI sans, bound to `--landing-font-body`. Sharp at small sizes, neutral voice.',
    vi: 'Font sans cho giao diện, gắn vào `--landing-font-body`. Nét ở cỡ nhỏ, giọng trung tính.',
  },
  /** the same typeface serves /uses and /colophon — one entry, read from both */
  'uses.reason.newsreader': {
    en: 'Display serif italic: used for accent words inside section headers (display-xl/lg).',
    vi: 'Serif in nghiêng cho display: dùng cho những chữ nhấn trong tiêu đề mục (display-xl/lg).',
  },
  'uses.reason.jetbrainsMono': {
    en: 'Terminal + code + landing `landing-link`. Ligatures on; NF variant for icons.',
    vi: 'Terminal, code, và `landing-link` trên trang landing. Bật ligature; bản NF để hiện icon.',
  },
  'uses.reason.excalidraw': {
    en: 'System diagrams. Hand-drawn aesthetic matches the human/specific voice.',
    vi: 'Vẽ sơ đồ hệ thống. Nét vẽ tay hợp với giọng người thật, cụ thể mà trang này theo.',
  },
  'uses.reason.obsidian': {
    en: 'Engineering journal: daily note plus literature notes synced to a private repo.',
    vi: 'Sổ tay kỹ thuật: ghi chú mỗi ngày cộng ghi chú đọc tài liệu, đồng bộ vào một repo riêng.',
  },

  // ── /colophon (colophon.html:3-41, colophon.data.ts) ──────────────────────
  'colophon.lede': {
    en: 'The stack, the tools, and the inspirations.',
    vi: 'Stack, công cụ, và nguồn cảm hứng.',
  },
  'colophon.section.stack': { en: 'Stack', vi: 'Stack' },
  'colophon.section.tools': { en: 'Tools', vi: 'Công cụ' },
  /** `Sources & credits` is the colophon's own term of art — same in both */
  'colophon.section.sources': { en: 'Sources & credits', vi: 'Sources & credits' },
  'colophon.section.type': { en: 'Type', vi: 'Kiểu chữ' },
  /**
   * colophon.html:12 — sr-only heading. Enumerates the four section names rather
   * than saying "Credits", so a screen-reader user gets the shape of the page
   * before deciding whether to read it.
   */
  'colophon.a11y.credits': { en: 'Stack, tools, sources, type', vi: 'Stack, công cụ, sources, kiểu chữ' },
  'colophon.reason.angular': {
    en: 'Signals + standalone + SSR. The landing pre-renders; the console hydrates.',
    vi: 'Signals + standalone + SSR. Trang landing được pre-render; console thì hydrate.',
  },
  'colophon.reason.nestjs': {
    en: 'DDD-per-module: domain / application / infrastructure / presentation. Boring is the goal.',
    vi: 'DDD theo từng module: domain / application / infrastructure / presentation. Nhàm chán chính là mục tiêu.',
  },
  'colophon.reason.prisma': {
    en: 'Type-safe Postgres access. Migrations live in repo; schema is the contract.',
    vi: 'Truy cập Postgres an toàn về kiểu. Migration nằm trong repo; schema chính là bản hợp đồng.',
  },
  'colophon.reason.postgres': {
    en: 'Single managed Postgres for landing data + auth. Same DB the admin console edits.',
    vi: 'Một Postgres managed duy nhất cho dữ liệu landing và auth. Cũng chính là DB mà console admin sửa.',
  },
  'colophon.reason.nx': {
    en: 'Monorepo orchestrator. `nx affected` keeps CI honest as the workspace grows.',
    vi: 'Bộ điều phối monorepo. `nx affected` giữ cho CI trung thực khi workspace lớn dần.',
  },
  'colophon.reason.tailwind': {
    en: 'Utility-first for layout, SCSS modules for component contracts. No global rules.',
    vi: 'Utility-first cho layout, SCSS module cho hợp đồng của component. Không có rule global nào.',
  },
  'colophon.reason.railway': {
    en: 'Hosting + Postgres + SSR app. One platform; Cloudflare in front for DNS + edge cache.',
    vi: 'Hosting, Postgres, và app SSR. Một platform duy nhất; Cloudflare đứng trước lo DNS và edge cache.',
  },
  'colophon.reason.cloudinary': {
    en: 'Image host + transforms. Reached by media picker in the console; URL-only on landing.',
    vi: 'Lưu ảnh và biến đổi ảnh. Console gọi tới qua media picker; trang landing chỉ dùng URL.',
  },
  'colophon.reason.excalidraw': {
    en: 'Architecture diagrams + figure annotations. Hand-drawn aesthetic matches the voice.',
    vi: 'Vẽ sơ đồ kiến trúc và chú thích cho hình. Nét vẽ tay hợp với giọng của trang.',
  },
  'colophon.reason.obsidian': {
    en: 'Engineering journal + draft writing. Drafts move to repo when they earn it.',
    vi: 'Sổ tay kỹ thuật và nơi viết bản nháp. Bản nháp nào đủ chín thì mới được đưa vào repo.',
  },
  'colophon.reason.claudeCode': {
    en: 'Primary AI pair. Slash-commands from TDP plugins drive the project workflow.',
    vi: 'Bạn lập trình AI chính. Các slash-command từ plugin TDP điều khiển quy trình của dự án.',
  },
  'colophon.reason.figma': {
    en: 'Low-fidelity layout sketches before code. Final design lives in the DDL route, not Figma.',
    vi: 'Phác layout thô trước khi viết code. Bản thiết kế cuối nằm ở route DDL, không phải ở Figma.',
  },
  'colophon.reason.screenshot': {
    en: 'Captures for case study figures. Beautified with a small ImageMagick script, not a SaaS.',
    vi: 'Chụp hình cho các figure trong case study. Làm đẹp bằng một script ImageMagick nhỏ, không dùng SaaS.',
  },
  'colophon.reason.linear': {
    en: 'Quiet confidence on dark; hairline borders; mono-flavored UI labels. The reference for tone.',
    vi: 'Sự tự tin điềm đạm trên nền tối; viền mảnh như sợi chỉ; nhãn giao diện mang chất mono. Đây là chuẩn tham chiếu về tông giọng.',
  },
  'colophon.reason.stripePress': {
    en: 'Editorial serif logo + italic tagline. Where the dark-but-not-black palette idea came from.',
    vi: 'Logo serif kiểu báo chí và tagline in nghiêng. Ý tưởng palette tối mà không đen xuất phát từ đây.',
  },
  'colophon.reason.railwaySource': {
    en: 'Technical density with calm voice ("Ship software peacefully"). Validates restraint over polish.',
    vi: 'Đậm chất kỹ thuật mà giọng vẫn bình tĩnh ("Ship software peacefully"). Chứng minh biết chừng mực đáng giá hơn là bóng bẩy.',
  },
  'colophon.reason.vercelDocs': {
    en: 'Mature dark UI + right-rail navigation. Pattern lifted directly for the project case-study layout.',
    vi: 'Giao diện tối đã chín cùng thanh điều hướng bên phải. Mình lấy nguyên pattern này cho layout case study của dự án.',
  },
  'colophon.reason.designSystemsSurf': {
    en: 'Editorial-magazine-of-products framing. Inspiration for the /projects index density.',
    vi: 'Cách trình bày sản phẩm như một tờ tạp chí. Nguồn cảm hứng cho độ dày thông tin ở trang /projects.',
  },
  'colophon.reason.kiro': {
    en: 'Big bold sans hero on dark; product mock embedded. Reference for the home hero composition.',
    vi: 'Hero chữ sans to và đậm trên nền tối, có nhúng ảnh mock sản phẩm. Tham chiếu cho cách dựng hero ở trang chủ.',
  },
  'colophon.reason.parthSharma': {
    en: 'Direction validator: sans display + serif italic emphasis rhythm. The closest published proof the direction ships.',
    vi: 'Người xác nhận hướng đi: nhịp sans cho display cộng serif in nghiêng để nhấn. Đây là bằng chứng công khai gần nhất cho thấy hướng này chạy được.',
  },
  'colophon.reason.inter': {
    en: 'UI sans bound to `--landing-font-body`. Sharp at small sizes, neutral voice for long-form reading.',
    vi: 'Font sans cho giao diện, gắn vào `--landing-font-body`. Nét ở cỡ nhỏ, giọng trung tính để đọc bài dài.',
  },
  'colophon.reason.jetbrainsMono': {
    en: 'Code + metadata + landing-link. Ligatures on; NF variant in the terminal.',
    vi: 'Code, metadata, và landing-link. Bật ligature; bản NF dùng trong terminal.',
  },
  /**
   * The two prose blocks at the foot of /colophon. Plain paragraphs with no
   * inline markup, so they belong in the dictionary rather than `<landing-t>`.
   */
  'colophon.thisSite.title': { en: 'This site', vi: 'Trang này' },
  'colophon.thisSite.body': {
    en: 'Authored end-to-end by one person: design system, content, backend, frontend, ops. The public landing reads from a small NestJS API backed by Postgres; an admin console in the same monorepo edits every section you see, so a typo fix is a 12-second round-trip and a deploy nobody notices. The visual direction settled across an E4 moodboard pass: dark, restrained accent, editorial-serif italic for the human moments. The writing is the part I edited most: read aloud, cut, read aloud again.',
    vi: 'Một người làm từ đầu tới cuối: design system, nội dung, backend, frontend, ops. Trang landing công khai đọc dữ liệu từ một API NestJS nhỏ chạy trên Postgres; một console admin trong cùng monorepo sửa được mọi mục bạn đang thấy, nên sửa một lỗi chính tả chỉ mất 12 giây đi về cộng một lần deploy không ai để ý. Hướng thị giác chốt lại sau một đợt moodboard ở E4: nền tối, màu nhấn dè dặt, serif in nghiêng kiểu báo chí cho những khoảnh khắc con người. Phần chữ là phần mình sửa nhiều nhất: đọc to lên, cắt bớt, rồi đọc to lại.',
  },
  'colophon.updates.title': { en: 'Updates', vi: 'Cập nhật' },
  'colophon.updates.body': {
    en: 'Ship-and-forget by default. The case studies, /uses, and this page change when the work behind them changes, not on a calendar. If you spot something stale, the email at the bottom is mine, not a contact form.',
    vi: 'Mặc định là ship rồi để đó. Các case study, trang /uses, và trang này chỉ thay đổi khi công việc phía sau chúng thay đổi, chứ không thay đổi theo lịch. Nếu bạn thấy chỗ nào đã cũ, cái email ở dưới cùng là email thật của mình, không phải một form liên hệ.',
  },

  // ── Legal (/terms, /privacy) ──────────────────────────────────────────────
  // Locale here comes from `?lang=`, not the site-wide toggle — always resolve
  // these with an explicit locale override.
  'legal.terms.title': { en: 'Terms of Use.', vi: 'Điều khoản Sử dụng.' },
  'legal.privacy.title': { en: 'Privacy Policy.', vi: 'Chính sách Bảo mật.' },
  /**
   * terms.html:14 / privacy.html:14 — sr-only heading over the prose column.
   * Separate from `*.title` above, which carries the visible `<h1>`'s full stop:
   * the period is a typographic choice for the display heading, and a screen
   * reader would read it as a sentence break inside a heading.
   */
  'legal.terms.a11y.content': { en: 'Terms of Use', vi: 'Điều khoản Sử dụng' },
  'legal.privacy.a11y.content': { en: 'Privacy Policy', vi: 'Chính sách Bảo mật' },

  /**
   * Legal SEO metadata. Unlike every other page these two DO get indexed in both
   * languages: `useLegalPage` gives Vietnamese its own URL (`?lang=vi`) and emits
   * canonical + hreflang + x-default. This is the pattern the rest of the site
   * would need before its `*.meta.*` entries mean anything to a crawler.
   */
  'legal.terms.meta.title': { en: 'Terms of Use | Phuong Tran', vi: 'Điều khoản Sử dụng | Phương Trần' },
  'legal.terms.meta.description': {
    en: 'Terms governing your access to and use of thunderphong.com. IP rights, acceptable use, no warranty, governing law of Vietnam.',
    vi: 'Điều khoản chi phối việc truy cập và sử dụng thunderphong.com. Quyền sở hữu trí tuệ, sử dụng được chấp nhận, không bảo đảm, luật áp dụng Việt Nam.',
  },
  'legal.privacy.meta.title': { en: 'Privacy Policy | Phuong Tran', vi: 'Chính sách Bảo mật | Phương Trần' },
  'legal.privacy.meta.description': {
    en: 'How thunderphong.com collects, uses, stores, and protects personal data. Minimal data, no tracking cookies, a transparent processor list.',
    vi: 'Cách thunderphong.com thu thập, sử dụng, lưu trữ và bảo vệ dữ liệu cá nhân. Nguyên tắc dữ liệu tối thiểu, không cookie tracking, danh sách bên xử lý minh bạch.',
  },

  /** terms.data.ts — in-page nav titles, keyed by anchor id */
  'legal.terms.section.theSite': { en: '1. The Site', vi: '1. Về Website' },
  'legal.terms.section.ip': { en: '2. Intellectual property', vi: '2. Sở hữu trí tuệ' },
  'legal.terms.section.acceptableUse': { en: '3. Acceptable use', vi: '3. Nguyên tắc sử dụng' },
  'legal.terms.section.contactForm': { en: '4. Contact form', vi: '4. Biểu mẫu liên hệ' },
  'legal.terms.section.links': { en: '5. Links to other sites', vi: '5. Liên kết ngoài' },
  'legal.terms.section.noWarranty': { en: '6. No warranty', vi: '6. Không bảo đảm' },
  'legal.terms.section.liability': { en: '7. Limitation of liability', vi: '7. Giới hạn trách nhiệm' },
  'legal.terms.section.privacy': { en: '8. Privacy', vi: '8. Bảo mật' },
  'legal.terms.section.changes': { en: '9. Changes', vi: '9. Thay đổi' },
  'legal.terms.section.governingLaw': { en: '10. Governing law', vi: '10. Luật áp dụng' },
  'legal.terms.section.indemnification': { en: '11. Indemnification', vi: '11. Bồi thường' },
  'legal.terms.section.severability': { en: '12. Severability', vi: '12. Hiệu lực từng phần' },
  'legal.terms.section.contact': { en: '13. Contact', vi: '13. Liên hệ' },

  /** privacy.data.ts — in-page nav titles, keyed by anchor id */
  'legal.privacy.section.whoIAm': { en: '1. Who I am', vi: '1. Tôi là ai' },
  'legal.privacy.section.scope': { en: '2. Scope', vi: '2. Phạm vi' },
  'legal.privacy.section.dataCollected': { en: '3. Data I collect', vi: '3. Dữ liệu thu thập' },
  'legal.privacy.section.processors': { en: '4. Processors', vi: '4. Bên xử lý dữ liệu' },
  'legal.privacy.section.transfers': {
    en: '5. International transfers',
    vi: '5. Chuyển dữ liệu ra nước ngoài',
  },
  'legal.privacy.section.rights': { en: '6. Your rights', vi: '6. Quyền của bạn' },
  'legal.privacy.section.security': { en: '7. Security', vi: '7. Bảo mật' },
  'legal.privacy.section.children': { en: '8. Children', vi: '8. Trẻ em' },
  'legal.privacy.section.externalLinks': { en: '9. Links to other sites', vi: '9. Liên kết ngoài' },
  'legal.privacy.section.changes': { en: '10. Changes', vi: '10. Thay đổi' },
  'legal.privacy.section.contact': { en: '11. Contact', vi: '11. Liên hệ' },
} as const satisfies Readonly<Record<string, LandingCopyEntry>>;
