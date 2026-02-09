import { Provider } from '@angular/core';
import { IconProvider } from './icon-provider.interface';
import { ICON_PROVIDER } from './icon-provider.token';

export function provideIcons(provider: IconProvider): Provider {
  return {
    provide: ICON_PROVIDER,
    useValue: provider,
  };
}
