import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import type { TranslatableJson } from '../project.types';
import { EMPTY_TRANSLATABLE } from './project.form.data';

export function requiredTranslatableGroup(fb: FormBuilder, value: TranslatableJson = EMPTY_TRANSLATABLE): FormGroup {
  return fb.group({
    en: fb.control(value['en'] ?? '', { nonNullable: true, validators: [Validators.required] }),
    vi: fb.control(value['vi'] ?? '', { nonNullable: true, validators: [Validators.required] }),
  });
}
