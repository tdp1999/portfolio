import { Pipe, PipeTransform } from '@angular/core';

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: 'Full Time',
  PART_TIME: 'Part Time',
  CONTRACT: 'Contract',
  FREELANCE: 'Freelance',
  INTERNSHIP: 'Internship',
  SELF_EMPLOYED: 'Self Employed',
};

@Pipe({ name: 'employmentTypeLabel', standalone: true })
export class EmploymentTypeLabelPipe implements PipeTransform {
  transform(value: string): string {
    return EMPLOYMENT_TYPE_LABELS[value] ?? value;
  }
}
