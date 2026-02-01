import { Project } from '@portfolio/types';

/**
 * Creates a mock Project entity for testing
 * @param overrides - Partial Project properties to override defaults
 */
export function createMockProject(overrides?: Partial<Project>): Project {
  const now = new Date();
  return {
    id: '1',
    title: 'Mock Project',
    description: 'A test project for unit testing',
    technologies: ['TypeScript', 'Angular'],
    imageUrl: 'https://example.com/image.jpg',
    liveUrl: 'https://example.com/live',
    sourceUrl: 'https://github.com/example/project',
    featured: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Creates multiple mock Project entities
 * @param count - Number of projects to create
 * @param overrides - Partial Project properties to apply to all
 */
export function createMockProjects(
  count: number,
  overrides?: Partial<Project>
): Project[] {
  return Array.from({ length: count }, (_, i) =>
    createMockProject({
      id: String(i + 1),
      title: `Project ${i + 1}`,
      ...overrides,
    })
  );
}
