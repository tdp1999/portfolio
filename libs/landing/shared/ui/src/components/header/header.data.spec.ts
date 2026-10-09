import { moreMenuItems } from './header.data';

describe('moreMenuItems', () => {
  const hrefs = (resumeUrl: string, signedIn: boolean) => moreMenuItems('en', resumeUrl, signedIn).map((i) => i.href);

  it('should offer "Sign in" in its own Account section, stacked with Documents, while signed out', () => {
    const signIn = moreMenuItems('en', '/cv.pdf', false).find((i) => i.href === '/sign-in');

    expect(signIn).toMatchObject({ section: 'Account', column: 'documents' });
  });

  it('should drop "Sign in" once the Owner is signed in', () => {
    expect(hrefs('/cv.pdf', true)).not.toContain('/sign-in');
  });

  it('should list the CV only when a resume URL exists', () => {
    expect(hrefs('/cv.pdf', false)).toContain('/cv.pdf');
    expect(moreMenuItems('en', '', false).some((i) => i.kind === 'download')).toBe(false);
  });
});
