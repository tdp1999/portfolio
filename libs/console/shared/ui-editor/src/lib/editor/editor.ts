import { ChangeDetectionStrategy, Component, forwardRef, input, output, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { MarkdownEditorApi, MarkdownEditorChange } from './markdown-editor.types';

/**
 * Markdown editor — placeholder textarea implementation.
 *
 * This component is the stable façade for the blog editor. Today it renders a
 * `<textarea>`; once the `document-engine` (ProseMirror) package is ready it
 * will be swapped in here without changing the selector, inputs, outputs, or
 * imperative API. Consumers must therefore only depend on:
 *   - selector: `console-markdown-editor`
 *   - input:    `initialContent`
 *   - output:   `contentChange`
 *   - methods:  `setContent(md)`, `getContent()`
 *   - or use it as a `formControl` via `ControlValueAccessor`
 *
 * See `markdown-editor.types.ts` for the contract.
 */
@Component({
  selector: 'console-markdown-editor',
  standalone: true,
  template: `
    <textarea
      class="markdown-editor"
      [attr.aria-label]="ariaLabel()"
      [placeholder]="placeholder()"
      [disabled]="disabled()"
      [value]="content()"
      (input)="onInput($event)"
      (blur)="onTouched()"
    ></textarea>
  `,
  styleUrl: './editor.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Editor),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Editor implements ControlValueAccessor, MarkdownEditorApi {
  readonly initialContent = input<string>('');
  readonly placeholder = input<string>('Write your post in markdown…');
  readonly ariaLabel = input<string>('Markdown editor');

  readonly contentChange = output<MarkdownEditorChange>();

  protected readonly content = signal<string>('');
  protected readonly disabled = signal<boolean>(false);

  private initialized = false;

  private onChange: (value: string) => void = () => {
    // No-op
  };
  protected onTouched: () => void = () => {
    // No-op
  };

  constructor() {
    // Apply initialContent once on first read; subsequent updates should go
    // through setContent() / formControl writes so the editor stays the source
    // of truth.
    queueMicrotask(() => {
      if (!this.initialized) {
        const seed = this.initialContent();
        if (seed) {
          this.content.set(seed);
        }
        this.initialized = true;
      }
    });
  }

  setContent(markdown: string): void {
    this.content.set(markdown ?? '');
  }

  getContent(): string {
    return this.content();
  }

  // ControlValueAccessor ----------------------------------------------------

  writeValue(value: string | null): void {
    this.content.set(value ?? '');
    this.initialized = true;
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected onInput(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.content.set(value);
    this.onChange(value);
    this.contentChange.emit({ markdown: value });
  }
}
