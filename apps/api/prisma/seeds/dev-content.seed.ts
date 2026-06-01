/**
 * DEV-ONLY content seed — populates the two landing home sections that the
 * production seed leaves empty so the page can be reviewed/developed with real
 * content:
 *   • Profile.bioLong  (The Story §6 — production seed sets bioShort only)
 *   • 3 featured Projects (Selected Work §4 — no project seed exists otherwise)
 *
 * NOT wired into seed.ts main() — run manually against a dev database:
 *   pnpm tsx --tsconfig apps/api/tsconfig.json apps/api/prisma/seeds/dev-content.seed.ts
 *
 * Idempotent: bioLong is set via update; projects are upserted by slug.
 */
import { config } from 'dotenv';
import { resolve } from 'node:path';
config({ path: resolve(__dirname, '../../../../.env') });

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { v7 as uuidv7 } from 'uuid';

const BIO_LONG_EN = [
  'I started where a lot of us do — gluing screens to endpoints and calling it a feature. *What changed me was a permissions bug that took down a loan desk for half a day.* The fix was three lines; finding it took six hours because nothing in the system could tell me what a role was actually allowed to do.',
  'Since then I build the boring scaffolding first. A design system before the first screen, a test before the bug report, a workflow before the task piles up. It is less glamorous than a demo, but it is the part that is still standing a year later.',
  'These days I work from Ho Chi Minh City with a Singapore product team — document engines, loan systems, the permission frameworks underneath them. *I like the seams of a product: the editor that has to round-trip cleanly, the export nobody notices until it breaks.* That is the work I reach for.',
].join('\n\n');

const NOW = new Date('2026-01-15T00:00:00.000Z');

interface DevProject {
  slug: string;
  title: string;
  oneLiner: string;
  description: string;
  motivation: string;
  role: string;
  lifecycleStatus: 'LIVE' | 'SHIPPED' | 'ARCHIVED' | 'BETA' | 'ONGOING';
  startDate: string;
  endDate?: string;
  displayOrder: number;
}

const PROJECTS: readonly DevProject[] = [
  {
    slug: 'permissions-console',
    title: 'Permissions Console',
    oneLiner: 'A role/permission admin console for a multi-tenant fintech back office.',
    description:
      'A console for defining roles, scoping permissions per tenant, and previewing exactly what a given role can see and do before it ships. Built to kill the class of "why can this user do that" incidents.',
    motivation:
      'A three-line permissions bug once took a loan desk offline for half a day. The system could not explain itself — so I built the thing that can.',
    role: 'Sole frontend engineer; co-designed the permission model with the backend lead.',
    lifecycleStatus: 'LIVE',
    startDate: '2024-03-01',
    displayOrder: 1,
  },
  {
    slug: 'loan-document-engine',
    title: 'Loan Document Engine',
    oneLiner: 'A templating + generation engine for regulated loan documents.',
    description:
      'Turns structured loan data into compliant, branded PDFs through a versioned template system with deterministic output and a full audit trail. Handles bilingual (EN/VI) documents and per-jurisdiction clauses.',
    motivation:
      'Loan ops were assembling documents by hand and the mistakes were expensive. The engine made the safe path the fast path.',
    role: 'Led the frontend template authoring UX and the deterministic render pipeline.',
    lifecycleStatus: 'SHIPPED',
    startDate: '2023-05-01',
    endDate: '2024-02-01',
    displayOrder: 2,
  },
  {
    slug: 'block-editor',
    title: 'Block Editor',
    oneLiner: 'A custom TipTap-based block editor I had to ship myself.',
    description:
      'A WYSIWYG block editor with custom nodes (callouts, embeds, code, bilingual fields) and clean HTML/JSON round-tripping. Powers the document and content authoring across the platform.',
    motivation:
      'Off-the-shelf editors broke on round-trip and fought the design system. Owning the editor was cheaper than fighting one.',
    role: 'Designed and built the editor end to end, including the custom TipTap extensions.',
    lifecycleStatus: 'ONGOING',
    startDate: '2024-06-01',
    displayOrder: 3,
  },
];

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL'] });
  const prisma = new PrismaClient({ adapter });
  const email = process.env['ADMIN_EMAIL'];
  if (!email) throw new Error('Missing ADMIN_EMAIL');

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log('Admin user not found — run `pnpm seed` first.');
      return;
    }

    // 1. bioLong on the existing profile (production seed only sets bioShort).
    const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
    if (!profile) {
      console.log('Profile not found — run `pnpm seed` first.');
      return;
    }
    await prisma.profile.update({
      where: { id: profile.id },
      data: { bioLong: { en: BIO_LONG_EN, vi: '' }, updatedById: user.id },
    });
    console.log('Profile.bioLong updated (The Story §6).');

    // 2. Three featured, published projects (Selected Work §4).
    for (const p of PROJECTS) {
      const localized = (en: string) => ({ en, vi: '' });
      const data = {
        title: p.title,
        oneLiner: localized(p.oneLiner),
        description: localized(p.description),
        motivation: localized(p.motivation),
        role: localized(p.role),
        startDate: new Date(p.startDate),
        endDate: p.endDate ? new Date(p.endDate) : null,
        status: 'PUBLISHED' as const,
        lifecycleStatus: p.lifecycleStatus,
        featured: true,
        displayOrder: p.displayOrder,
        links: [],
        updatedById: user.id,
      };
      const existing = await prisma.project.findFirst({ where: { slug: p.slug } });
      if (existing) {
        await prisma.project.update({ where: { id: existing.id }, data });
        console.log(`Project updated: ${p.title}`);
      } else {
        await prisma.project.create({
          data: { id: uuidv7(), slug: p.slug, createdAt: NOW, createdById: user.id, ...data },
        });
        console.log(`Project created: ${p.title}`);
      }
    }
    console.log('\nDev content seed complete.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
