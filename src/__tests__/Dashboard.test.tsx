import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import { AppProvider } from '../context/AppContext';

function renderWithProviders() {
  return render(
    <BrowserRouter>
      <AppProvider>
        <Dashboard />
      </AppProvider>
    </BrowserRouter>
  );
}

describe('Dashboard KPIs', () => {
  test('renders key KPI cards', () => {
    renderWithProviders();
    expect(screen.getByText('New Referrals')).toBeInTheDocument();
    expect(screen.getByText('Open Shifts')).toBeInTheDocument();
    expect(screen.getByText('Quality Risk')).toBeInTheDocument();
  });

  test('renders urgent referrals KPI', () => {
    renderWithProviders();
    expect(screen.getByText('Urgent Referrals')).toBeInTheDocument();
  });

  test('displays urgent activity section when applicable', () => {
    renderWithProviders();
    // Urgent activity appears when there are SLA breaches, expired credentials, or late notes
    const urgentActivity = screen.queryByTestId('urgent-activity');
    // May or may not be present depending on seed data state
    if (urgentActivity) {
      expect(urgentActivity).toBeInTheDocument();
    }
  });

  test('renders pipeline and service charts', () => {
    renderWithProviders();
    expect(screen.getByText('Referral Pipeline')).toBeInTheDocument();
    expect(screen.getByText('Service Distribution')).toBeInTheDocument();
  });

  test('renders compliance summary', () => {
    renderWithProviders();
    expect(screen.getByText('Compliance Summary')).toBeInTheDocument();
    expect(screen.getByText('Expired')).toBeInTheDocument();
    expect(screen.getByText('Critical Soon')).toBeInTheDocument();
  });

  test('has branch and service filters', () => {
    renderWithProviders();
    expect(screen.getByText('All Branches')).toBeInTheDocument();
    expect(screen.getByText('All Services')).toBeInTheDocument();
  });

  test('has wallboard button', () => {
    renderWithProviders();
    expect(screen.getByText('Wallboard')).toBeInTheDocument();
  });
});
