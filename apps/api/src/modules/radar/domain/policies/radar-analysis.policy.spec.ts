import { RadarAnalysisPolicy } from './radar-analysis.policy';

describe('RadarAnalysisPolicy', () => {
  it.each([
    ['https://www.facebook.com/x/posts/1', true],
    ['https://m.facebook.com/story.php', true],
    ['https://fb.watch/abc', true],
    ['https://scontent.xx.fbcdn.net/v/t39/1.jpg', true],
    ['not a url', true],
    ['https://docs.anthropic.com/claude-code', false],
    ['https://notfacebook.com/x', false],
  ])('should treat %s as blocked=%s (RAD-003)', (url, blocked) => {
    expect(RadarAnalysisPolicy.isBlockedUrl(url)).toBe(blocked);
  });

  it('should replace Facebook links in text and keep the others', () => {
    const text = 'Link dưới còm https://fb.watch/x9 và docs https://docs.anthropic.com/a.';

    expect(RadarAnalysisPolicy.stripBlockedUrls(text)).toBe(
      `Link dưới còm ${RadarAnalysisPolicy.REMOVED_LINK} và docs https://docs.anthropic.com/a.`
    );
  });

  it.each([
    ['major', 0, 'minor'],
    ['major', 1, 'major'],
    ['minor', 0, 'minor'],
    [null, 0, null],
  ] as const)('should turn severity %s with %i sources into %s', (severity, sources, expected) => {
    expect(RadarAnalysisPolicy.severity(severity, sources)).toBe(expected);
  });
});
