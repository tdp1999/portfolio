import { InjectionToken, Type } from '@angular/core';
import type { RteEditor } from './rte-contract.editor';

// Concrete editor impls provide themselves under this token; consumers inject the
// Type and render it dynamically — never importing a concrete editor class.
export const RTE_EDITOR = new InjectionToken<Type<RteEditor>>('RTE_EDITOR');
