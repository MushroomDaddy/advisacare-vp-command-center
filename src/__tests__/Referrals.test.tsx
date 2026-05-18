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
  test('renders referral pipeline header', () => {
    renderWithProviders();
    expect(screen.getByText('Referral Pipeline')).toBeInTheDocument();
  });

  test('renders table with Patient column', () => {
    renderWithProviders();
    expect(screen.getByText('Patient')).toBeInTheDocument();
    expect(screen.getByText('Source')).toBeInTheDocument();
    expect(screen.getByText('Urgency')).toBeInTheDocument();
  });

  test('has Table and Kanban view toggle', () => {
    renderWithProviders();
    expect(screen.getByText('Table')).toBeInTheDocument();
    expect(screen.getByText('Kanban')).toBeInTheDocument();
  });

  test('has stage and urgency filters', () => {
    renderWithProviders();
    expect(screen.getByText('All Stages')).toBeInTheDocument();
    expect(screen.getByText('All Urgencies')).toBeInTheDocument();
  });

  test('renders referral data from seed data', () => {
    renderWithProviders();
    // Seed data contains patient initials
    expect(screen.getByText('J.D.')).toBeInTheDocument();
    expect(screen.getByText('L.K.')).toBeInTheDocument();
  });
});
