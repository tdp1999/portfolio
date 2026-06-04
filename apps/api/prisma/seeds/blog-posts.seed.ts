import { Language, PostStatus, PrismaClient } from '@prisma/client';
import { v7 as uuidv7 } from 'uuid';

interface SeedEnv {
  ADMIN_EMAIL?: string;
}

// ---------------------------------------------------------------------------
// Categories (4)
// ---------------------------------------------------------------------------
const CATEGORIES = [
  {
    slug: 'engineering',
    name: 'Engineering',
    description: 'Hands-on engineering writeups and deep-dives.',
    displayOrder: 1,
  },
  {
    slug: 'process',
    name: 'Process',
    description: 'How work gets shipped — retros, planning, workflows.',
    displayOrder: 2,
  },
  { slug: 'industry', name: 'Industry', description: 'Opinions and essays about the craft.', displayOrder: 3 },
  { slug: 'notes', name: 'Notes', description: 'Short notes, TILs, quick tips.', displayOrder: 4 },
] as const;

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------
const TAGS = [
  { slug: 'angular', name: 'Angular' },
  { slug: 'ssr', name: 'SSR' },
  { slug: 'typescript', name: 'TypeScript' },
  { slug: 'postgres', name: 'Postgres' },
  { slug: 'performance', name: 'Performance' },
  { slug: 'refactor', name: 'Refactor' },
  { slug: 'workflow', name: 'Workflow' },
  { slug: 'opinion', name: 'Opinion' },
  { slug: 'tip', name: 'Tip' },
  { slug: 'design-systems', name: 'Design systems' },
] as const;

// ---------------------------------------------------------------------------
// Media (featured images) — Cloudinary placeholders
// ---------------------------------------------------------------------------
// Each cover points to a DIFFERENT Cloudinary demo asset so the list +
// strip variants render visually distinct thumbnails — important for DDL
// review. (Previously every URL pointed to `sample.jpg` which produced a
// list of identical green-flower covers.)
const MEDIA = [
  {
    publicId: 'seed-blog/deep-dive-cover',
    originalFilename: 'deep-dive-cover.jpg',
    mimeType: 'image/jpeg',
    url: 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg',
    format: 'jpg',
    bytes: 120000,
    width: 1600,
    height: 900,
    altText: 'Deep-dive cover — abstract gradient',
    folder: 'seed-blog',
  },
  {
    publicId: 'seed-blog/retro-cover',
    originalFilename: 'retro-cover.jpg',
    mimeType: 'image/jpeg',
    url: 'https://res.cloudinary.com/demo/image/upload/v1/mountain.jpg',
    format: 'jpg',
    bytes: 110000,
    width: 1600,
    height: 900,
    altText: 'Retro cover — workshop bench',
    folder: 'seed-blog',
  },
  {
    publicId: 'seed-blog/essay-vi-cover',
    originalFilename: 'essay-vi-cover.jpg',
    mimeType: 'image/jpeg',
    url: 'https://res.cloudinary.com/demo/image/upload/v1/leaves.jpg',
    format: 'jpg',
    bytes: 105000,
    width: 1600,
    height: 900,
    altText: 'Essay cover — typographic still',
    folder: 'seed-blog',
  },
  {
    publicId: 'seed-blog/note-en-cover',
    originalFilename: 'note-en-cover.jpg',
    mimeType: 'image/jpeg',
    url: 'https://res.cloudinary.com/demo/image/upload/v1/balloons.jpg',
    format: 'jpg',
    bytes: 95000,
    width: 1600,
    height: 900,
    altText: 'Note cover — minimal index card',
    folder: 'seed-blog',
  },
  {
    publicId: 'seed-blog/note-vi-cover',
    originalFilename: 'note-vi-cover.jpg',
    mimeType: 'image/jpeg',
    url: 'https://res.cloudinary.com/demo/image/upload/v1/woman.jpg',
    format: 'jpg',
    bytes: 95000,
    width: 1600,
    height: 900,
    altText: 'Note cover — minimal index card',
    folder: 'seed-blog',
  },
  {
    publicId: 'seed-blog/featured-essay-cover',
    originalFilename: 'featured-essay-cover.jpg',
    mimeType: 'image/jpeg',
    url: 'https://res.cloudinary.com/demo/image/upload/v1/couple.jpg',
    format: 'jpg',
    bytes: 130000,
    width: 1600,
    height: 900,
    altText: 'Featured essay cover — bold geometric mark',
    folder: 'seed-blog',
  },
] as const;

