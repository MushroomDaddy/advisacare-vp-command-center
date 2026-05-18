/// <reference types="vitest" />
import { render, screen } from '@testing-library/react';
import Dashboard from '../pages/Dashboard';
import { AppProvider } from '../context/AppContext';

describe('Dashboard KPIs', () => {
  test('renders key KPI cards', () => {
    render(
      <AppProvider>
        <Dashboard />
      </AppProvider>
    );
    
    // Use function matcher for text that might be split
    expect(screen.getByText((content) => content.includes('New Referrals'))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('Urgent Referrals'))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('Missing Documents'))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('Open Shifts Today'))).toBeInTheDocument();
  });

  test('displays urgent activity section', () => {
    render(
      <AppProvider>
        <Dashboard />
      </AppProvider>
    );
    const urgentSection = screen.getByText(/Urgent Activity/i);
    expect(urgentSection).toBeInTheDocument();
  });
});
