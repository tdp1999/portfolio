import { ZodError } from 'zod';

export function customFlatten(error: ZodError) {
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join('.');
    if (!fieldErrors[path]) {
      fieldErrors[path] = [];
    }
    fieldErrors[path].push(issue.message);
  }

  return {
    formErrors: [] as string[],
    fieldErrors,
  };
}

export function formatZodError(error: ZodError) {
  const flattened = customFlatten(error);

  if (flattened.formErrors.length > 0) {
    return { formErrors: flattened.formErrors };
  }

  return { ...flattened.fieldErrors };
}