// ---------------------------------------------------------------------------
// Post bodies (Markdown)
// ---------------------------------------------------------------------------
const deepDiveContent = [
  '> The fastest first paint I have ever shipped came from a one-line patch. The hardest bug I have ever shipped came from the same patch.',
  '',
  "Angular SSR has matured into something genuinely production-ready, but the line between server and client still hides traps. The most common one I've watched teams fall into is the **double-fetch flash** — a list that arrives in the SSR HTML, then refetches on the client and replaces itself a beat later. This post is the long version of how to avoid it, what `provideClientHydration` actually buys you, and the moment when you should *not* reach for the transfer cache.",
  '',
  '## What the transfer cache actually does',
  '',
  'When Angular renders on the server, every `HttpClient` call resolves over the wire — that is just standard SSR. The interesting part is what happens with the *result*.',
  '',
  'By default, those responses live and die on the server. The client boot starts from scratch, hits the same endpoints again, and now you have paid for the data twice — once to fill the HTML, once to populate the runtime store. Worse: the visible flash. The user sees `[item, item, item]` for a tick, then a sudden re-render as the client store catches up.',
  '',
  'The HTTP transfer cache solves this by serializing server responses into a `<script>` tag inside the SSR document, then replaying them on the client before the same outbound requests fire. The client-side `HttpClient` checks the transfer cache first; if a matching request is queued for replay, it resolves synchronously. No second network hit. No flash.',
  '',
  '```ts',
  "import { provideClientHydration, withHttpTransferCacheOptions } from '@angular/platform-browser';",
  '',
  'export const appConfig: ApplicationConfig = {',
  '  providers: [',
  '    provideClientHydration(',
  '      withHttpTransferCacheOptions({',
  '        includePostRequests: false,',
  "        filter: (req) => !req.url.includes('/auth/'),",
  '      }),',
  '    ),',
  '  ],',
  '};',
  '```',
  '',
  'The `filter` predicate is the part most teams skip — and the part that bites them later.',
  '',
  '## When the transfer cache is wrong',
  '',
  'The transfer cache is a *server-issued claim* that "this response is what the client will see." That claim is fine for public, immutable lists — a blog index, a list of public projects, a marketing CMS block. It is exactly wrong for anything that depends on a per-user context.',
  '',
  "Consider an authenticated `/me` endpoint. On the server, the SSR request happens without the user's session cookie (or with a service-account cookie, depending on your setup). That response gets serialized into the document. The client boots, the user *does* have a session, and your `HttpClient` happily returns the unauthenticated payload from the cache instead of refetching.",
  '',
  'The bug is silent. There is no error, no failed request — just a wrong state, served confidently.',
  '',
  '### The discipline',
  '',
  'I have moved to an explicit allowlist rather than an explicit denylist. Anything authenticated, anything personalized, anything that mutates — skip the cache. Everything else — opt in.',
  '',
  '```ts',
  'withHttpTransferCacheOptions({',
  '  filter: (req) => {',
  "    const publicGetPrefixes = ['/api/blog/', '/api/projects/', '/api/profile/'];",
  "    if (req.method !== 'GET') return false;",
  '    return publicGetPrefixes.some((p) => req.url.includes(p));',
  '  },',
  '})',
  '```',
  '',
  '## Hydration mismatches and the `ngSkipHydration` escape hatch',
  '',
  'Even with the transfer cache wired correctly, you can still ship a hydration mismatch — the angry red console message that means the server-rendered DOM and the client expected DOM disagreed about what to mount.',
  '',
  'Common causes:',
  '',
  '- A component reads `Date.now()` or `Math.random()` during render. The server and client disagree on the value.',
  '- A directive mutates DOM outside Angular (e.g. a tooltip library, a syntax highlighter) before Angular re-hydrates. Angular sees foreign children, panics.',
  '- A `*ngIf` switches on `isPlatformBrowser(...)` — meaning the server omits a node the client expects to find.',
  '',
  'The escape hatch is `ngSkipHydration` on the offending host element. It tells Angular: "I know this subtree is going to look different on the client. Tear it down and re-render from scratch, do not try to match." Use it sparingly. Every node you skip is a node that flashes.',
  '',
  '### The order matters',
  '',
  'I burned a full afternoon on this once. We had a Shiki-powered code block component. On the server, Shiki was synchronous; the rendered HTML contained the highlighted output. On the client, the same component re-ran asynchronously, replaced the inner HTML, and Angular tried to hydrate against the *original* server-rendered nodes. Boom — mismatch.',
  '',
  'The fix was to add `ngSkipHydration` to the host element. The cost was a one-frame flash on first paint — barely visible, but real. The alternative was a refactor that taught Shiki to defer its client-side replacement until after hydration completed, which would have been the right answer if I had two more days. I did not.',
  '',
  '## The `TransferState` API for non-HTTP data',
  '',
  'Not all server-fetched data is HTTP. Maybe you read a file. Maybe you compute a value. Maybe you query a service that does not go through `HttpClient` at all. For those cases, the lower-level `TransferState` API lets you stash arbitrary key-value pairs into the SSR document for the client to pick up.',
  '',
  '```ts',
  "import { makeStateKey, TransferState } from '@angular/core';",
  '',
  "const POSTS_KEY = makeStateKey<BlogPost[]>('initial-posts');",
  '',
  '// On the server:',
  'this.transferState.set(POSTS_KEY, posts);',
  '',
  '// On the client:',
  'const initial = this.transferState.get(POSTS_KEY, []);',
  '```',
  '',
  'I reach for this when I want a clean signal-based store hydrated from the server without going through the HTTP layer at all — for example, when the data was already in memory on the server (a config block, a feature flag bundle) and re-requesting it client-side would be silly.',
  '',
  '## What I do now',
  '',
  'For most projects, my SSR baseline now looks like:',
  '',
  '- `provideClientHydration` with an explicit allowlist of cacheable `GET` prefixes.',
  '- A short-circuit on the data services so the *same call* on server and client lands on the same cache key.',
  '- `ngSkipHydration` only on islands I know are going to mutate post-hydrate (syntax highlighting, third-party widgets).',
  '- A Playwright check that fetches the raw HTML and asserts the SSR HTML actually contains the data — not just the shell.',
  '',
  'The last one is the most important. SSR is invisible when it works and invisible when it does not. Without a contract test, you will only notice the regression months later when a marketing person complains the search snippet looks empty.',
  '',
  '![Angular SSR architecture diagram](https://res.cloudinary.com/demo/image/upload/v1/sample.jpg)',
  '',
  '## Closing',
  '',
  'Hydration is one of those topics where the docs explain the API but not the failure modes. The API is two providers and three options. The failure modes are six different ways to flash, refetch, or misauthenticate yourself.',
  '',
  'If you walk away with one thing, let it be the allowlist filter. The default `includePostRequests: false` is good, but `filter: () => true` is the trap that ships the per-user bug. Be explicit. Future-you will thank you.',
  '',
  '## Debugging an SSR hydration issue',
  '',
  'When something does go wrong, the symptom is almost never the cause. The visible flash, the wrong data, the console mismatch warning — these are downstream of one of three things: a request that should have been cached but was not, a request that was cached but should not have been, or a render-time value that disagreed between server and client.',
  '',
  'The fastest debug loop I have settled on is:',
  '',
  '1. Open the SSR HTML directly and grep for the `<script id="ng-state">` tag. If your data is not in there, the transfer cache never picked it up — the request did not match your filter, or the response was non-`GET`, or the call happened after `renderApplication` resolved.',
  '',
  '```bash',
  'curl -s http://localhost:4200/blog | grep -o \'<script id="ng-state"[^>]*>\' | head -1',
  "curl -s http://localhost:4200/blog | grep -c 'transfer'",
  '```',
  '',
  '2. If the data *is* in there but the page still flashes, the cache hit is missing on the client. Open the Network panel, throttle to Slow 3G, reload, and watch for the second request. If you see one, your filter on the client diverges from the server (different URL, different params, different headers).',
  '3. If the data is there and there is no second request but the page still flashes, you have a hydration mismatch unrelated to data — usually a `Date.now()` or `Math.random()` in a render path, or an external library mutating the DOM before Angular hydrates.',
  '',
  'I keep a Playwright contract test that asserts each of these properties, because once you have shipped a regression once, you will ship it again. The cost of writing the test is an hour; the cost of debugging the regression in production is a day.',
  '',
  '## Caching beyond Angular',
  '',
  'The transfer cache only handles the *Angular* layer. If your SSR server sits behind a CDN (Cloudflare, Fastly, CloudFront), you can stack another cache on top — the rendered HTML itself, served back to repeated visitors without ever booting Angular on the server. This is the cheapest possible response: bytes off disk, no Node process involved, no database touched.',
  '',
  'The interaction is what gets people. A CDN cache holding stale HTML, served to a logged-in user, can leak data across sessions. The discipline is the same as the transfer cache: only cache responses that are safe to share. Public list pages — yes. The `/dashboard` route — never. The default should be `Cache-Control: private, no-store`, with an explicit opt-in for routes you have audited.',
  '',
  'A useful pattern: in the Angular SSR server (Express or Node), set the cache header based on the resolved route. Public routes get a TTL; everything else gets `private, no-store`. This makes the CDN behavior visible in the same code that handles routing, instead of buried in CDN config that only one person on the team understands.',
  '',
  '## The shape of a healthy SSR pipeline',
  '',
  'After enough projects I now think of SSR as a contract with three signatures: the *server* renders HTML that contains the first-paint data, the *transfer cache* carries that data across the boundary, and the *client* picks it up without refetching. If any of the three is broken, the user sees it. If all three are healthy, the user sees a first paint indistinguishable from a static site, with the interactive bonus of a SPA the moment they click anything.',
  '',
  'The work to get there is not glamorous. It is mostly filter predicates and contract tests. But it is the difference between an SSR app that *feels fast* and an SSR app that has SSR-shaped technical debt under a thin coat of paint.',
].join('\n');

