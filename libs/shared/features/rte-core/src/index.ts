export * from './lib/rte.types';
export * from './lib/rte.constants';
export * from './lib/rte.sanitize';
export * from './lib/rte.image-refs';
// Prose-block canonical contract (types + Zod schemas). Also available dompurify-free
// via the `@portfolio/shared/features/rte-core/portable` secondary entry — the BE
// adapter and the node-env renderer tests import from there to avoid pulling
// isomorphic-dompurify (which the barrel's rte.sanitize brings in).
export * from './lib/rte.portable';
