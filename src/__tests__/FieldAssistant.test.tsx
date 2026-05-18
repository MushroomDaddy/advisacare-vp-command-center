import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import FieldAssistant from '../pages/FieldAssistant';
import { AppProvider } from '../context/AppContext';

function renderWithProviders() {
  return render(
    <BrowserRouter>
      <AppProvider>
        <FieldAssistant />
      </AppProvider>
    </BrowserRouter>
  );
}

describe('Field Assistant Page', () => {
  test('renders Field Visit Assistant title', () => {
    renderWithProviders();
    expect(screen.getByText('Field Visit Assistant')).toBeInTheDocument();
  });

  test('renders Today\'s Route section', () => {
    renderWithProviders();
    expect(screen.getByText("Today's Route")).toBeInTheDocument();
  });

  test('shows online/offline indicator', () => {
    renderWithProviders();
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  test('shows visit checklist section when a visit is selected', () => {
    renderWithProviders();
    expect(screen.getByText('Visit Checklist')).toBeInTheDocument();
  });

  test('has escalation and incident report buttons', () => {
    renderWithProviders();
    expect(screen.getByText('Escalate')).toBeInTheDocument();
    expect(screen.getByText('Incident Report')).toBeInTheDocument();
  });

  test('shows EVV panel', () => {
    renderWithProviders();
    expect(screen.getByText(/Electronic Visit Verification/i)).toBeInTheDocument();
  });
});
