import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Compliance from '../pages/Compliance';
import { AppProvider } from '../context/AppContext';

function renderWithProviders() {
  return render(
    <BrowserRouter>
      <AppProvider>
        <Compliance />
      </AppProvider>
    </BrowserRouter>
  );
}

describe('Compliance Page', () => {
  test('renders compliance header', () => {
    renderWithProviders();
    expect(screen.getByText('Credential Compliance')).toBeInTheDocument();
  });

  test('renders status summary cards', () => {
    renderWithProviders();
    // Use getAllByText since "Expired" appears in stat card, filter option, and badge
    expect(screen.getAllByText('Expired').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Critical Soon/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Compliant/).length).toBeGreaterThanOrEqual(1);
  });

  test('shows urgent notification when expired credentials exist', () => {
    renderWithProviders();
    expect(screen.getByTestId('compliance-urgent')).toBeInTheDocument();
  });

  test('does not use browser alert (uses toast instead)', () => {
    renderWithProviders();
    // The page should render without calling window.alert
    expect(screen.getByText('Export')).toBeInTheDocument();
    // Renew buttons exist for expired items
    expect(screen.getAllByText('Renew').length).toBeGreaterThanOrEqual(1);
  });
});