const retroContent = [
  'Last quarter I rewrote the console for the [Document Engine](/projects/document-engine) project end-to-end. This is the retro — what I kept, what I tossed, and what I would do differently next time.',
  '',
  '## The starting state',
  '',
  'The original console was four years old. It had grown organically: a `Forms` page nobody understood, a `Templates` page that overlapped with it, a `Documents` page that was actually the only one anyone used. The codebase was Angular 14 with a hand-rolled Material clone and a state library nobody on the team had touched in six months.',
  '',
  '## What I kept',
  '',
  'The data shape. The backend had a sensible domain model — `Template` → `Form` → `Submission` → `Document` — and the API contracts were stable. There was no reason to touch that. I rebuilt the UI against the same endpoints.',
  '',
  'The workflow. Users navigated the console in a roughly linear shape: pick a template, configure a form, send it out, collect submissions, render documents. The new UI made that path more visible (left rail, breadcrumbs that mean something) but did not invent a new flow.',
  '',
  '## What I tossed',
  '',
  'The state library. The codebase had a custom store that predated signals, predated NgRx component-store, and predated good judgment. I tore it out and replaced it with a thin signals-based store per feature. The diff was -3,400 lines.',
  '',
  '```ts',
  '// before — 80 lines of boilerplate per slice',
  '@Injectable()',
  'export class TemplatesStore extends EntityStore<Template> { ... }',
  '',
  '// after — 12 lines, signal-based',
  "@Injectable({ providedIn: 'root' })",
  'export class TemplatesStore {',
  '  private readonly api = inject(TemplatesApi);',
  '  readonly templates = signal<Template[]>([]);',
  '  readonly loading = signal(false);',
  '  async load() { this.loading.set(true); this.templates.set(await this.api.list()); this.loading.set(false); }',
  '}',
  '```',
  '',
  '## What I would do differently',
  '',
  'I shipped the rewrite as one big PR. It worked, but the review took two weeks because there was no incremental story. Next time I would land the design system first, then one page at a time behind a feature flag.',
  '',
  '## Numbers',
  '',
  'Bundle: 412kb → 268kb. Initial render: 1.8s → 0.9s on a mid-tier laptop. Lighthouse perf score: 71 → 94. The biggest single win was deleting the custom Material clone; Angular Material is good now and I do not need to maintain a parallel set of components.',
  '',
  "More importantly, the team can read the code again. That doesn't show up in any metric, but it shows up in how fast tickets close.",
  '',
  '## On rollout discipline',
  '',
  'The one thing I want to single out: rollout discipline matters more than the rewrite itself. When I finally merged the new console, I kept the old one mounted behind a `?legacy=1` query param for two weeks. Anyone who hit a problem could fall back, and I had a clean signal — if the legacy hit count stayed at zero, the new console was at least as good as the old one. Three users used the legacy escape hatch in the first week. All three reported bugs that I fixed within the day. By week two, the hatch was unused.',
  '',
  'Without that safety net, I would have shipped on a Friday, broken something invisible on a Monday, and lost a week of trust. The escape hatch cost me one extra route definition. It bought me confidence I could not have bought any other way.',
  '',
  '## What I learned about my own habits',
  '',
  'I tend to over-design the abstractions on the first pass. The original signals store I wrote was generic — typed slices, a base class, lifecycle hooks. Two weeks in, I realized every concrete store was overriding the same three methods and the base class was just ceremony. I deleted it. The final shape is a flat per-feature store with zero inheritance, and the call sites read like English. I keep relearning this lesson and I will probably keep relearning it.',
].join('\n');

const essayViContent = [
  'Tôi không tin vào "tốc độ" như một chỉ số đo lường công việc kỹ thuật. Tôi tin vào *độ bền* — tức là sản phẩm tôi viết ra có còn đứng vững sau ba tháng, sáu tháng, một năm hay không.',
  '',
  'Một feature ship nhanh nhưng vỡ lúc người khác sờ vào, đối với tôi là feature thất bại. Một feature ship chậm một tuần nhưng ba tháng sau vẫn không sinh bug, không cần ai phải hiểu lại từ đầu — đó là feature thành công.',
  '',
  'Cách tôi đo công việc của bản thân, nói thẳng ra, là đếm số lần phải quay lại sửa. Một module tôi viết xong rồi không phải đụng tới trong nửa năm là một module tốt. Một module tôi phải patch ba lần trong một tháng là một module tôi đã viết ẩu — bất kể nó ship nhanh tới đâu.',
  '',
  '## Ba câu hỏi tôi tự hỏi trước khi merge',
  '',
  'Trước khi gửi một pull request, tôi tự hỏi ba câu:',
  '',
  '- Nếu sáu tháng nữa tôi quên hết, đọc lại code này tôi có hiểu được không?',
  '- Nếu một người mới vào team đọc code này, họ có biết tại sao nó ở đây, hay họ phải đi hỏi tôi?',
  '- Nếu có bug, tôi có biết bắt đầu sửa từ đâu không?',
  '',
  'Nếu câu trả lời cho bất kỳ câu nào là *không chắc*, tôi không merge.',
  '',
  '## Tại sao tôi không đo bằng số lượng commit',
  '',
  'Số lượng commit, số dòng code, số PR — tất cả những thứ đó là proxy metric. Chúng dễ đo, dễ báo cáo, nhưng không phản ánh giá trị thực. Một dòng code đúng có thể đáng giá bằng năm trăm dòng phải viết lại.',
  '',
  'Cái tôi muốn đo là: hệ thống có ngày càng dễ thay đổi hơn không. Mỗi PR mới, codebase trở nên dễ bảo trì hơn — hay khó hơn? Đây là câu hỏi quan trọng nhất, và cũng là câu hỏi khó đo nhất.',
  '',
  '## Một cách thực hành đơn giản',
  '',
  'Mỗi lần tôi đụng vào một module mình từng viết, tôi tự hỏi: nếu phải viết lại từ đầu, tôi có viết khác đi không? Nếu câu trả lời là *không* — nghĩa là module đó vẫn đứng vững. Nếu câu trả lời là *có, khác nhiều* — nghĩa là tôi đã học được gì đó, và đến lúc refactor một chút.',
  '',
  'Nhưng chỉ refactor cái tôi vừa đụng vào. Đừng refactor toàn bộ codebase chỉ vì có một insight mới. Cách làm đó tốn thời gian, tạo ra bug, và không ai cảm ơn bạn cả. Refactor cục bộ, theo từng PR — đó là cách codebase tự tiến hoá mà không vỡ.',
].join('\n');

const noteEnContent = [
  'Postgres lets you make a unique index *partial* by adding a `WHERE` clause. Combined with a `deletedAt` column for soft delete, this gives you the perfect shape: slugs from soft-deleted rows can be reused by new active rows, but two active rows can never share a slug.',
  '',
  '```sql',
  'CREATE UNIQUE INDEX "posts_slug_active_key" ON "posts" ("slug") WHERE "deletedAt" IS NULL;',
  '```',
  '',
  "Prisma can't model partial indexes in `schema.prisma` directly — you have to manage them via raw SQL in your migrations. The downside is that Prisma's `upsert` then can't use the unique constraint either; you fall back to `findFirst { where: { slug, deletedAt: null } }` + `create`. Small annoyance, big payoff.",
].join('\n');

