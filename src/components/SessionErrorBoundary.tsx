"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class SessionErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[SessionErrorBoundary]", error, info.componentStack);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-xl p-8 text-center space-y-4">
            <div className="text-4xl">⚠</div>
            <h2 className="text-white text-xl font-bold">Something went wrong</h2>
            <p className="text-slate-400 text-sm">
              An unexpected error occurred during your session. Your progress has been saved.
            </p>
            {this.state.message && (
              <p className="text-slate-500 text-xs font-mono bg-slate-800 rounded p-2 text-left break-all">
                {this.state.message}
              </p>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Reload session
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
