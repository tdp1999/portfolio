import type { FormControl, FormGroup } from '@angular/forms';

export type LinkGroup = FormGroup<{ label: FormControl<string>; url: FormControl<string> }>;
