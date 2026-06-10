import type { FormControl, FormGroup } from '@angular/forms';

export type BulletGroup = FormGroup<{ text: FormControl<string> }>;
export type LinkGroup = FormGroup<{ label: FormControl<string>; url: FormControl<string> }>;
