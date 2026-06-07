// FE naming — class↔file mismatch fixups (follow-up to the big-bang rename).
// Resolves the 8 collisions the rename codemod deferred (it kept the original class
// when the bare grammar name clashed with an existing symbol):
//   - 2 REAL collisions: suffix the data-type (…Data), free the bare name for the component
//   - 6 FALSE collisions (BE-only / cross-app / unused): rename the class to the bare name
// ts-morph rename() updates every reference project-wide (imports, routes, index.ts, templates).
//
// Usage:  node tools/codemods/fe-naming-class-fixups.mjs            (DRY RUN)
//         node tools/codemods/fe-naming-class-fixups.mjs --apply
import { Project } from 'ts-morph';
import { join } from 'node:path';

const ROOT = process.cwd();
const APPLY = process.argv.includes('--apply');

// REAL collisions — rename the data-type first so the bare name frees up.
const TYPE_RENAMES = [
  { file: 'libs/landing/shared/data-access/src/lib/project.types.ts', from: 'ProjectDetail', to: 'ProjectDetailData' },
  { file: 'libs/landing/shared/ui/src/components/content-section/content-section.ts', from: 'ContentSection', to: 'ContentSectionData' },
];

// All component class renames (6 false-collision + 2 real now that the types moved aside).
const CLASS_RENAMES = [
  { file: 'apps/landing/src/app/pages/contact/contact.ts', from: 'ContactPage', to: 'Contact' },
  { file: 'libs/console/feature-blog/src/lib/blog-post.detail/blog-post.detail.ts', from: 'BlogPostDetailComponent', to: 'BlogPostDetail' },
  { file: 'libs/console/feature-media/src/lib/media/media.ts', from: 'MediaPageComponent', to: 'Media' },
  { file: 'libs/console/feature-profile/src/lib/profile/profile.ts', from: 'ProfilePageComponent', to: 'Profile' },
  { file: 'libs/console/shared/ui/src/lib/error-message/error-message.ts', from: 'ErrorMessageComponent', to: 'ErrorMessage' },
  { file: 'libs/landing/feature-projects/src/lib/project.detail/project.detail.ts', from: 'ProjectDetailComponent', to: 'ProjectDetail' },
  { file: 'libs/console/feature-project/src/lib/project.detail/project.detail.ts', from: 'ProjectDetailComponent', to: 'ProjectDetail' },
  { file: 'libs/landing/shared/ui/src/components/content-section/content-section.ts', from: 'LandingContentSectionComponent', to: 'ContentSection' },
];

const project = new Project({
  tsConfigFilePath: join(ROOT, 'tsconfig.base.json'),
  skipAddingFilesFromTsConfig: true,
});
project.addSourceFilesAtPaths([
  join(ROOT, 'libs/**/*.ts'),
  join(ROOT, 'apps/**/*.ts'),
  `!${join(ROOT, '**/node_modules/**')}`,
  `!${join(ROOT, '**/dist/**')}`,
]);
console.log('Source files loaded:', project.getSourceFiles().length);

for (const t of TYPE_RENAMES) {
  const sf = project.getSourceFile(join(ROOT, t.file));
  if (!sf) { console.warn('MISSING file:', t.file); continue; }
  const decl = sf.getTypeAlias(t.from) || sf.getInterface(t.from);
  if (!decl) { console.warn('MISSING type:', t.from, 'in', t.file); continue; }
  decl.rename(t.to);
  console.log('type ', t.from, '->', t.to);
}

for (const c of CLASS_RENAMES) {
  const sf = project.getSourceFile(join(ROOT, c.file));
  if (!sf) { console.warn('MISSING file:', c.file); continue; }
  const cls = sf.getClass(c.from);
  if (!cls) { console.warn('MISSING class:', c.from, 'in', c.file); continue; }
  cls.rename(c.to);
  console.log('class', c.from, '->', c.to);
}

if (APPLY) { project.saveSync(); console.log('\nSAVED.'); }
else console.log('\nDRY RUN — pass --apply to write.');
