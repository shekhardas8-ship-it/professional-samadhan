import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldCheck } from 'lucide-react';
import { firebaseCrashlytics } from '../../services/firebaseCrashlytics.ts';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  incidentId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    incidentId: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    // Report immediately to Firebase Crashlytics & Bug Scrub engine
    const report = firebaseCrashlytics.recordError(error, true, {
      componentStack: errorInfo.componentStack || undefined,
      type: 'REACT_RENDER',
    });
    this.setState({ errorInfo, incidentId: report?.id || null });
  }

  private handleReset = () => {
    localStorage.removeItem('ps_auth_user');
    window.location.href = '/';
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Something went wrong</h2>
              <p className="text-xs text-slate-400 mt-1">
                The practice engine encountered an unexpected rendering exception.
              </p>
            </div>

            {this.state.error && (
              <div className="space-y-2">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-left overflow-auto max-h-36 text-xs font-mono text-rose-300">
                  {this.state.error.toString()}
                </div>
                <div className="flex items-center justify-between text-[11px] px-2 text-slate-400">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Reported to Firebase Crashlytics</span>
                  </span>
                  {this.state.incidentId && (
                    <span className="font-mono text-slate-500">ID: {this.state.incidentId.slice(0, 18)}</span>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
              >
                <Home className="w-4 h-4" />
                <span>Return to Login</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
