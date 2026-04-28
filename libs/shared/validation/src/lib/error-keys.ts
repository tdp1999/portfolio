/**
 * Canonical error keys produced by FE validators and consumed by `FormErrorPipe` /
 * `DEFAULT_VALIDATION_MESSAGES`. BE may also emit these via `formatZodError` for keys
 * we want unified inline messages on (e.g. password complexity).
 */
export const ERROR_KEYS = {
  required: 'required',
  email: 'email',
  minlength: 'minlength',
  maxlength: 'maxlength',
  min: 'min',
  max: 'max',
  pattern: 'pattern',
  maxDecimals: 'maxDecimals',
  passwordsMismatch: 'passwordsMismatch',
  passwordWeak: 'passwordWeak',
  urlInvalid: 'urlInvalid',
  integerOnly: 'integerOnly',
  translatableEnViRequired: 'translatableEnViRequired',
  server: 'server',
} as const;

export type ErrorKey = (typeof ERROR_KEYS)[keyof typeof ERROR_KEYS];
