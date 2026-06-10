export const ERROR_CONFIG: Record<string, { title: string; description: string }> = {
  '403': { title: 'Access Denied', description: 'You do not have permission to view this page.' },
  '404': { title: 'Not Found', description: 'The page you are looking for does not exist.' },
  '500': {
    title: 'Server Error',
    description: 'Something went wrong on our end. Please try again later.',
  },
};

export const DEFAULT_ERROR = { title: 'Error', description: 'An unexpected error occurred.' };
