import { Pipe, PipeTransform } from '@angular/core';

const LOCATION_TYPE_LABELS: Record<string, string> = {
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
  ONSITE: 'Onsite',
};

@Pipe({ name: 'locationTypeLabel', standalone: true })
export class LocationTypeLabelPipe implements PipeTransform {
  transform(value: string): string {
    return LOCATION_TYPE_LABELS[value] ?? value;
  }
}