const noteViContent = [
  'RxJS đẹp khi bạn có nhiều luồng dữ liệu cần phối hợp với nhau. RxJS thừa thãi khi bạn chỉ cần đọc một giá trị một lần.',
  '',
  'Quy tắc tôi dùng: nếu chỉ có một event, dùng signal. Nếu có nhiều event nhưng không phụ thuộc thời gian, dùng signal. Nếu cần debounce, combine, hoặc race giữa các luồng — RxJS.',
  '',
  'Đừng dùng `BehaviorSubject` chỉ vì quen tay. `signal<T>(initial)` ngắn hơn, gọn hơn, không cần unsubscribe.',
].join('\n');

const featuredEssayContent = [
  'Every project I have shipped in the last two years started with the same step: I built the design system before I built the first screen.',
  '',
  'This sounds backwards. The conventional wisdom is the opposite — design the screen, extract patterns, *then* systematize. Build the cowpath, *then* pave it. I no longer believe this.',
  '',
  '## Why I changed my mind',
  '',
  "When you build the screen first, every component you write is shaped by that one screen's constraints. The button is colored to look good against that hero. The card is sized to fit that grid. The typography scale is whatever happened to feel right that afternoon.",
  '',
  'Three screens later, you have three buttons, three cards, three scales — and now the work of unification is a *retrofit*, fighting against decisions that have already shipped. Every refactor is a tax. Every new screen is more debt.',
  '',
  'When you build the system first, every component is shaped by *the language*, not the screen. The button is colored because the brand says so. The card is sized to fit the spacing grid. The scale is built once, reasoned about once, and then *re-used* on every screen.',
  '',
  '## What "design system first" actually means',
  '',
  'It does not mean building Material from scratch. It means:',
  '',
  '- Pick the type scale before the first screen.',
  '- Pick the spacing grid before the first screen.',
  '- Pick the color tokens before the first screen.',
  '- Build five or six primitives — button, link, card, input, badge, eyebrow — and prove they compose into the first three screens you have planned.',
  '',
  'That is one or two weeks of upfront work. The payoff is that the next twenty screens take less time, not more.',
  '',
  '## When this is wrong',
  '',
  'When the product is in deep flux — you genuinely do not know what the screens look like yet — the system-first approach calcifies decisions that should stay liquid. In that case, build a quick prototype, learn what you need, *then* invest in the system.',
  '',
  'But once a product has any kind of shape, I do not skip this step. The cost of skipping it shows up six months later, and by then it is too late to do it cheaply.',
  '',
  '## The cheapest way to start',
  '',
  'A design system does not have to start as a separate library or a Figma file or a Storybook deployment. Mine usually starts as a single `tokens.scss` file plus a `_base-typography.scss` that defines the type scale and the leading. That is the entire system on day one. Components arrive as they are needed, and each new component is constrained to compose from the tokens that already exist.',
  '',
  'What changes is not the volume of work, but the *order*. Doing the tokens before the screens is cheap. Doing the tokens *after* the screens is a refactor — and refactors compete for time against feature work, which is a fight they always lose. The cheapest design system is the one you wrote before anyone had a chance to disagree with it.',
].join('\n');

const signalsContent = [
  'I removed the last `async` pipe from a production Angular app last month. Not as a stunt — it just stopped earning its place. This is the long version of why signals have quietly taken over the parts of my templates that observables used to own, and the few places I still reach for RxJS on purpose.',
  '',
  '## The async pipe was always a workaround',
  '',
  'The `async` pipe solved a real problem: subscribe in the template, unsubscribe when the view tears down, and trigger change detection on each emission. It was the cleanest answer Angular had for "render this stream" without leaking subscriptions.',
  '',
  'But it carried baggage. Every `obj$ | async` is a separate subscription, so reading the same stream three times in a template meant three subscriptions unless you wrapped it in an `*ngIf="x$ | async as x"` dance. Nested streams turned templates into a thicket of `as` aliases. And the value was always "maybe null yet" until the first emission, which leaked `?.` and `*ngIf` guards everywhere.',
  '',
  '## What signals change',
  '',
  'A signal is a value you read synchronously and a dependency the framework tracks automatically. There is no "not yet" state, no subscription, no teardown. You read it like a property and the template re-renders when it changes.',
  '',
  '```ts',
  'readonly query = signal("");',
  'readonly results = computed(() => this.filter(this.all(), this.query()));',
  '```',
  '',
  'The `computed` re-runs only when `all` or `query` actually change, and only if something is reading it. No manual `combineLatest`, no `distinctUntilChanged`, no `shareReplay` to avoid recomputation. The dependency graph is implicit and exact.',
  '',
  '## Converting a stream-heavy component',
  '',
  'The pattern I follow: push RxJS to the *edges* — the places where data genuinely arrives over time — and convert to signals as early as possible with `toSignal`.',
  '',
  '```ts',
  'private readonly route = inject(ActivatedRoute);',
  'readonly id = toSignal(this.route.paramMap.pipe(map((p) => p.get("id"))), { initialValue: null });',
  'readonly post = computed(() => this.store.byId(this.id()));',
  '```',
  '',
  'The router still hands me an observable — that is its API, and streams are the right model for "the URL changes over time." But the moment that value enters my component logic, it becomes a signal, and everything downstream is synchronous, null-safe, and trivially testable.',
  '',
  '## Where I still use RxJS',
  '',
  'Signals are state. RxJS is events. The line is sharper than I expected:',
  '',
  '- **Debounced search** — `debounceTime`, `switchMap`, cancellation. Signals have no native debounce, and faking it with `effect` + `setTimeout` is worse than just using the stream.',
  '- **Coordinating multiple async sources** that race or merge — `combineLatest`, `forkJoin`, `merge`. This is what RxJS was built for.',
  '- **Anything with backpressure or cancellation semantics** — an upload that should abort when the user navigates away.',
  '',
  'For everything else — derived view state, form values, toggles, the result of a single fetch — a signal is shorter, has no teardown, and never renders a flash of null.',
  '',
  '## The testing dividend',
  '',
  'The part nobody mentions: signal-based components are dramatically easier to test. No `fakeAsync`, no `tick()`, no marble diagrams for the common case. You set an input, read a computed, assert. The test reads like the component.',
  '',
  '```ts',
  'component.query.set("ssr");',
  'expect(component.results()).toHaveLength(2);',
  '```',
  '',
  'That is the whole test. No subscription, no async, no flush. When the mental model of the code and the mental model of the test converge, you write more tests, and the ones you write are the ones that catch real regressions.',
  '',
  '## Closing',
  '',
  'I am not anti-RxJS. I am anti-ceremony. The async pipe made me pay a subscription-and-null tax on every derived value, most of which were not streams at all — they were just *state I had modeled as a stream because that was the only tool*. Signals gave the state back its natural shape, and left RxJS to do the thing it is genuinely best at: events over time.',
].join('\n');

