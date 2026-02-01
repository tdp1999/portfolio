import { render, screen } from '@testing-library/angular';
import { App } from './app';
import { NxWelcome } from './nx-welcome';
import '@testing-library/jest-dom';

describe('App', () => {
  it('should render the welcome message', async () => {
    await render(App, {
      imports: [NxWelcome],
    });

    // Query by text content - user-centric approach
    expect(screen.getByText(/Welcome landing/i)).toBeInTheDocument();
  });

  it('should render the hello greeting', async () => {
    await render(App, {
      imports: [NxWelcome],
    });

    expect(screen.getByText(/Hello there/i)).toBeInTheDocument();
  });

  it('should have a heading element', async () => {
    await render(App, {
      imports: [NxWelcome],
    });

    // Query by role - accessible and user-centric
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent(/Welcome landing/i);
  });
});
