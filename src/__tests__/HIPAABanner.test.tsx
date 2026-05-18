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
  };
});

import App from '../App';

describe('HIPAA Banner', () => {
  test('shows HIPAA-conscious prototype text', () => {
    render(<App />);
    expect(screen.getByText(/HIPAA-conscious prototype/i)).toBeInTheDocument();
  });

  test('mentions BAA requirement', () => {
    render(<App />);
    const banner = screen.getByTestId('hipaa-banner');
    expect(banner.textContent).toContain('BAA');
  });

  test('mentions security controls', () => {
    render(<App />);
    const banner = screen.getByTestId('hipaa-banner');
    expect(banner.textContent).toContain('security controls');
  });

  test('mentions encryption and MFA', () => {
    render(<App />);
    const banner = screen.getByTestId('hipaa-banner');
    expect(banner.textContent).toContain('encryption');
    expect(banner.textContent).toContain('MFA');
  });

  test('mentions HIPAA/security review before real PHI', () => {
    render(<App />);
    const banner = screen.getByTestId('hipaa-banner');
    expect(banner.textContent).toContain('HIPAA/security review');
  });
});
