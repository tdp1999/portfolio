import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Renders a `dynamicField` node in the read path.
 *
 * The renderer is engine-free by design: it knows structural nodes and marks,
 * and everything else has to be registered. A placeholder is exactly such a
 * node, so without this the rendered view showed "unknown block" — which is the
 * renderer behaving correctly and the page failing to finish the sentence.
 *
 * Registering it is also the clearest demonstration the band can give: the same
 * stored node is drawn by the editor and, independently, by a component this app
 * owns. Nothing is shared between those two paths except the document.
 */
@Component({
  selector: 'landing-document-engine-field-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="de-field-chip">{{ label() || fieldId() }}</span>`,
  styles: `
    :host {
      display: inline;
    }
  `,
})
export class DocumentEngineFieldChip {
  readonly fieldId = input('');
  readonly label = input('');
}
