import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Quality from '../pages/Quality';
import { AppProvider } from '../context/AppContext';

// Mock recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

function renderWithProviders() {
  return render(
    <BrowserRouter>
      <AppProvider>
        <Quality />
      </AppProvider>
    </BrowserRouter>
  );
}

describe('Quality Page', () => {
  test('renders quality management header', () => {
    renderWithProviders();
    expect(screen.getByText('Quality Management')).toBeInTheDocument();
  });

  test('renders tab bar with Watchboard, OASIS, HOPE, CAHPS', () => {
    renderWithProviders();
    expect(screen.getByText('Watchboard')).toBeInTheDocument();
    expect(screen.getByText('OASIS Queue')).toBeInTheDocument();
    expect(screen.getByText('HOPE Queue')).toBeInTheDocument();
    expect(screen.getByText('CAHPS')).toBeInTheDocument();
  });

  test('shows quality risk score on watchboard', () => {
    renderWithProviders();
    expect(screen.getByTestId('quality-risk-score')).toBeInTheDocument();
    expect(screen.getByText('Quality Risk Score')).toBeInTheDocument();
  });
});
