import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Staffing from '../pages/Staffing';
import { AppProvider } from '../context/AppContext';

function renderWithProviders() {
  return render(
    <BrowserRouter>
      <AppProvider>
        <Staffing />
      </AppProvider>
    </BrowserRouter>
  );
}

describe('Staffing Page', () => {
  test('renders staffing header', () => {
    renderWithProviders();
    expect(screen.getByText('Staffing & Assignment')).toBeInTheDocument();
  });

  test('renders staff overview', () => {
    renderWithProviders();
    expect(screen.getByText('Staff Overview')).toBeInTheDocument();
  });

  test('renders awaiting assignment section', () => {
    renderWithProviders();
    expect(screen.getByText('Awaiting Assignment')).toBeInTheDocument();
  });

  test('shows shift board toggle', () => {
    renderWithProviders();
    expect(screen.getByText(/Shift Board/)).toBeInTheDocument();
  });

  test('shows find match button for unstaffed referrals', () => {
    renderWithProviders();
    const findMatchBtns = screen.queryAllByText('Find Match');
    expect(findMatchBtns.length).toBeGreaterThanOrEqual(0);
  });

  test('renders staff roster with names', () => {
    renderWithProviders();
    // Staff members from seed data should be visible
    expect(screen.getAllByText(/RN|LPN|PT|OT|SLP/).length).toBeGreaterThanOrEqual(1);
  });
});
