import { Experience } from '@portfolio/types';

/**
 * Creates a mock Experience entity for testing
 * @param overrides - Partial Experience properties to override defaults
 */
export function createMockExperience(
  overrides?: Partial<Experience>
): Experience {
  const now = new Date();
  return {
    id: '1',
    company: 'Mock Company',
    role: 'Software Engineer',
    description: 'Developed and maintained web applications',
    startDate: new Date('2022-01-01'),
    endDate: undefined,
    current: true,
    technologies: ['TypeScript', 'Angular', 'Node.js'],
    location: 'Remote',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Creates multiple mock Experience entities
 * @param count - Number of experiences to create
 * @param overrides - Partial Experience properties to apply to all
 */
export function createMockExperiences(
  count: number,
  overrides?: Partial<Experience>
): Experience[] {
  return Array.from({ length: count }, (_, i) =>
    createMockExperience({
      id: String(i + 1),
      company: `Company ${i + 1}`,
      ...overrides,
    })
  );
}