const nxBoundariesContent = [
  'Every Nx monorepo I have worked in eventually hits the same wall: the dependency graph turns into a hairball, a "shared" library imports half the app, and a change to a leaf utility rebuilds everything. Module boundaries are the fix, but most teams configure them once, get yelled at by the linter, add an exception, and never think about them again. Here is how I actually use them.',
  '',
  '## Tags are a type system for architecture',
  '',
  'Nx lets you tag every project and then write rules about which tags may depend on which. The mistake is treating tags as labels. They are not labels — they are a *type system for your architecture*, and the lint rule is the type-checker.',
  '',
  'I use two tag dimensions: **scope** (which domain owns this) and **type** (what layer this is).',
  '',
  '```json',
  '{ "tags": ["scope:blog", "type:feature"] }',
  '{ "tags": ["scope:shared", "type:ui"] }',
  '```',
  '',
  '## The rules that matter',
  '',
  'The `@nx/enforce-module-boundaries` rule does the work. The constraints I land on, almost every time:',
  '',
  '- A `feature` may depend on `ui`, `data-access`, and `util` — but never another `feature`. Features are leaves. If two features need to share, the shared thing moves down a layer.',
  '- `ui` may depend on `util` only. No data-access in a presentational component.',
  '- `scope:shared` may be imported by anyone, but may import only other `scope:shared`. Shared code cannot reach back into a domain.',
  '- A domain scope (`scope:blog`) may import `scope:shared` but never another domain (`scope:projects`).',
  '',
  '```json',
  '{',
  '  "depConstraints": [',
  '    { "sourceTag": "type:feature", "onlyDependOnLibsWithTags": ["type:ui", "type:data-access", "type:util"] },',
  '    { "sourceTag": "type:ui", "onlyDependOnLibsWithTags": ["type:ui", "type:util"] },',
  '    { "sourceTag": "scope:blog", "onlyDependOnLibsWithTags": ["scope:blog", "scope:shared"] }',
  '  ]',
  '}',
  '```',
  '',
  '## Why "feature never imports feature" is the load-bearing rule',
  '',
  'This is the rule people fight the hardest and the one that pays the most. The instant feature A imports feature B, you have coupled two domains, you have created a rebuild dependency, and you have made both features impossible to reason about in isolation.',
  '',
  'When you genuinely need to share, the act of *pushing the shared thing down a layer* forces a good question: is this UI (move to `ui`), data (move to `data-access`), or a pure function (move to `util`)? The answer is almost always clarifying. The hairball forms when you skip that question and reach sideways instead of down.',
  '',
  '## The exception that is not an exception',
  '',
  'Routing. A shell app composes features by lazy-loading their routes — that is allowed, because the shell depends on features by configuration, not by importing their internals. The boundary rule permits an `app` to depend on many features; it forbids a feature from depending on a peer. Keep the composition at the top and the leaves stay clean.',
  '',
  '## Make the graph visible',
  '',
  '`nx graph` is not a debugging tool you run once. I keep it open during any refactor that moves code between libraries. The shape of the graph *is* the architecture; if the picture looks wrong, the code is wrong, regardless of whether the lint passed. A tidy graph and a green boundary lint are two different signals, and you want both.',
].join('\n');

const prChecklistContent = [
  'I have reviewed a few thousand pull requests. Most of what makes review valuable is not catching bugs — it is catching the things that will *become* bugs, or that will make the next person slower. Here is the checklist I run, roughly in order, and why each item earns its place.',
  '',
  '## 1. Does the PR do one thing?',
  '',
  'Before I read a line, I check the scope. A PR that "fixes the bug and also refactors the service and also renames three files" is three PRs wearing a trenchcoat. I ask for the split, every time. Not to be pedantic — a focused PR is reviewable, revertable, and bisectable. A mixed PR is none of those.',
  '',
  '## 2. Read the test first',
  '',
  'I read the test before the implementation. The test tells me what the author *thinks* the code does, in executable form. If I cannot understand the feature from the test, the test is too coupled to implementation, or the feature is underspecified. Either way I have learned something before reading the real code.',
  '',
  '## 3. Look for the thing that is not there',
  '',
  'The hardest review skill is noticing absence. The error path that is not handled. The loading state that is not rendered. The empty-list case. The second click. Reviewers are good at judging the code on screen and bad at noticing the code that should be on screen and is not. I keep an explicit mental list: error, empty, loading, race, off-by-one.',
  '',
  '## 4. Names',
  '',
  'I push hard on names, and I make no apology for it. A function named `handleData` tells me nothing; a function named `mergeDraftIntoPublished` tells me the whole story. Names are the densest documentation in the codebase and the only docs guaranteed to stay in sync with the code. A rename costs the author thirty seconds and saves the next reader thirty minutes.',
  '',
  '## 5. Is this tested at the right level?',
  '',
  'Not "is there a test" but "is the test at the right altitude." Business logic deserves a unit test. A wiring change deserves an integration test. A user flow deserves an e2e. A getter does not deserve a test at all. I have learned to flag both under-testing *and* over-testing — a hundred tests on trivial field assignments is noise that slows every future change.',
  '',
  '## 6. Would I be able to debug this at 2am?',
  '',
  'The final pass. If this code breaks in production six months from now, and I am the one paged, can I find the problem? Is there a log at the boundary? Does the error carry enough context? Is the control flow linear enough to read under stress? Code is written once and debugged many times, often by someone tired.',
  '',
  '## What I do not comment on',
  '',
  'Formatting. Indentation. Quote style. Import order. All of it is handled by Prettier and the linter, automatically, and any human comment about it is wasted attention. If we are arguing about whitespace in a review, the tooling has failed, and the fix is tooling, not a comment. I spend my review budget on the things a machine cannot judge: scope, names, absence, and whether the code will be kind to the next person.',
].join('\n');

const testFirstViContent = [
  'Tôi viết test trước khi viết code. Không phải vì sách bảo thế, mà vì sau nhiều năm tôi nhận ra: viết test trước buộc tôi phải *hiểu mình đang làm gì* trước khi gõ dòng code đầu tiên.',
  '',
  'Phần lớn bug tôi từng tạo ra không phải do code sai. Chúng đến từ việc tôi không hiểu rõ yêu cầu, nhưng vẫn lao vào viết. Viết test trước chặn đúng cái lỗi đó lại.',
  '',
  '## Test trước là một cách đặt câu hỏi',
  '',
  'Khi tôi viết test trước, câu đầu tiên tôi phải trả lời là: *hàm này nhận gì, trả về gì?* Nghe đơn giản, nhưng nửa số lần tôi nhận ra mình chưa biết. Input có thể null không? Khi rỗng thì sao? Lỗi thì trả về gì hay ném exception?',
  '',
  'Những câu hỏi đó, nếu không có test, tôi sẽ trả lời *trong lúc viết code* — tức là trả lời một cách ngẫu hứng, mỗi chỗ một kiểu. Test trước ép tôi trả lời *trước*, một lần, dứt khoát.',
  '',
  '## Red, green, refactor — nhưng thực dụng',
  '',
  'Tôi không theo TDD một cách giáo điều. Tôi theo nó ở chỗ nó đáng theo:',
  '',
  '- **Logic nghiệp vụ** — test trước, luôn luôn. Đây là chỗ bug đắt nhất.',
  '- **Wiring, gán field, getter** — không test trước, đôi khi không test luôn.',
  '- **Bug** — viết test tái hiện bug *trước*, rồi mới sửa. Test đó vừa chứng minh bug có thật, vừa đảm bảo nó không quay lại.',
  '',
  '```ts',
  'it("trả về null khi slug không tồn tại", () => {',
  '  expect(service.findBySlug("khong-co")).toBeNull();',
  '});',
  '```',
  '',
  '## Cái giá và cái lợi',
  '',
  'Viết test trước chậm hơn ở giờ đầu. Nhưng cái "chậm" đó là chậm khi *suy nghĩ*, không phải chậm khi *gõ phím*. Và suy nghĩ trước khi gõ là việc đáng làm chậm.',
  '',
  'Cái lợi đến vài tháng sau, khi tôi đụng lại module cũ. Tôi sửa, chạy test, thấy xanh — và tôi tin. Không có test, mỗi lần sửa code cũ là một lần đánh cược. Có test, nó chỉ là một thay đổi bình thường.',
  '',
  '## Khi nào tôi không viết test trước',
  '',
  'Khi tôi đang *khám phá* — chưa biết giải pháp trông như thế nào, đang thử nghiệm. Lúc đó test trước là cản trở, vì tôi còn chưa biết cái mình muốn test. Tôi prototype cho tới khi hình dạng lộ ra, rồi *xoá prototype*, và viết lại tử tế với test trước. Bước xoá đó quan trọng — prototype không có test không nên sống tới production.',
].join('\n');

