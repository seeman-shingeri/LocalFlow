import React, { Component, ErrorInfo, ReactNode } from 'react';
import { sanitizeApplicationError, SanitizedErrorInfo } from '@/lib/errorSanitizer';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
  showHomeButton?: boolean;
}

interface State {
  hasError: boolean;
  errorInfo: SanitizedErrorInfo | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    const sanitized = sanitizeApplicationError(error);
    return {
      hasError: true,
      errorInfo: sanitized,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Structured console reporting without exposing raw secrets
    console.error('Unhandled Application Render Error captured by GlobalErrorBoundary:', {
      error: error.message,
      componentStack: errorInfo.componentStack,
    });
  }

  private handleReset = (): void => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({ hasError: false, errorInfo: null });
  };

  private handleReload = (): void => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  private handleGoHome = (): void => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      const info = this.state.errorInfo;
      const title = this.props.fallbackTitle || info?.userFacingTitle || 'Something Went Wrong';
      const message =
        this.props.fallbackMessage ||
        info?.userFacingMessage ||
        'An unexpected error occurred while rendering this view.';

      return (
        <div className="flex min-h-[400px] w-full items-center justify-center p-6">
          <div className="w-full max-w-md rounded-xl border border-rose-200 bg-white p-6 shadow-sm dark:border-rose-900/50 dark:bg-slate-900">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/40">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
            </div>

            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{message}</p>

            {info?.suggestedAction && (
              <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                Recommendation: {info.suggestedAction}
              </p>
            )}

            {info?.incidentId && (
              <div className="mt-4 flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-slate-400" />
                  Incident Reference:
                </span>
                <code className="font-mono text-slate-700 dark:text-slate-300">{info.incidentId}</code>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-2">
              <Button variant="primary" size="sm" onClick={this.handleReset} className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                Try Again
              </Button>
              <Button variant="outline" size="sm" onClick={this.handleReload}>
                Reload Page
              </Button>
              {this.props.showHomeButton !== false && (
                <Button variant="ghost" size="sm" onClick={this.handleGoHome} className="gap-1.5">
                  <Home className="h-3.5 w-3.5" />
                  Dashboard
                </Button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
