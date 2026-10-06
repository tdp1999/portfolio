import { HelpService } from './help.service';
import { guidePath } from './help.util';

describe('HelpService', () => {
  it('keeps the newer page guide when the previous page unregisters after it', () => {
    const help = new HelpService();
    const leaveFeed = help.registerPageGuide({ guide: 'radar-feature-guide' });
    help.registerPageGuide({ guide: 'radar-feature-guide', section: 'runs' });

    leaveFeed();

    expect(help.pageGuide()).toEqual({ guide: 'radar-feature-guide', section: 'runs' });
  });

  it('has no page guide once every page unregistered', () => {
    const help = new HelpService();
    const leave = help.registerPageGuide({ guide: 'radar-feature-guide' });

    leave();

    expect(help.pageGuide()).toBeNull();
  });
});

describe('guidePath', () => {
  it('builds the asset path with the section as hash', () => {
    expect(guidePath({ guide: 'radar-feature-guide', section: 'score' })).toBe(
      '/guides/radar-feature-guide.html#score'
    );
  });

  it('refuses a slug or section that could leave the guides folder', () => {
    expect(guidePath({ guide: '../index' })).toBeNull();
    expect(guidePath({ guide: 'radar-feature-guide', section: 'x" onload="' })).toBeNull();
  });
});
