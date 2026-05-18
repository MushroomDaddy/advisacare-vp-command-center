import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import { AppProvider } from '../context/AppContext';

// Mock recharts — include all chart types used
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: () => null,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Legend: () => null,
  Cell: () => null,
  LabelList: () => null,
  FunnelChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Funnel: () => null,
}));

function renderWithProviders() {
  return render(
    <BrowserRouter>
      <AppProvider>
        <Dashboard />
      </AppProvider>
    </BrowserRouter>
  );
}

describe('Dashboard Page', () => {
  test('renders executive brief', () => {
    renderWithProviders();
    expect(screen.getByText(/What Changed Since Yesterday/i)).toBeInTheDocument();
  });

  test('renders top actions section', () => {
    renderWithProviders();
    expect(screen.getByTestId('top-actions')).toBeInTheDocument();
  });

  test('shows SLA breaches stat card', () => {
    renderWithProviders();
    expect(screen.getAllByText('SLA Breaches').length).toBeGreaterThanOrEqual(1);
  });

  test('shows quality risk score', () => {
    renderWithProviders();
    expect(screen.getByText('Quality Risk')).toBeInTheDocument();
  });
});
