import { TestBed } from '@angular/core/testing';
import { HelpService } from '../../services/help/help.service';
import { HelpViewer } from './help-viewer';

describe('HelpViewer ? key', () => {
  let viewer: HelpViewer;
  let help: HelpService;

  function press(key: string, target: EventTarget = document.createElement('div')): KeyboardEvent {
    const event = new KeyboardEvent('keydown', { key, cancelable: true });
    Object.defineProperty(event, 'target', { value: target });
    viewer.onKeydown(event);
    return event;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HelpViewer] });
    viewer = TestBed.createComponent(HelpViewer).componentInstance;
    help = TestBed.inject(HelpService);
  });

  it('opens the page guide at its section', () => {
    help.registerPageGuide({ guide: 'radar-feature-guide', section: 'runs' });

    const event = press('?');

    expect(help.opened()).toEqual({ guide: 'radar-feature-guide', section: 'runs' });
    expect(event.defaultPrevented).toBe(true);
  });

  it('does nothing on a page without a guide', () => {
    const event = press('?');

    expect(help.opened()).toBeNull();
    expect(event.defaultPrevented).toBe(false);
  });

  it('yields while typing', () => {
    help.registerPageGuide({ guide: 'radar-feature-guide' });

    press('?', document.createElement('input'));

    expect(help.opened()).toBeNull();
  });
});
