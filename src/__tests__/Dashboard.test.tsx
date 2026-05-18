import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import { AppProvider } from '../context/AppContext';

function renderWithProviders() {
  return render(
    <BrowserRouter>
      <AppProvider>
        <Dashboard />
      </AppProvider>
    </BrowserRouter>
  );
}

describe('Dashboard Page', () => {
  test('renders executive dashboard header', () => {
    renderWithProviders();
    expect(screen.getByText('Executive Dashboard')).toBeInTheDocument();
  });

  test('renders bottleneck radar', () => {
    renderWithProviders();
    expect(screen.getByTestId('bottleneck-radar')).toBeInTheDocument();
    expect(screen.getByText('Bottleneck Radar')).toBeInTheDocument();
  });

  test('shows SLA Breach stat card', () => {
    renderWithProviders();
    expect(screen.getByText('SLA Breach')).toBeInTheDocument();
  });

  test('shows quality risk stat card', () => {
    renderWithProviders();
    expect(screen.getByText('Quality Risk')).toBeInTheDocument();
  });

  test('renders pipeline snapshot', () => {
    renderWithProviders();
    expect(screen.getByText('Pipeline Snapshot')).toBeInTheDocument();
  });

  test('renders notification center widget', () => {
    renderWithProviders();
    expect(screen.getByTestId('notification-center')).toBeInTheDocument();
  });

  test('renders recent activity section', () => {
    renderWithProviders();
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
  });

  test('renders catastrophic care summary when cases exist', () => {
    renderWithProviders();
    expect(screen.getByTestId('cat-care-summary')).toBeInTheDocument();
    expect(screen.getByText('Catastrophic Care Coverage')).toBeInTheDocument();
  });
});