const hasSelectorContent = [
  'CSS `:has()` is the first true parent selector, and after a year of shipping it to production I can say the hype was correct — but the useful cases are not the ones in the demos.',
  '',
  'The demos always show `:has()` styling a card based on whether it contains an image. Real value, in my experience, is in *form state* and *layout adaptation* without a single line of JavaScript.',
  '',
  '## Form validation styling, zero JS',
  '',
  '```css',
  '.field:has(input:invalid:not(:placeholder-shown)) {',
  '  --border: var(--color-danger);',
  '}',
  '.form:has(input:invalid) button[type="submit"] {',
  '  opacity: 0.5;',
  '  pointer-events: none;',
  '}',
  '```',
  '',
  'The submit button disables itself when any input in the form is invalid — no `[disabled]` binding, no form-state subscription, no change detection. The browser already knows the validity state; `:has()` just lets CSS read it.',
  '',
  '## Layout that reacts to content',
  '',
  '```css',
  '.grid:has(> :nth-child(4)) { gap: 12px; }',
  '.toolbar:has(.search:focus-within) .secondary-actions { display: none; }',
  '```',
  '',
  'A toolbar that hides its secondary actions while the search box is focused — useful on mobile, and previously a JS job.',
  '',
  '## The performance footnote',
  '',
  'Early fear was that `:has()` would be slow because it forces the engine to evaluate ancestors. In practice, on modern engines, the selectors above are fine. The one to avoid is `:has()` with a broad descendant combinator on a frequently-mutated subtree — `body:has(.foo)` re-evaluated on every DOM change can show up in a profile. Scope it tightly and it disappears from the flame chart.',
  '',
  'Support is now broad enough that I ship it without a fallback for non-critical styling, and with a `@supports` guard for anything load-bearing.',
].join('\n');

const zonelessContent = [
  'Angular is going zoneless, and the reaction I see most is either "this changes everything" or "this changes nothing." Both are wrong. Having migrated an app off Zone.js, here is what actually changes, what does not, and what surprised me.',
  '',
  '## What Zone.js was doing',
  '',
  'Zone.js monkey-patches every async API in the browser — `setTimeout`, `addEventListener`, `Promise`, `fetch` — so that when any of them fires, Angular knows to run change detection. It is how a plain `(click)="count++"` updates the view without you telling Angular anything. Convenient, and expensive: change detection runs after *every* async event, whether or not anything changed.',
  '',
  '## What changes',
  '',
  'Without Zone.js, Angular no longer knows when to check for changes — so you tell it, via signals. A signal write schedules change detection for the views that read it. That is the whole model.',
  '',
  '```ts',
  'readonly count = signal(0);',
  'increment() { this.count.update((n) => n + 1); } // schedules CD automatically',
  '```',
  '',
  'If your components are already signal-based with `OnPush`, the migration is mostly *deleting* things: remove `zone.js` from polyfills, add `provideZonelessChangeDetection()`, and run the app. The surprise is how little breaks.',
  '',
  '## What does not change',
  '',
  'Templates. Bindings. `@if`/`@for`. Lifecycle hooks. Dependency injection. Routing. None of it changes. Zoneless is a change to *when change detection runs*, not to how you write components. If you have been writing modern signal-based Angular, you have been writing zoneless-ready code without knowing it.',
  '',
  '## What surprised me',
  '',
  'Three things:',
  '',
  '1. **`setTimeout` no longer triggers a render.** Code that mutated a plain field inside a `setTimeout` and relied on Zone to notice — that breaks. The fix is to mutate a signal instead. Finding these is the bulk of the migration.',
  '2. **Third-party libraries that mutate state outside Angular** need a nudge. A charting library that updates on a `requestAnimationFrame` loop will not trigger CD; you wrap the state it feeds in a signal.',
  '3. **The performance win is real but quiet.** No more change detection on every mouse-move and scroll event. On a heavy page the difference in dropped frames during scroll was immediately visible in a trace.',
  '',
  '## Should you migrate now?',
  '',
  'If your app is signal-first and `OnPush` throughout: yes, it is a short migration with a real payoff. If your app is full of `Default` change detection, `setTimeout`-driven updates, and observable-in-template patterns: do the signal migration first. Zoneless is the reward for that work, not a shortcut around it.',
].join('\n');

const teamReviewViContent = [
  'Team mình review code theo một quy trình mình mất khá lâu mới chỉnh được cho đúng. Không quá nặng nề để làm chậm mọi người, nhưng đủ chặt để bug không lọt ra production. Đây là toàn bộ quy trình đó.',
  '',
  '## Nguyên tắc đầu tiên: PR nhỏ',
  '',
  'Quy tắc số một, và là quy tắc khó giữ nhất: PR phải nhỏ. Một PR dưới 400 dòng được review kỹ. Một PR 2000 dòng được review kiểu "nhìn qua thấy ổn, approve". Người ta không lười — não người có giới hạn. PR càng to, chất lượng review càng tụt.',
  '',
  'Nên việc đầu tiên khi mở một PR to là mình hỏi: tách được không? Gần như luôn tách được.',
  '',
  '## Ai review, review cái gì',
  '',
  'Mỗi PR cần ít nhất một approve từ người không viết code đó. Với code đụng vào phần nhạy cảm — auth, thanh toán, migration — cần hai.',
  '',
  'Reviewer tập trung vào ba thứ, theo đúng thứ tự:',
  '',
  '- **Đúng không** — logic có chạy đúng với cả case lỗi, case rỗng, case race không?',
  '- **Đọc được không** — sáu tháng nữa người khác đọc có hiểu không?',
  '- **Test đúng tầng chưa** — logic nghiệp vụ có unit test, flow có e2e, getter thì khỏi.',
  '',
  '## Cái mình KHÔNG review',
  '',
  'Format, thụt dòng, dấu nháy, thứ tự import — tất cả để cho Prettier và linter lo. CI chặn, không cần con người nhắc. Nếu trong PR có comment cãi nhau về khoảng trắng, nghĩa là tooling đang thiếu, và mình đi sửa tooling chứ không sửa thói quen con người.',
  '',
  '## Comment sao cho không làm tổn thương',
  '',
  'Một bài học mất thời gian mới học được: comment vào *code*, đừng comment vào *người*. "Hàm này nên tách ra cho dễ test" thì ổn. "Sao em lại viết thế này" thì không. Cùng một ý, nhưng một câu nói về code, một câu nói về người viết.',
  '',
  'Và khi mình khen thì mình khen cụ thể. "Chỗ xử lý lỗi này gọn, thích" — câu đó đáng giá hơn mười cái icon approve.',
  '',
  '## Tốc độ',
  '',
  'PR mở ra phải được review trong vòng nửa ngày làm việc. Để một PR treo hai ngày là cách nhanh nhất giết động lực của người viết, và là cách nhanh nhất tạo ra một hàng dài PR phụ thuộc lẫn nhau. Review nhanh không phải là review ẩu — nó là tôn trọng thời gian của nhau. Nếu mình bận, mình nói "chiều mình xem", chứ không để im.',
].join('\n');

