/**
 * Throwaway dev seed — one long (~2000-word) blog post exercising EVERY canonical
 * block + mark the prose-block renderer supports, plus 3 `imageRef` figures (real
 * media) so the in-prose lightbox can be tested end-to-end on the AST read-path.
 *
 * Runs the REAL write pipeline (RichTextService → E→canonical adapter), so the
 * stored `contentCanonical` is produced exactly as a console save would produce it.
 * Idempotent: deletes any prior post at the fixed slug, then recreates.
 *
 *   npx tsx --tsconfig apps/api/tsconfig.json apps/api/scripts/seed-prose-demo.ts
 *
 * Delete it again with: DELETE FROM blog_posts WHERE slug = 'ast-renderer-showcase';
 */
import { config } from 'dotenv';
import { resolve } from 'node:path';
config({ path: resolve(__dirname, '../../../.env') });

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '@prisma/client';
import type { EditorDocument } from '@portfolio/shared/features/rte-core';
import { RichTextService } from '../src/modules/rich-text';
import { wrapContentByLanguage } from '../src/modules/blog-post/application/blog-content-rich.util';

const SLUG = 'ast-renderer-showcase';
const LOG = '[seed:prose-demo]';

// ── E (Tiptap) node builders ──────────────────────────────────────────────
type N = Record<string, unknown>;
const text = (t: string, marks?: N[]): N => (marks ? { type: 'text', text: t, marks } : { type: 'text', text: t });
const bold = (t: string): N => text(t, [{ type: 'bold' }]);
const italic = (t: string): N => text(t, [{ type: 'italic' }]);
const underline = (t: string): N => text(t, [{ type: 'underline' }]);
const strike = (t: string): N => text(t, [{ type: 'strike' }]);
const code = (t: string): N => text(t, [{ type: 'code' }]);
const link = (t: string, href: string): N => text(t, [{ type: 'link', attrs: { href } }]);
const p = (...content: N[]): N => ({ type: 'paragraph', content });
const h = (level: 2 | 3 | 4, t: string): N => ({ type: 'heading', attrs: { level }, content: [text(t)] });
const li = (...content: N[]): N => ({ type: 'listItem', content });
const bullet = (...items: N[]): N => ({ type: 'bulletList', content: items });
const ordered = (...items: N[]): N => ({ type: 'customOrderedList', content: items });
const quote = (...content: N[]): N => ({ type: 'blockquote', content });
const codeBlock = (t: string): N => ({ type: 'codeBlock', content: [text(t)] });
const br: N = { type: 'hardBreak' };
const imageRef = (imageId: string, caption: string, captionPosition: 'top' | 'bottom'): N => ({
  type: 'imageRef',
  attrs: { imageId, caption, captionPosition },
});

