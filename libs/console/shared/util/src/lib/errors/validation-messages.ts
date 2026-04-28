export type ErrorMessageFn = (params: Record<string, unknown>) => string;
export type ErrorMessage = string | ErrorMessageFn;

export const DEFAULT_VALIDATION_MESSAGES: Record<string, ErrorMessage> = {
  required: 'This field is required.',
  email: 'Enter a valid email address (e.g., name@example.com).',
  minlength: (p) => `Must be at least ${p['requiredLength']} characters.`,
  maxlength: (p) => `Must be ${p['requiredLength']} characters or less.`,
  min: (p) => `Must be at least ${p['min']}.`,
  max: (p) => `Must be at most ${p['max']}.`,
  pattern: 'Invalid format.',
  maxDecimals: (p) => `Use at most ${p['max']} decimal place${p['max'] === 1 ? '' : 's'}.`,
  passwordsMismatch: 'Passwords do not match.',
  passwordWeak:
    'Password must be at least 8 characters and include an uppercase letter, lowercase letter, number, and special character (#?!@$%^&*-).',
  urlInvalid: 'Enter a valid URL starting with http:// or https://.',
  integerOnly: 'Enter a whole number (no decimals).',
  translatableEnViRequired: 'Both English and Vietnamese values are required.',
  server: (p) => `${p['message'] ?? p['value'] ?? 'Server error.'}`,
};

export function resolveValidationMessage(
  errorKey: string,
  errorValue: unknown,
  customMessages?: Record<string, ErrorMessage>
): string {
  const message = customMessages?.[errorKey] ?? DEFAULT_VALIDATION_MESSAGES[errorKey];
  if (!message) return 'Invalid value.';
  if (typeof message === 'string') return message;

  const params = typeof errorValue === 'object' && errorValue !== null ? (errorValue as Record<string, unknown>) : {};
  // For `server` errors, the value is often a plain string
  if (typeof errorValue === 'string') {
    return message({ message: errorValue, value: errorValue });
  }
  return message(params);
}
