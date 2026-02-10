import { Directive, HostBinding, input } from '@angular/core';

@Directive({
  selector: '[landingLink]',
  standalone: true,
})
export class LinkDirective {
  external = input<boolean>(false);

  @HostBinding('class.link') get baseClass() {
    return true;
  }

  @HostBinding('class.link--external') get externalClass() {
    return this.external();
  }
}
