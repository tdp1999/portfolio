import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { type BilingualEditorDocument, richTextRequiredValidator } from '@portfolio/console/shared/util';
import type { EditorDocument } from '@portfolio/shared/features/rte-core';

import type { TranslatableJson } from '../project.types';
import { EMPTY_TRANSLATABLE } from './project.form.data';

export function requiredTranslatableGroup(fb: FormBuilder, value: TranslatableJson = EMPTY_TRANSLATABLE): FormGroup {
  return fb.group({
    en: fb.control(value['en'] ?? '', { nonNullable: true, validators: [Validators.required] }),
    vi: fb.control(value['vi'] ?? '', { nonNullable: true, validators: [Validators.required] }),
  });
}

/**
 * Bilingual plain-text group with no required validator (optional field, e.g. highlight title).
 * `maxLength` mirrors the API's zod bound so an over-long value fails inline instead of
 * coming back as a generic save error.
 */
export function translatableGroup(
  fb: FormBuilder,
  value: TranslatableJson | null = EMPTY_TRANSLATABLE,
  maxLength = 120
): FormGroup {
  const validators = [Validators.maxLength(maxLength)];
  return fb.group({
    en: fb.control(value?.['en'] ?? '', { nonNullable: true, validators }),
    vi: fb.control(value?.['vi'] ?? '', { nonNullable: true, validators }),
  });
}

/** Bilingual rich-text group with no required validator (optional field, e.g. body). */
export function richTextGroup(fb: FormBuilder, value?: BilingualEditorDocument | null): FormGroup {
  return fb.group({
    en: fb.control<EditorDocument | null>(value?.en ?? null),
    vi: fb.control<EditorDocument | null>(value?.vi ?? null),
  });
}

/** Bilingual rich-text group requiring authored content in BOTH locales (per-locale error). */
export function requiredRichTextGroup(fb: FormBuilder, value?: BilingualEditorDocument | null): FormGroup {
  return fb.group({
    en: fb.control<EditorDocument | null>(value?.en ?? null, [richTextRequiredValidator()]),
    vi: fb.control<EditorDocument | null>(value?.vi ?? null, [richTextRequiredValidator()]),
  });
}