// ---------------------------------------------------------------------------
// Post definitions
// ---------------------------------------------------------------------------
interface SeedPost {
  slug: string;
  language: Language;
  title: string;
  excerpt: string | null;
  content: string;
  featured: boolean;
  publishedAt: Date;
  metaTitle: string | null;
  metaDescription: string | null;
  categorySlug: string;
  tagSlugs: readonly string[];
  featuredImagePublicId: string;
}

const POSTS: readonly SeedPost[] = [
  {
    slug: 'seed-angular-ssr-transfer-cache',
    language: Language.EN,
    title: 'Angular SSR Hydration: The Transfer-Cache Pattern',
    excerpt:
      "The transfer cache solves Angular SSR's double-fetch flash — but it ships a per-user bug if you don't filter it. Here's the discipline I've landed on after a year of SSR work.",
    content: deepDiveContent,
    featured: true,
    publishedAt: new Date('2026-05-10T09:00:00Z'),
    metaTitle: 'Angular SSR Hydration: The Transfer-Cache Pattern',
    metaDescription:
      'A practical guide to Angular SSR hydration: when the HTTP transfer cache helps, when it ships silent bugs, and how to wire ngSkipHydration without flashes.',
    categorySlug: 'engineering',
    tagSlugs: ['angular', 'ssr', 'typescript'],
    featuredImagePublicId: 'seed-blog/deep-dive-cover',
  },
  {
    slug: 'seed-shipping-document-engine-console',
    language: Language.EN,
    title: 'Retro: Shipping the Document Engine console rewrite',
    excerpt:
      'A quarter-long console rewrite, 3,400 lines deleted, bundle nearly halved. What I kept, what I tossed, what I would do differently.',
    content: retroContent,
    featured: true,
    publishedAt: new Date('2026-03-15T09:00:00Z'),
    metaTitle: null,
    metaDescription: null,
    categorySlug: 'process',
    tagSlugs: ['refactor', 'performance'],
    featuredImagePublicId: 'seed-blog/retro-cover',
  },
  {
    slug: 'seed-cach-toi-do-cong-viec-ky-thuat',
    language: Language.VI,
    title: 'Cách tôi đo công việc kỹ thuật của mình',
    excerpt: 'Tốc độ không phải là chỉ số. Độ bền mới là chỉ số.',
    content: essayViContent,
    featured: true,
    publishedAt: new Date('2025-12-01T09:00:00Z'),
    metaTitle: null,
    metaDescription: null,
    categorySlug: 'industry',
    tagSlugs: ['workflow', 'opinion'],
    featuredImagePublicId: 'seed-blog/essay-vi-cover',
  },
  {
    slug: 'seed-til-postgres-partial-unique-indexes',
    language: Language.EN,
    title: 'TIL: Postgres partial unique indexes for soft delete',
    excerpt: null,
    content: noteEnContent,
    featured: true,
    publishedAt: new Date('2026-04-20T09:00:00Z'),
    metaTitle: null,
    metaDescription: null,
    categorySlug: 'notes',
    tagSlugs: ['tip', 'postgres'],
    featuredImagePublicId: 'seed-blog/note-en-cover',
  },
  {
    slug: 'seed-khi-nao-khong-dung-rxjs',
    language: Language.VI,
    title: 'Note: Khi nào không dùng RxJS',
    excerpt: null,
    content: noteViContent,
    featured: false,
    publishedAt: new Date('2025-11-05T09:00:00Z'),
    metaTitle: null,
    metaDescription: null,
    categorySlug: 'notes',
    tagSlugs: ['tip'],
    featuredImagePublicId: 'seed-blog/note-vi-cover',
  },
  {
    slug: 'seed-design-system-before-screen',
    language: Language.EN,
    title: 'Why I build the design system before the first screen',
    excerpt:
      'The conventional wisdom is to extract a system from real screens. I no longer believe this. Here is why I now invest one or two weeks upfront, every time.',
    content: featuredEssayContent,
    featured: true,
    publishedAt: new Date('2026-02-08T09:00:00Z'),
    metaTitle: null,
    metaDescription: null,
    categorySlug: 'industry',
    tagSlugs: ['opinion', 'design-systems'],
    featuredImagePublicId: 'seed-blog/featured-essay-cover',
  },
  {
    slug: 'seed-signals-death-of-async-pipe',
    language: Language.EN,
    title: 'Signals, effects, and the death of the async pipe',
    excerpt:
      'I removed the last async pipe from a production app. Why signals quietly took over the parts of my templates observables used to own — and the few places I still reach for RxJS on purpose.',
    content: signalsContent,
    featured: true,
    publishedAt: new Date('2026-06-01T09:00:00Z'),
    metaTitle: null,
    metaDescription: null,
    categorySlug: 'engineering',
    tagSlugs: ['angular', 'typescript'],
    featuredImagePublicId: 'seed-blog/deep-dive-cover',
  },
  {
    slug: 'seed-nx-module-boundaries',
    language: Language.EN,
    title: 'A pragmatic guide to Nx module boundaries',
    excerpt:
      'Tags are not labels — they are a type system for your architecture, and the lint rule is the type-checker. The constraints I land on in every monorepo, and why "feature never imports feature" pays the most.',
    content: nxBoundariesContent,
    featured: false,
    publishedAt: new Date('2026-05-28T09:00:00Z'),
    metaTitle: null,
    metaDescription: null,
    categorySlug: 'engineering',
    tagSlugs: ['typescript', 'refactor'],
    featuredImagePublicId: 'seed-blog/retro-cover',
  },
  {
    slug: 'seed-pr-review-checklist',
    language: Language.EN,
    title: 'The PR review checklist I actually use',
    excerpt:
      'After a few thousand reviews: scope, read the test first, look for the thing that is not there, names, test altitude, and "could I debug this at 2am?" — plus what I never comment on.',
    content: prChecklistContent,
    featured: false,
    publishedAt: new Date('2026-05-20T09:00:00Z'),
    metaTitle: null,
    metaDescription: null,
    categorySlug: 'process',
    tagSlugs: ['workflow', 'opinion'],
    featuredImagePublicId: 'seed-blog/note-en-cover',
  },
  {
    slug: 'seed-tai-sao-toi-viet-test-truoc',
    language: Language.VI,
    title: 'Tại sao tôi viết test trước khi viết code',
    excerpt:
      'Viết test trước không phải vì sách bảo thế — mà vì nó buộc tôi hiểu mình đang làm gì trước khi gõ dòng code đầu tiên.',
    content: testFirstViContent,
    featured: false,
    publishedAt: new Date('2026-04-10T09:00:00Z'),
    metaTitle: null,
    metaDescription: null,
    categorySlug: 'industry',
    tagSlugs: ['opinion', 'workflow'],
    featuredImagePublicId: 'seed-blog/essay-vi-cover',
  },
  {
    slug: 'seed-til-css-has-in-production',
    language: Language.EN,
    title: 'TIL: CSS :has() as a parent selector in production',
    excerpt: null,
    content: hasSelectorContent,
    featured: false,
    publishedAt: new Date('2026-05-02T09:00:00Z'),
    metaTitle: null,
    metaDescription: null,
    categorySlug: 'notes',
    tagSlugs: ['tip', 'design-systems'],
    featuredImagePublicId: 'seed-blog/note-vi-cover',
  },
  {
    slug: 'seed-zoneless-angular',
    language: Language.EN,
    title: "Zoneless Angular: what changes, what doesn't",
    excerpt:
      'Going zoneless either "changes everything" or "changes nothing" — both wrong. What actually changes after migrating an app off Zone.js, what stays identical, and the three things that surprised me.',
    content: zonelessContent,
    featured: true,
    publishedAt: new Date('2026-06-03T09:00:00Z'),
    metaTitle: null,
    metaDescription: null,
    categorySlug: 'engineering',
    tagSlugs: ['angular', 'performance'],
    featuredImagePublicId: 'seed-blog/featured-essay-cover',
  },
  {
    slug: 'seed-quy-trinh-review-code',
    language: Language.VI,
    title: 'Quy trình review code của team mình',
    excerpt:
      'Không quá nặng để làm chậm mọi người, nhưng đủ chặt để bug không lọt ra production. PR nhỏ, review nhanh, comment vào code chứ không vào người.',
    content: teamReviewViContent,
    featured: false,
    publishedAt: new Date('2026-03-28T09:00:00Z'),
    metaTitle: null,
    metaDescription: null,
    categorySlug: 'process',
    tagSlugs: ['workflow', 'refactor'],
    featuredImagePublicId: 'seed-blog/note-en-cover',
  },
];

