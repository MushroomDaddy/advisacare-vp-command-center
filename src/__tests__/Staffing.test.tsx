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
    expect(screen.getByText('Staffing Coverage Dashboard')).toBeInTheDocument();
  });

  test('renders stat cards', () => {
    renderWithProviders();
    // "Available" appears in stat card and staff rows, so use getAllByText
    expect(screen.getAllByText('Available').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Confirmed').length).toBeGreaterThanOrEqual(1);
  });

  test('renders best-match section', () => {
    renderWithProviders();
    expect(screen.getByText('Best-Match Staffing')).toBeInTheDocument();
  });

  test('has referral selector for matching', () => {
    renderWithProviders();
    expect(screen.getByText('Select a referral to match...')).toBeInTheDocument();
  });

  test('renders staff roster table', () => {
    renderWithProviders();
    expect(screen.getByText('Staff Roster')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Role')).toBeInTheDocument();
  });

  test('renders workload heatmap', () => {
    renderWithProviders();
    expect(screen.getByText('Workload Heatmap')).toBeInTheDocument();
  });
});
