import { FormBuilder, FormGroup } from '@angular/forms';
import type { BilingualEditorDocument } from '@portfolio/console/shared/util';
import type { EditorDocument } from '@portfolio/shared/features/rte-core';

/**
 * Bilingual rich-text group (per-locale `EditorDocument` controls) with no
 * required validator — every experience prose field (description / responsibilities
 * / highlights) is optional. Mirrors the project form's helper of the same name.
 */
export function richTextGroup(fb: FormBuilder, value?: BilingualEditorDocument | null): FormGroup {
  return fb.group({
    en: fb.control<EditorDocument | null>(value?.en ?? null),
    vi: fb.control<EditorDocument | null>(value?.vi ?? null),
  });
}
