"use client";

import { Button } from "@ototabi/ui/components/button";
import { Component, type ReactNode, type ErrorInfo } from "react";

import { AlertTriangle } from "@/lib/icons";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Error boundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center bg-zinc-950 px-4 font-mono">
          <div className="max-w-md border-4 border-black bg-zinc-900 p-8 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-rose-400" />
            <h2 className="mb-2 text-lg font-black text-rose-400 uppercase">
              Something went wrong
            </h2>
            <p className="mb-6 text-xs text-zinc-400">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <Button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="rounded-none border-2 border-emerald-500 bg-emerald-500 font-bold text-black"
            >
              Reload
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
