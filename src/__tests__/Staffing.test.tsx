/// <reference types="vitest" />
import { render, screen } from '@testing-library/react';
import Staffing from '../pages/Staffing';
import { AppProvider } from '../context/AppContext';

describe('Staffing Best-Match', () => {
  test('renders staffing dashboard heading', () => {
    render(
      <AppProvider>
        <Staffing />
      </AppProvider>
    );
    
    expect(screen.getByText(/Staffing Coverage Dashboard/i)).toBeInTheDocument();
  });

  test('displays key staffing metrics', () => {
    render(
      <AppProvider>
        <Staffing />
      </AppProvider>
    );
    const todayVisits = screen.getAllByText(/Today's Visits/i);
    expect(todayVisits.length).toBeGreaterThan(0);
    expect(screen.getByText(/Open Shifts/i)).toBeInTheDocument();
  });
});
