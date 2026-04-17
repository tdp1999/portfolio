import { randomUUID } from 'crypto';
import { prisma } from './db';

export const TEST_MSG_PREFIX = 'e2e-msg-';

export interface TestContactMessage {
  id: string;
  name: string;
  email: string;
}

export async function createTestMessage(
  suffix: string,
  overrides: Record<string, unknown> = {}
): Promise<TestContactMessage> {
  const id = randomUUID();
  const name = `${TEST_MSG_PREFIX}${suffix}`;
  const email = `${TEST_MSG_PREFIX}${suffix}@test-safe.com`;

  await prisma.contactMessage.create({
    data: {
      id,
      name,
      email,
      purpose: 'GENERAL',
      subject: `E2E Subject ${suffix}`,
      message: `This is a test message for E2E testing: ${suffix}`,
      status: 'UNREAD',
      isSpam: false,
      locale: 'en',
      consentGivenAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      ...overrides,
    },
  });

  return { id, name, email };
}

export async function deleteTestMessages(): Promise<void> {
  await prisma.contactMessage.deleteMany({
    where: { name: { startsWith: TEST_MSG_PREFIX } },
  });
}
