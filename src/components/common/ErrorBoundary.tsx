import { Component, type ErrorInfo, type PropsWithChildren } from "react";

interface ErrorBoundaryState {
  error?: Error;
}

export class ErrorBoundary extends Component<PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = {};

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("CompileChrono panel crashed", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="m-3 border border-rose-800 bg-rose-950/30 p-3 text-xs text-rose-100">
          <div className="font-semibold">This panel hit a recoverable UI error.</div>
          <p className="mt-1 text-rose-200/80">{this.state.error.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}