function buildDoc(imageIds: string[]): EditorDocument {
  const [img1, img2, img3] = imageIds;
  const content: N[] = [
    p(
      text('Rendering rich prose on the web usually starts with the path of least resistance: store a blob of '),
      code('HTML'),
      text(', bind it with '),
      code('[innerHTML]'),
      text(
        ', and move on. It works until the day your content stops being a document and starts being a program — the moment an author wants a gallery that responds to clicks, a figure that opens a lightbox, or a callout that knows its own state. This article walks through why we abandoned the HTML-string read-path in favour of a structured node tree, and what we gained by treating '
      ),
      bold('content as an abstract syntax tree'),
      text(' rather than a serialized string.')
    ),

    h(2, 'The problem with rendering strings'),
    p(
      text('An HTML string is a '),
      italic('dead artifact'),
      text(
        '. Once the server hands it to the browser, all the structure the author expressed — headings, lists, embedded media — has collapsed into a flat sequence of tags. To make any part of it interactive again you must re-parse it, walk the DOM by hand, find the nodes you care about, and imperatively mount behaviour onto them. That islands-of-hydration dance is tolerable for '
      ),
      underline('one'),
      text(' widget. It becomes a maintenance sink the instant you have five.')
    ),
    p(
      text('There is also a quieter cost: '),
      bold('security'),
      text(
        '. A string is opaque. To keep it safe you sanitise it against an allow-list of tags and attributes, and you pray your allow-list and your renderer agree. Every new capability widens the surface. The AST model inverts this — you never trust a string, you trust a '
      ),
      italic('tree of known node types'),
      text(', each validated against a schema before it is ever rendered.')
    ),
    quote(
      p(
        text(
          'Content is a structured node tree, not HTML. HTML is one serialization of that tree — the one you reach for when a crawler or an RSS reader needs a flat snapshot, not the one you render into a live application.'
        )
      )
    ),

    imageRef(
      img1,
      'FIG. 01 — The read-path splits in two: a canonical AST for the live app, a cached HTML string for non-Angular consumers.',
      'bottom'
    ),

    h(2, 'A portable document contract'),
    p(
      text('The heart of the design is a small, engine-agnostic contract we call '),
      code('PortableDocument'),
      text('. It mirrors the shape of ProseMirror — a recursive '),
      code('content'),
      text(' array of nodes, each with an optional '),
      code('attrs'),
      text(' bag and, for text nodes, a list of '),
      code('marks'),
      text(
        ' — but the node names and attribute keys are entirely ours. Crucially, it is decoupled from whatever editor happens to produce it. The editor could be Tiptap today and something else tomorrow; the renderer never notices.'
      )
    ),
    p(
      text('That decoupling lives in exactly one place: a write-time '),
      bold('anti-corruption adapter'),
      text(
        '. When an author saves, the backend normalises the editor’s native JSON into our canonical shape and stores that. If the editor renames a node or reshuffles an attribute, only the adapter changes — the renderer, the block registry, and every block component stay untouched. This is the single most valuable property of the whole system.'
      )
    ),
    h(3, 'What the adapter guarantees'),
    p(
      text(
        'The adapter is also the primary security gate. As it walks the incoming tree it does three things, in order:'
      )
    ),
    ordered(
      li(
        p(
          text('It maps each editor node name to a canonical name, '),
          strike('dropping'),
          text(' any node it does not recognise.')
        )
      ),
      li(
        p(
          text('It validates every node’s attributes against a '),
          code('Zod'),
          text(' schema, dropping the node if validation fails.')
        )
      ),
      li(
        p(
          text('It scheme-checks every link, rejecting '),
          code('javascript:'),
          text(' and '),
          code('data:'),
          text(' URLs outright.')
        )
      )
    ),
    p(
      text('Because the adapter is '),
      italic('total'),
      text(
        ' — it never throws, it only drops — a malformed or hostile document can never produce a canonical node the renderer would trust. The XSS surface of "arbitrary HTML string" simply disappears.'
      )
    ),

    h(2, 'A registry of blocks'),
    p(
      text(
        'Once content is a validated tree, rendering becomes a walk. Structural nodes — paragraphs, headings, lists, blockquotes — map to plain elements recursively. But the interesting nodes are '
      ),
      bold('blocks'),
      text(
        ': self-contained units with their own component and their own logic. These are registered through a dependency-injection token, so adding a new block type is exactly one provider entry — the same "plugin" experience a CMS author expects.'
      )
    ),
    p(
      text('Here is what registering the image block looks like. Note that it is '),
      underline('declarative'),
      text(
        ' — the renderer injects the component through a component-outlet, so server-side rendering and incremental hydration are handled natively, with no manual component creation after the fact:'
      )
    ),
    codeBlock(
      `provideBlockRenderers(\n  {\n    type: 'image-ref',\n    component: ImageRefBlock,\n    inputs: (node, ctx) => {\n      const media = ctx.media(node.attrs.imageId);\n      return { src: media?.src, alt: media?.alt, caption: media?.caption };\n    },\n  },\n  galleryBlockRenderer, // one more entry — that is the whole story\n);`
    ),
    p(
      text('The block components themselves are '),
      italic('thin wrappers'),
      text(
        ' over primitives we already ship. The image block wraps the same figure component the rest of the site uses — which means in-content figures inherit the full-screen lightbox for free. That was impossible on the old string path, because you cannot carry a framework directive inside an HTML blob. Try it below: click the figure and it should open, respond to arrow keys, and close on escape.'
      )
    ),

    imageRef(
      img2,
      'FIG. 02 — Click to open the lightbox. Arrow keys page through the group; escape closes it.',
      'bottom'
    ),

    h(3, 'Resolving media without a fetch'),
    p(
      text('A subtle constraint of server-side rendering is that block inputs must resolve '),
      bold('synchronously'),
      text(
        '. You cannot start an async request mid-render. So the page pre-resolves every referenced media id into a small map, and the render context exposes it as a synchronous lookup. By the time the renderer walks an image node, the answer is already in memory — no waterfall, no layout shift, no hydration mismatch.'
      )
    ),
    bullet(
      li(p(bold('Batched: '), text('all image ids collected in one pass, resolved in one query.'))),
      li(p(bold('Synchronous: '), text('the render context returns from a plain map, safe under SSR.'))),
      li(
        p(
          bold('Fallback-safe: '),
          text('a deleted image degrades to a caption-only placeholder rather than a broken tag.')
        )
      )
    ),

    h(2, 'Headings, anchors, and the table of contents'),
    p(
      text(
        'A structured tree makes navigation trivial. Because the renderer owns the walk, it also owns heading identity: it slugs each heading, dedupes collisions, stamps the id onto the element, and exposes the ordered list of headings back to the page. The sticky table of contents and the scroll-spy both read from that single source, so an anchor in the sidebar can never drift from the id on the heading it targets.'
      )
    ),
    p(
      text(
        'Contrast this with the old approach, where the table of contents was reverse-engineered from the HTML string by a read-time '
      ),
      code('slugify'),
      text(' pass. Two independent sluggers meant two chances to disagree; one owner means zero. '),
      italic('Small design choices like this compound.')
    ),
    h(4, 'A note on fallback'),
    p(
      text('None of this deletes the HTML cache. It is '),
      bold('demoted'),
      text(
        ', not retired. Server-side rendering already emits the full tree as real HTML, so crawlers and AI readers are served without running any JavaScript — the cache is no longer the SEO source. But it stays useful for the consumers that genuinely want a flat string: RSS feeds, an '
      ),
      code('llms.txt'),
      text(
        ' digest, Open Graph snippets, and the no-JavaScript safety net. Content that has not yet been re-saved simply renders through that fallback, unchanged.'
      )
    ),

    h(2, 'Performance and the cost of trust'),
    p(
      text(
        'Validation is not free, and it would be dishonest to pretend otherwise. Every node passes through a schema check on the way in, and every block resolves its inputs on the way out. But the cost is paid at the '
      ),
      bold('write boundary'),
      text(
        ', once per save, on a server with time to spare — not in the hot path of a reader’s browser. By the time content reaches a visitor it is already canonical, already safe, and already resolved. The reader pays only for the walk, and the walk is linear in the size of the document.'
      )
    ),
    p(
      text('There is a second, less obvious win. Because the tree is '),
      italic('typed'),
      text(
        ', the compiler catches whole categories of mistakes that a string renderer would happily pass through to production. A block whose inputs do not match its component is a build error, not a silent blank space on a live page. The renderer and the content share a contract, and the contract is enforced by the same tooling that enforces everything else in the codebase.'
      )
    ),
    quote(
      p(
        text(
          'The best time to reject bad content is before it is stored. The second best time is before it is rendered. A string-based pipeline gives you neither guarantee cleanly; a validated tree gives you both.'
        )
      )
    ),
    p(
      text(
        'When we profiled the two paths side by side, the numbers were unremarkable in the best way. Server-side render time for a long article moved within noise. Hydration was '
      ),
      underline('cheaper'),
      text(
        ', not more expensive, because the framework hydrated a component tree it understood instead of adopting a foreign blob of markup and mounting behaviour onto it after the fact. The old path’s "parse, scan, mount" sequence had simply vanished.'
      )
    ),

    h(3, 'Failure modes we designed for'),
    p(
      text(
        'A renderer that only works on perfect input is a liability. We enumerated the ways a document could go wrong and gave each a graceful answer:'
      )
    ),
    bullet(
      li(
        p(
          bold('Unknown block: '),
          text(
            'rendered as an inert placeholder in development, skipped in production — never a thrown error that blanks the page.'
          )
        )
      ),
      li(
        p(
          bold('Missing media: '),
          text('the figure degrades to its caption; the layout holds because the aspect ratio is reserved up front.')
        )
      ),
      li(
        p(
          bold('Malformed attributes: '),
          text('the offending node is dropped at write time, so the reader never sees it at all.')
        )
      ),
      li(
        p(
          bold('Stale schema: '),
          text(
            'content lazily migrates on the next save, and a manual escape hatch drains the tail when a breaking change lands.'
          )
        )
      )
    ),
    p(
      text('Each of these is a '),
      code('one-node'),
      text(
        ' failure, contained to the node that caused it. The surrounding document renders regardless. That containment is the practical payoff of walking a tree instead of concatenating a string: a single bad element can no longer take the whole article down with it.'
      )
    ),

    h(2, 'Testing a renderer you can trust'),
    p(
      text(
        'A rendering pipeline is only as good as the proof that it renders. Because the output is a component tree, we can assert against it the same way we assert against any other component — no string matching, no brittle DOM scraping. A server-side render test boots the real application, feeds it a document containing every node type, and checks that the resulting HTML contains the structural tags, the inline marks, and the resolved images, while '
      ),
      italic('proving the editor never loaded'),
      text('. If a crawler would see it, the test sees it too.')
    ),
    p(
      text('This very page is part of that story. It is a '),
      bold('fixture'),
      text(
        ' as much as it is an article: it deliberately exercises every block and every mark the pipeline supports, so that a human reviewer and an automated check can both confirm, at a glance, that nothing regressed. The three figures above are the acceptance test for the in-prose lightbox; the code block, the lists, the quotes, and the mixed inline marks are the acceptance test for everything else.'
      )
    ),

    imageRef(img3, 'FIG. 03 — The third figure shares the lightbox group, so paging wraps across all three.', 'top'),

    h(2, 'What we actually shipped'),
    p(
      text(
        'The migration was deliberately gradual. Each page checks for canonical content first; if it is present, it renders the live AST, and if it is absent, it falls back to the cached string. No big-bang data migration was required to ship — the two paths coexist, per row, until a backfill drains the old content out. That is the difference between a rewrite that ships on a Friday and one that never ships at all.'
      )
    ),
    p(
      text('If you are building something similar, the lesson worth stealing is this: '),
      bold('put the coupling in one place and make everything downstream key on a contract you own'),
      text('. '),
      link('The Portable Text specification', 'https://portabletext.org'),
      text(' and '),
      link('the Gutenberg block model', 'https://developer.wordpress.org/block-editor/'),
      text(
        ' both arrived at the same shape from different directions, which is usually a sign the shape is right. A tree you validate is a tree you can trust — and a tree you can trust is one you can finally make interactive.'
      )
    ),
    p(
      italic('Thanks for reading. '),
      text(
        'This post is a rendering fixture: every block type and inline mark above is real, produced by the same pipeline a genuine article would use.'
      ),
      br,
      text('If a figure did not open, the lightbox wiring regressed — which is exactly what this page exists to catch.')
    ),
  ];

  return { schemaVersion: 1, content: { type: 'doc', content } } as unknown as EditorDocument;
}

