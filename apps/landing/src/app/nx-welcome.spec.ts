import { render, screen } from '@testing-library/angular';
import { NxWelcome } from './nx-welcome';
import '@testing-library/jest-dom';

describe('NxWelcome', () => {
  // Helper function to render the component
  const renderNxWelcome = async () => {
    return await render(NxWelcome);
  };

  describe('Component Rendering', () => {
    it('should render without errors', async () => {
      // Arrange & Act
      const { container } = await renderNxWelcome();

      // Assert
      expect(container).toBeInTheDocument();
    });

    it('should have content visible to users', async () => {
      // Arrange & Act
      const { container } = await renderNxWelcome();

      // Assert
      expect(container.textContent).toBeTruthy();
      expect(container.textContent?.trim().length).toBeGreaterThan(0);
    });
  });

  describe('Welcome Message', () => {
    it('should display the greeting message', async () => {
      // Arrange & Act
      await renderNxWelcome();

      // Assert
      expect(screen.getByText(/Hello there/i)).toBeInTheDocument();
    });

    it('should display the welcome title', async () => {
      // Arrange & Act
      await renderNxWelcome();

      // Assert
      expect(screen.getByText(/Welcome landing/i)).toBeInTheDocument();
    });

    it('should have a main heading', async () => {
      // Arrange & Act
      await renderNxWelcome();

      // Assert
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Links and Navigation', () => {
    it('should render all navigation links', async () => {
      // Arrange & Act
      await renderNxWelcome();

      // Assert - Verify links are present
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });

    it('should have links with href attributes', async () => {
      // Arrange & Act
      await renderNxWelcome();

      // Assert
      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveAttribute('href');
      });
    });

    it('should have external links with proper attributes', async () => {
      // Arrange & Act
      const { container } = await renderNxWelcome();

      // Assert - External links should have target and rel attributes for security
      const externalLinks = container.querySelectorAll('a[href^="http"]');
      externalLinks.forEach((link) => {
        expect(link).toHaveAttribute('target');
        expect(link).toHaveAttribute('rel');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have semantic HTML structure', async () => {
      // Arrange & Act
      await renderNxWelcome();

      // Assert - Check for semantic elements
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('should have accessible links', async () => {
      // Arrange & Act
      await renderNxWelcome();

      // Assert - All links should be accessible via role
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
      links.forEach((link) => {
        expect(link).toBeVisible();
      });
    });

    it('should have readable text content', async () => {
      // Arrange & Act
      const { container } = await renderNxWelcome();

      // Assert - Component should have meaningful text
      const text = container.textContent || '';
      expect(text.length).toBeGreaterThan(50); // Substantial content
    });
  });

  describe('Visual Elements', () => {
    it('should render with proper structure', async () => {
      // Arrange & Act
      const { container } = await renderNxWelcome();

      // Assert - Check for key container elements
      expect(container.querySelector('.wrapper')).toBeInTheDocument();
      expect(container.querySelector('.container')).toBeInTheDocument();
    });

    it('should have the welcome section', async () => {
      // Arrange & Act
      const { container } = await renderNxWelcome();

      // Assert
      const welcomeSection = container.querySelector('#welcome');
      expect(welcomeSection).toBeInTheDocument();
    });

    it('should have the hero section', async () => {
      // Arrange & Act
      const { container } = await renderNxWelcome();

      // Assert
      const heroSection = container.querySelector('#hero');
      expect(heroSection).toBeInTheDocument();
    });
  });

  describe('Content Sections', () => {
    it('should display multiple heading levels', async () => {
      // Arrange & Act
      await renderNxWelcome();

      // Assert - Check for different heading levels
      const allHeadings = screen.getAllByRole('heading');
      expect(allHeadings.length).toBeGreaterThan(1);
    });

    it('should have visible text in all sections', async () => {
      // Arrange & Act
      await renderNxWelcome();

      // Assert - Main heading should be visible
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeVisible();
      expect(h1.textContent).toBeTruthy();
    });
  });
});
