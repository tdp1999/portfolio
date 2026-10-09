import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  type OnInit,
  output,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { Button, Textarea } from '@portfolio/landing/shared/ui';

/**
 * The in-place editor for a row's text or note: a textarea that opens focused, Save and Cancel.
 * Enter saves a one-line field (row text); a note is multi-line, so there Mod+Enter saves. Escape
 * cancels either. An empty row text is refused (delete the row instead); an empty note clears it.
 */
@Component({
  selector: 'landing-checklist-row-editor',
  imports: [ReactiveFormsModule, Button, Textarea],
  templateUrl: './checklist.row-editor.html',
  styleUrl: './checklist.row-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChecklistRowEditor implements OnInit {
  /** The current value; read once, when the editor opens. */
  readonly value = input('');
  /** A note: multi-line, and may be saved empty. */
  readonly multiline = input(false);
  readonly label = input.required<string>();
  readonly maxLength = input(2000);

  readonly saved = output<string>();
  readonly cancelled = output<void>();

  protected readonly text = new FormControl('', { nonNullable: true });
  protected readonly form = new FormGroup({ text: this.text });

  constructor() {
    const host: HTMLElement = inject(ElementRef).nativeElement;
    afterNextRender(() => {
      const field = host.querySelector('textarea');
      field?.focus();
      field?.setSelectionRange(field.value.length, field.value.length);
    });
  }

  /** The value goes in before the first render, so a keystroke right after opening is never overwritten. */
  ngOnInit(): void {
    this.text.setValue(this.value());
  }

  protected save(): void {
    const value = this.multiline() ? this.text.value.trimEnd() : this.text.value.replace(/\s+/g, ' ').trim();
    if (!value && !this.multiline()) return;
    this.saved.emit(value);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      // The editor is the topmost layer: its Escape must not also close a ref panel or a stage.
      event.stopPropagation();
      this.cancelled.emit();
      return;
    }
    if (event.key !== 'Enter' || event.isComposing) return;
    const commit = this.multiline() ? event.metaKey || event.ctrlKey : !event.shiftKey;
    if (!commit) return;
    event.preventDefault();
    this.save();
  }
}
