import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * Catches runtime rendering errors in child components (e.g. Leaflet map crashes)
 * preventing the entire React application from crashing into a blank screen.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Caught unhandled rendering error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="card route-map-card route-map-empty" role="alert">
          <div className="empty-state">
            <h3 className="empty-state-title">
              {this.props.fallbackTitle || 'Щось пішло не так при відображенні'}
            </h3>
            <p className="empty-state-text">
              {this.props.fallbackMessage ||
                'Виникла неочікувана помилка відображення блоку. Спробуйте оновити або натисніть повторити.'}
            </p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={this.handleRetry}
              style={{ marginTop: '0.75rem' }}
            >
              Спробувати знову
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
