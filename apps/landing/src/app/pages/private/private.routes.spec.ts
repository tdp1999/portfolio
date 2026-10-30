import { NOINDEX_PATHS, PRIVATE_PATHS } from './private.routes';

// R8.6 of the medicine cabinet epic: S6 is a private page, so the server renders it client-only and
// sends `X-Robots-Tag: noindex, nofollow` (both driven by NOINDEX_PATHS).
describe('private routes', () => {
  it('R8.6: medicine-cabinet is a private, noindex path', () => {
    expect(PRIVATE_PATHS).toContain('medicine-cabinet');
    expect(NOINDEX_PATHS).toContain('medicine-cabinet');
  });
});
