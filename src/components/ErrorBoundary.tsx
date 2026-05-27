/**
 * App-wide error boundary. Catches render-time errors so a buggy page
 * doesn't take the whole shell down. Shows a calm AdvisaCare-branded
 * recovery card with a Reload button.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <App />
 *   </ErrorBoundary>
 */
import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Optional callback fired on capture — useful for logging. */
  onError?: (err: Error, info: { componentStack: string | null | undefined }) => void;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    // In a real product this would ship to Sentry / Datadog. The demo
    // just logs to console.
    // eslint-disable-next-line no-console
    console.error('AdvisaCare command center — caught render error:', error, info);
    this.props.onError?.(error, { componentStack: info.componentStack });
  }

  private handleReload = () => {
    // Hard reload — discards in-memory state, keeps localStorage.
    window.location.reload();
  };

  private handleRecover = () => {
    // Soft recovery — clears the error, lets React try to re-render
    // the same tree. Useful for transient errors.
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-advisa-surface">
        <div
          className="max-w-md w-full rounded-card border border-advisa-border bg-white p-6 text-center relative overflow-hidden"
          style={{
            boxShadow: '0 1px 2px rgba(15,47,51,.05), 0 16px 40px -10px rgba(6,73,79,.20)',
          }}
        >
          <span
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              top: 0, left: 16, right: 16, height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(220,38,38,.45), transparent)',
            }}
          />
          <div
            className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #FCA5A5, #DC2626)',
              boxShadow: '0 4px 12px -2px rgba(220,38,38,.45)',
            }}
          >
            <AlertTriangle size={22} className="text-white" />
          </div>
          <h2 className="text-base font-bold text-advisa-secondary">Something didn't render</h2>
          <p className="text-xs text-clinical-muted mt-2 leading-relaxed">
            The command center hit an unexpected error. Your demo data is safe in local storage. Try recovering
            this view, or reload if the issue persists.
          </p>
          <details className="text-left mt-4 text-[10.5px] font-mono text-clinical-muted bg-advisa-surface rounded-md p-2">
            <summary className="cursor-pointer">Error details</summary>
            <pre className="mt-2 whitespace-pre-wrap break-words">{this.state.error.message}</pre>
          </details>
          <div className="flex gap-2 mt-4 justify-center">
            <button onClick={this.handleRecover} className="btn-secondary text-xs" aria-label="Try to recover this view">
              <RefreshCcw size={13} />
              Try again
            </button>
            <button onClick={this.handleReload} className="btn-primary text-xs" aria-label="Reload the application">
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}
