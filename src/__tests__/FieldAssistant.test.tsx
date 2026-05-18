/// <reference types="vitest" />
import { render, screen } from '@testing-library/react';
import FieldAssistant from '../pages/FieldAssistant';
import { AppProvider } from '../context/AppContext';

describe('Field Assistant Mobile View', () => {
  test('renders field assistant heading', () => {
    render(
      <AppProvider>
        <FieldAssistant />
      </AppProvider>
    );
    
    expect(screen.getByText(/Field Visit Assistant/i)).toBeInTheDocument();
  });

  test('displays visit-related sections', () => {
    render(
      <AppProvider>
        <FieldAssistant />
      </AppProvider>
    );
    // Use function matcher for text that might be split
    expect(screen.getByText((content) => content.includes("Today's Visits"))).toBeInTheDocument();
  });
});
