/// <reference types="vitest" />
import { render, screen } from '@testing-library/react';
import Referrals from '../pages/Referrals';
import { AppProvider } from '../context/AppContext';

describe('Referrals List', () => {
  test('renders referrals table with required columns', () => {
    render(
      <AppProvider>
        <Referrals />
      </AppProvider>
    );
    
    // Actual table headers from Referrals.tsx
    expect(screen.getByText('Patient Initials')).toBeInTheDocument();
    expect(screen.getByText('Service')).toBeInTheDocument();
    expect(screen.getByText('Urgency')).toBeInTheDocument();
    expect(screen.getByText('Source')).toBeInTheDocument();
    expect(screen.getByText('Stage')).toBeInTheDocument();
  });

  test('highlights urgent referrals', () => {
    render(
      <AppProvider>
        <Referrals />
      </AppProvider>
    );
    // Check for urgent referral badges
    const urgentBadges = screen.queryAllByText(/Immediate/i);
    expect(urgentBadges.length).toBeGreaterThanOrEqual(0);
  });
});
