/**
 * Lightweight, zero-zod entry for `@portfolio/shared/utils`.
 *
 * Use from any code path where pulling Zod (~63 KB gzipped) is unacceptable —
 * primarily the landing app's initial bundle. API + Console keep importing from
 * the main `@portfolio/shared/utils` barrel which still re-exports everything.
 *
 * Only pure utility functions live here. Anything that constructs a Zod schema
 * at module load time MUST stay in the main barrel.
 */
export { getLocalized } from './lib/localize.util';
