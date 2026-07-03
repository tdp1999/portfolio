// Test stub for isomorphic-dompurify.
//
// rte-core's barrel eagerly evaluates rte.sanitize (which imports isomorphic-dompurify
// → jsdom, an ESM-in-node_modules tree the api's node jest transformer won't process).
// Mapping only this ESM leaf (via moduleNameMapper) lets ALL of rte-core's real code
// still run in api specs — sanitizeRichText becomes an identity passthrough, matching
// how rich-text.service.spec stubs it. DOMPurify's real behaviour is owned and fully
// tested in rte-core's own jsdom-env spec (rte.sanitize.spec.ts).

const DOMPurify = {
  addHook: (): void => {
    /* no-op */
  },
  removeHook: (): void => {
    /* no-op */
  },
  setConfig: (): void => {
    /* no-op */
  },
  sanitize: (html: string): string => html,
};

export default DOMPurify;
