import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    NavLink: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
    Routes: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Route: () => null,
    Navigate: () => null,
    useLocation: () => ({ pathname: '/' }),
    useNavigate: () => vi.fn(),
  };
});

import App from '../App';

describe('App', () => {
  test('renders HIPAA-conscious prototype banner', () => {
    render(<App />);
    expect(screen.getByTestId('hipaa-banner')).toBeInTheDocument();
    expect(screen.getByText(/HIPAA-conscious prototype/i)).toBeInTheDocument();
  });

  test('renders sidebar with navigation', () => {
    render(<App />);
    expect(screen.getByText('AdvisaCare')).toBeInTheDocument();
    expect(screen.getByText('VP Command Center')).toBeInTheDocument();
  });

  test('renders current user info in sidebar', () => {
    render(<App />);
    expect(screen.getByText('VP')).toBeInTheDocument();
  });

  test('banner mentions security controls', () => {
    render(<App />);
    const banner = screen.getByTestId('hipaa-banner');
    expect(banner.textContent).toContain('BAA');
    expect(banner.textContent).toContain('security controls');
  });
});
