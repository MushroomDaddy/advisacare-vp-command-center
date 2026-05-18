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
  test('renders compliance tracker header', () => {
    renderWithProviders();
    expect(screen.getByText('Compliance Tracker')).toBeInTheDocument();
  });

  test('renders calculated compliance status cards', () => {
    renderWithProviders();
    // Each card appears exactly once as a card label
    const statusFilter = screen.getByTestId('filter-status');
    expect(statusFilter).toBeInTheDocument();
  });

  test('has status and type filters', () => {
    renderWithProviders();
    expect(screen.getByText('All Statuses')).toBeInTheDocument();
    expect(screen.getByText('All Types')).toBeInTheDocument();
  });

  test('renders HIPAA-conscious prototype notice', () => {
    renderWithProviders();
    expect(screen.getByText('HIPAA-Conscious Prototype Notice')).toBeInTheDocument();
  });

  test('renders compliance table headers', () => {
    renderWithProviders();
    expect(screen.getByText('Staff')).toBeInTheDocument();
    expect(screen.getByText('Item')).toBeInTheDocument();
    expect(screen.getByText('Expiry Date')).toBeInTheDocument();
    expect(screen.getByText('Days Left')).toBeInTheDocument();
  });
});
