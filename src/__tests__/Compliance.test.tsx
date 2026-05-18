/// <reference types="vitest" />
import { render, screen } from '@testing-library/react';
import Compliance from '../pages/Compliance';
import { AppProvider } from '../context/AppContext';

describe('Compliance Status Calculation', () => {
  test('renders compliance page heading', () => {
    render(
      <AppProvider>
        <Compliance />
      </AppProvider>
    );
    
    expect(screen.getByText('Compliance Tracker')).toBeInTheDocument();
  });

  test('renders compliance status filters', () => {
    render(
      <AppProvider>
        <Compliance />
      </AppProvider>
    );
    // Handle multiple "All" elements
    const allFilters = screen.getAllByText('All');
    expect(allFilters.length).toBeGreaterThan(0);
    expect(screen.getByText('Valid')).toBeInTheDocument();
    expect(screen.getByText('Expired')).toBeInTheDocument();
  });
});
