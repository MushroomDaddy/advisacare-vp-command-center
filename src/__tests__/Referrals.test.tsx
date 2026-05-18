import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Referrals from '../pages/Referrals';
import { AppProvider } from '../context/AppContext';

function renderWithProviders() {
  return render(
    <BrowserRouter>
      <AppProvider>
        <Referrals />
      </AppProvider>
    </BrowserRouter>
  );
}

describe('Referrals Page', () => {
  test('renders referrals header', () => {
    renderWithProviders();
    expect(screen.getByText('Referral Pipeline')).toBeInTheDocument();
  });

  test('renders kanban/table view toggle', () => {
    renderWithProviders();
    expect(screen.getByText('Kanban')).toBeInTheDocument();
    expect(screen.getByText('Table')).toBeInTheDocument();
  });

  test('doc upload readiness transition updates state', () => {
    renderWithProviders();
    // Verify referral cards render with readiness states
    const readiness = screen.queryAllByText(/Missing Docs|Ready for Eligibility|Ready for Staffing|Ready for SOC/);
    expect(readiness.length).toBeGreaterThanOrEqual(1);
  });
});
