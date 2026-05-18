import { render, screen } from '@testing-library/react';
import App from '../App';
import { AppProvider } from '../context/AppContext';

describe('HIPAA Banner Presence', () => {
  test('displays HIPAA compliance warning banner', () => {
    render(
      <AppProvider>
        <App />
      </AppProvider>
    );
    
    // Check for the HIPAA-related banner text
    expect(screen.getByText(/HIPAA review/i)).toBeInTheDocument();
    expect(screen.getByText(/not for production use/i)).toBeInTheDocument();
  });

  test('banner is visible on all routes', () => {
    render(
      <AppProvider>
        <App />
      </AppProvider>
    );
    // Banner should be present regardless of route
    const hipaaBanner = screen.getByText(/Prototype only — demo data/i);
    expect(hipaaBanner).toBeVisible();
  });

  test('banner contains required HIPAA disclaimer elements', () => {
    render(
      <AppProvider>
        <App />
      </AppProvider>
    );
    expect(screen.getByText(/BAA/i)).toBeInTheDocument();
    expect(screen.getByText(/security controls/i)).toBeInTheDocument();
  });
});