function plainTextOf(doc: EditorDocument): string {
  const walk = (n: N): string => ((n['text'] as string) ?? '') + ((n['content'] as N[]) ?? []).map(walk).join(' ');
  const root = (doc as unknown as { content: N }).content;
  return walk(root).replace(/\s+/g, ' ').trim();
}

async function main(): Promise<void> {
  const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL'] });
  const prisma = new PrismaClient({ adapter });
  const richText = new RichTextService();

  try {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' }, select: { id: true } });
    if (!admin) throw new Error('No ADMIN user found to author the post.');

    const images = await prisma.media.findMany({
      where: { mimeType: { startsWith: 'image/' }, deletedAt: null },
      select: { id: true, url: true },
      take: 4,
    });
    if (images.length < 3) throw new Error(`Need at least 3 image media; found ${images.length}.`);

    const category = await prisma.category.findFirst({ where: { deletedAt: null }, select: { id: true } });

    const imageIds = images.slice(1, 4).map((m) => m.id); // skip [0] → use it as featured
    const featuredImageId = images[0].id;

    const doc = buildDoc(imageIds);
    const canonical = await richText.toCanonicalFormTranslatable(wrapContentByLanguage(doc, 'EN'), 'blog-post.content');
    const plain = plainTextOf(doc);
    const readTimeMinutes = Math.max(1, Math.round(plain.split(' ').length / 200));

    console.log(`${LOG} built doc: ${plain.split(' ').length} words, ${imageIds.length} imageRefs`);

    // Idempotent: drop any prior copy (PostCategory cascades on post delete).
    await prisma.blogPost.deleteMany({ where: { slug: SLUG } });

    const created = await prisma.blogPost.create({
      data: {
        slug: SLUG,
        language: 'EN',
        title: 'Rendering Prose as a Tree, Not a String',
        excerpt:
          'Why we replaced the HTML-string read-path with a validated AST + a DI block registry — and how in-content figures finally got a lightbox.',
        contentJson: canonical.json as unknown as Prisma.InputJsonValue,
        contentHtml: canonical.html as unknown as Prisma.InputJsonValue,
        contentCanonical: canonical.canonical as unknown as Prisma.InputJsonValue,
        contentSchemaVersion: canonical.schemaVersion,
        readTimeMinutes,
        status: 'PUBLISHED',
        featured: false,
        publishedAt: new Date(),
        metaTitle: 'Rendering Prose as a Tree, Not a String',
        metaDescription:
          'A walkthrough of the AST-based prose-block renderer: portable contract, write-time adapter, DI block registry, and in-prose lightbox.',
        authorId: admin.id,
        featuredImageId,
        createdById: admin.id,
        updatedById: admin.id,
        ...(category ? { categories: { create: [{ categoryId: category.id }] } } : {}),
      },
      select: { id: true, slug: true },
    });

    // Verify canonical actually landed with content.
    const en = (canonical.canonical as unknown as { en: { content: unknown[] } }).en;
    console.log(`${LOG} created post id=${created.id} slug=${created.slug}`);
    console.log(`${LOG} contentCanonical.en.content nodes: ${en.content.length}`);
    console.log(`${LOG} featuredImageId=${featuredImageId} imageRefIds=${imageIds.join(',')}`);
    console.log(`${LOG} → http://localhost:4200/blog/${created.slug}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(`${LOG}`, e);
  process.exit(1);
});
