import { render, screen } from '@testing-library/angular';
import { App } from './app';
import { NxWelcome } from './nx-welcome';
import { RouterModule } from '@angular/router';
import '@testing-library/jest-dom';

describe('App', () => {
  // Helper function to render the App component with all dependencies
  const renderApp = async () => {
    return await render(App, {
      imports: [NxWelcome, RouterModule.forRoot([])],
    });
  };

  describe('Component Rendering', () => {
    it('should render the app component without errors', async () => {
      // Arrange & Act
      const { container } = await renderApp();

      // Assert
      expect(container).toBeInTheDocument();
    });

    it('should have the correct title property', async () => {
      // Arrange & Act
      const { fixture } = await renderApp();
      const component = fixture.componentInstance;

      // Assert
      expect(component.title).toBe('landing');
    });

    it('should render the welcome message', async () => {
      // Arrange & Act
      await renderApp();

      // Assert - Query by text content (user-centric approach)
      expect(screen.getByText(/Welcome landing/i)).toBeInTheDocument();
    });

    it('should render the hello greeting', async () => {
      // Arrange & Act
      await renderApp();

      // Assert
      expect(screen.getByText(/Hello there/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have a heading element with correct level', async () => {
      // Arrange & Act
      await renderApp();

      // Assert - Query by role (accessible and user-centric)
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent(/Welcome landing/i);
    });

    it('should have accessible structure with proper semantic elements', async () => {
      // Arrange & Act
      await renderApp();

      // Assert - Verify semantic HTML elements are present
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });
  });

  describe('Component Integration', () => {
    it('should render the NxWelcome component', async () => {
      // Arrange & Act
      await renderApp();

      // Assert - Verify child component content is visible
      expect(screen.getByText(/Hello there/i)).toBeInTheDocument();
    });

    it('should include router-outlet for navigation', async () => {
      // Arrange & Act
      const { container } = await renderApp();

      // Assert - Router outlet should be present for routing functionality
      const routerOutlet = container.querySelector('router-outlet');
      expect(routerOutlet).toBeInTheDocument();
    });
  });

  describe('User-Visible Content', () => {
    it('should display all expected text content', async () => {
      // Arrange & Act
      await renderApp();

      // Assert - Verify key user-visible content
      expect(screen.getByText(/Welcome landing/i)).toBeVisible();
      expect(screen.getByText(/Hello there/i)).toBeVisible();
    });

    it('should not have empty content', async () => {
      // Arrange & Act
      const { container } = await renderApp();

      // Assert
      expect(container.textContent).toBeTruthy();
      expect(container.textContent?.trim().length).toBeGreaterThan(0);
    });
  });
});
