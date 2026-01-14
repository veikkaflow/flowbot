import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center h-screen bg-[#141414] p-4">
          <div className="bg-[#1f2937] p-6 rounded-lg border border-[#374151] max-w-md w-full">
            <h2 className="text-xl font-bold text-red-500 mb-2">Jotain meni pieleen</h2>
            <p className="text-gray-300 mb-4">
              Sovelluksessa tapahtui odottamaton virhe. Päivitä sivu yrittääksesi uudelleen.
            </p>
            {this.state.error && (
              <details className="mt-4">
                <summary className="text-sm text-gray-400 cursor-pointer">Tekninen tieto</summary>
                <pre className="mt-2 text-xs text-gray-500 overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Päivitä sivu
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}


