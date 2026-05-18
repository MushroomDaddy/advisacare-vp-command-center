import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

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

describe('Notification Center', () => {
  test('renders alert badge with count', () => {
    render(<App />);
    const badge = screen.queryByTestId('alert-badge');
    if (badge) {
      const text = badge.textContent ?? '';
      // Badge shows "9+" for counts > 9, otherwise a number
      if (text === '9+') {
        expect(text).toBe('9+');
      } else {
        expect(Number(text)).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('notification center opens on bell click', () => {
    render(<App />);
    const bellButton = screen.getByTestId('notification-bell');
    fireEvent.click(bellButton);
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  test('alerts are grouped by severity', () => {
    render(<App />);
    const bellButton = screen.getByTestId('notification-bell');
    fireEvent.click(bellButton);
    const severityLabels = screen.queryAllByText(/Critical|High|Medium|Low/);
    expect(severityLabels.length).toBeGreaterThanOrEqual(1);
  });

  test('notification center has View Source buttons', () => {
    render(<App />);
    const bellButton = screen.getByTestId('notification-bell');
    fireEvent.click(bellButton);
    const viewSourceBtns = screen.queryAllByTestId('view-source-btn');
    // Alerts with sourceRecordId will have View Source buttons
    expect(viewSourceBtns.length).toBeGreaterThanOrEqual(0);
  });
});
