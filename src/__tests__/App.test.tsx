/// <reference types="vitest" />
import { render, screen } from '@testing-library/react';
import App from '../App';
import { AppProvider, useAppState } from '../context/AppContext';
import { vi } from 'vitest';

// Mock the AppContext to control user roles
vi.mock('../context/AppContext', async () => {
  const actual = await vi.importActual<typeof import('../context/AppContext')>('../context/AppContext');
  return {
    ...actual,
    useAppState: vi.fn(),
    AppProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

describe('App.tsx Routing and Role Access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockState = {
    currentUser: { role: 'VP', name: 'Test User' },
    referrals: [],
    compliance: [],
    quality: [],
    staff: [],
    settings: {}
  };

  test('renders HIPAA prototype banner', () => {
    (useAppState as any).mockReturnValue({
      state: mockState,
      getComplianceStatus: () => 'Valid'
    });

    render(<App />);
    expect(screen.getByText(/Prototype only — demo data — not for production use without HIPAA review/i)).toBeInTheDocument();
  });

  test('VP role can access all routes', () => {
    (useAppState as any).mockReturnValue({
      state: mockState,
      getComplianceStatus: () => 'Valid'
    });

    render(<App />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Referrals')).toBeInTheDocument();
    expect(screen.getByText('Staffing')).toBeInTheDocument();
    expect(screen.getByText('Compliance')).toBeInTheDocument();
  });
});
