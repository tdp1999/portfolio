export const TEST_USERS = {
  standard: {
    id: '00000000-0000-4000-a000-000000000001',
    email: 'test-user@e2e.local',
    password: 'TestPass1!',
    name: 'E2E Standard User',
  },
  googleOnly: {
    id: '00000000-0000-4000-a000-000000000002',
    email: 'test-google@e2e.local',
    name: 'E2E Google User',
    googleId: 'google-e2e-test-id-123',
  },
  locked: {
    id: '00000000-0000-4000-a000-000000000003',
    email: 'test-locked@e2e.local',
    password: 'TestPass1!',
    name: 'E2E Locked User',
    failedLoginAttempts: 5,
  },
} as const;

export const TEST_EMAIL_PREFIX = 'test-';
export const TEST_EMAIL_DOMAIN = '@e2e.local';
