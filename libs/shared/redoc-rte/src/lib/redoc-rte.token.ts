import { InjectionToken, Type } from '@angular/core';
import type { RedocRteEditor } from './redoc-rte.editor';

// Concrete editor impls provide themselves under this token; consumers inject the
// Type and render it dynamically — never importing a concrete editor class.
export const REDOC_RTE_EDITOR = new InjectionToken<Type<RedocRteEditor>>('REDOC_RTE_EDITOR');
