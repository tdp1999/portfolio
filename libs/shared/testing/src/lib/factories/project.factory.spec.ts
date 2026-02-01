import { createMockProject, createMockProjects } from './project.factory';

describe('createMockProject', () => {
  it('should create a project with default values', () => {
    const project = createMockProject();

    expect(project.id).toBe('1');
    expect(project.title).toBe('Mock Project');
    expect(project.description).toBeDefined();
    expect(project.technologies).toContain('TypeScript');
    expect(project.featured).toBe(false);
    expect(project.createdAt).toBeInstanceOf(Date);
    expect(project.updatedAt).toBeInstanceOf(Date);
  });

  it('should allow overriding default values', () => {
    const project = createMockProject({
      id: 'custom-id',
      title: 'Custom Title',
      featured: true,
    });

    expect(project.id).toBe('custom-id');
    expect(project.title).toBe('Custom Title');
    expect(project.featured).toBe(true);
    // Non-overridden values should still have defaults
    expect(project.description).toBe('A test project for unit testing');
  });
});

describe('createMockProjects', () => {
  it('should create multiple projects with unique ids', () => {
    const projects = createMockProjects(3);

    expect(projects).toHaveLength(3);
    expect(projects[0].id).toBe('1');
    expect(projects[1].id).toBe('2');
    expect(projects[2].id).toBe('3');
  });

  it('should apply overrides to all projects', () => {
    const projects = createMockProjects(2, { featured: true });

    expect(projects[0].featured).toBe(true);
    expect(projects[1].featured).toBe(true);
  });
});
