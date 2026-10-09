import { moreMenuItems, SIGN_IN_HREF, workspacePages } from './header.data';

describe('moreMenuItems', () => {
  it('should not offer "Sign in": it is a header item of its own', () => {
    expect(moreMenuItems('en', '/cv.pdf').map((i) => i.href)).not.toContain(SIGN_IN_HREF);
  });

  it('should list the CV only when a resume URL exists', () => {
    expect(moreMenuItems('en', '/cv.pdf').map((i) => i.href)).toContain('/cv.pdf');
    expect(moreMenuItems('en', '').some((i) => i.kind === 'download')).toBe(false);
  });
});

describe('workspacePages', () => {
  it('should list the private pages as internal links', () => {
    expect(workspacePages('en').every((page) => page.href.startsWith('/'))).toBe(true);
  });
});