// ---------------------------------------------------------------------------
// Seed entrypoint
// ---------------------------------------------------------------------------
export async function seedBlogPosts(prisma: PrismaClient, env: SeedEnv): Promise<void> {
  const email = env.ADMIN_EMAIL;
  if (!email) throw new Error('Missing ADMIN_EMAIL');

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log('Admin user not found — skipping blog post seed');
    return;
  }

  const userId = user.id;

  // ---- Categories ---------------------------------------------------------
  const categoryIdBySlug = new Map<string, string>();
  for (const c of CATEGORIES) {
    const existing = await prisma.category.findFirst({
      where: { slug: c.slug, deletedAt: null },
    });
    if (existing) {
      categoryIdBySlug.set(c.slug, existing.id);
      console.log(`Category "${c.name}" already exists — skipping`);
      continue;
    }
    const created = await prisma.category.create({
      data: {
        id: uuidv7(),
        slug: c.slug,
        name: c.name,
        description: c.description,
        displayOrder: c.displayOrder,
        createdById: userId,
        updatedById: userId,
      },
    });
    categoryIdBySlug.set(c.slug, created.id);
    console.log(`Category seeded: ${c.name}`);
  }

  // ---- Tags ---------------------------------------------------------------
  const tagIdBySlug = new Map<string, string>();
  for (const t of TAGS) {
    const existing = await prisma.tag.findFirst({
      where: { slug: t.slug, deletedAt: null },
    });
    if (existing) {
      tagIdBySlug.set(t.slug, existing.id);
      continue;
    }
    const created = await prisma.tag.create({
      data: {
        id: uuidv7(),
        slug: t.slug,
        name: t.name,
        createdById: userId,
        updatedById: userId,
      },
    });
    tagIdBySlug.set(t.slug, created.id);
    console.log(`Tag seeded: ${t.name}`);
  }

  // ---- Featured-image media ----------------------------------------------
  // Upsert syncs `url` / `altText` / `originalFilename` so re-running picks up
  // drift between the seed file and the DB. Keeps `id`, `createdById`, and
  // timestamps stable.
  const mediaIdByPublicId = new Map<string, string>();
  for (const m of MEDIA) {
    const created = await prisma.media.upsert({
      where: { publicId: m.publicId },
      update: {
        url: m.url,
        altText: m.altText,
        originalFilename: m.originalFilename,
        mimeType: m.mimeType,
        format: m.format,
        bytes: m.bytes,
        width: m.width,
        height: m.height,
        folder: m.folder,
        updatedById: userId,
      },
      create: {
        id: uuidv7(),
        publicId: m.publicId,
        originalFilename: m.originalFilename,
        mimeType: m.mimeType,
        url: m.url,
        format: m.format,
        bytes: m.bytes,
        width: m.width,
        height: m.height,
        altText: m.altText,
        folder: m.folder,
        createdById: userId,
        updatedById: userId,
      },
    });
    mediaIdByPublicId.set(m.publicId, created.id);
  }

  // ---- Posts --------------------------------------------------------------
  for (const p of POSTS) {
    if (!p.slug.startsWith('seed-')) {
      console.log(`SAFETY: refusing to seed post with slug "${p.slug}" (must start with seed-)`);
      continue;
    }

    const categoryId = categoryIdBySlug.get(p.categorySlug);
    if (!categoryId) {
      console.log(`Missing category "${p.categorySlug}" for post "${p.slug}" — skipping`);
      continue;
    }

    const tagIds = p.tagSlugs.map((s) => tagIdBySlug.get(s)).filter((id): id is string => !!id);
    const featuredImageId = mediaIdByPublicId.get(p.featuredImagePublicId);
    if (!featuredImageId) {
      console.log(`Missing cover media "${p.featuredImagePublicId}" for post "${p.slug}" — skipping (PST-011)`);
      continue;
    }

    const existing = await prisma.blogPost.findFirst({
      where: { slug: p.slug, deletedAt: null },
      select: { id: true, featured: true },
    });

    if (existing) {
      // Sync the `featured` flag so re-running the seed picks up drift between
      // the seed file and the DB (the rest of the row is left untouched).
      if (existing.featured !== p.featured) {
        await prisma.blogPost.update({
          where: { id: existing.id },
          data: { featured: p.featured, updatedById: userId },
        });
        console.log(`Blog post "${p.slug}" featured → ${p.featured}`);
      } else {
        console.log(`Blog post "${p.slug}" already exists — skipping`);
      }
      continue;
    }

    await prisma.blogPost.create({
      data: {
        id: uuidv7(),
        slug: p.slug,
        language: p.language,
        title: p.title,
        excerpt: p.excerpt,
        content: p.content,
        status: PostStatus.PUBLISHED,
        featured: p.featured,
        publishedAt: p.publishedAt,
        metaTitle: p.metaTitle,
        metaDescription: p.metaDescription,
        authorId: userId,
        featuredImageId,
        createdById: userId,
        updatedById: userId,
        categories: {
          create: [{ categoryId }],
        },
        tags: {
          create: tagIds.map((tagId) => ({ tagId })),
        },
      },
    });
    console.log(`Blog post seeded: ${p.slug}`);
  }
}
