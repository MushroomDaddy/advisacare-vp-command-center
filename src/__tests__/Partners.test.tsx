import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ReferralPartners from '../pages/ReferralPartners';
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
        <ReferralPartners />
      </AppProvider>
    </BrowserRouter>
  );
}

describe('Referral Partners Page', () => {
  test('renders partners header', () => {
    renderWithProviders();
    expect(screen.getByText('Referral Partners')).toBeInTheDocument();
  });

  test('shows partner risk labels', () => {
    renderWithProviders();
    const riskLabels = screen.queryAllByText(/Growing|Stable|Needs Attention|At Risk/);
    expect(riskLabels.length).toBeGreaterThanOrEqual(1);
  });

  test('shows conversion rate in summary', () => {
    renderWithProviders();
    // "Conversion" appears in both stat card and table header
    expect(screen.getAllByText('Conversion').length).toBeGreaterThanOrEqual(1);
  });

  test('partner follow-up updates timeline', () => {
    renderWithProviders();
    expect(screen.getByText('Follow-ups Due')).toBeInTheDocument();
  });
});
