import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#060818] p-4 text-center">
          <div className="max-w-md w-full bg-[#0d1127] border border-white/5 p-8 rounded-3xl shadow-2xl flex flex-col items-center space-y-6">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full flex items-center justify-center">
              <AlertTriangle size={32} />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">Something went wrong</h1>
              <p className="text-white/60 text-sm leading-relaxed">
                An unexpected application rendering error occurred. The developer team has been notified.
              </p>
            </div>
            {this.state.error && (
              <pre className="w-full text-left bg-black/40 border border-white/5 p-4 rounded-xl text-red-300 text-xs overflow-auto max-h-40 font-mono">
                {this.state.error.toString()}
              </pre>
            )}
            <Button
              onClick={this.handleReset}
              className="w-full rounded-2xl py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium shadow-lg shadow-blue-500/20 flex items-center justify-center space-x-2 transition-all duration-200"
            >
              <RotateCcw size={16} />
              <span>Reload Application</span>
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
