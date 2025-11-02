// components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorInfo: null
        };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        this.setState({
            error,
            errorInfo
        });

        // Call optional error handler
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        // Log to monitoring service in production
        if (import.meta.env.PROD) {
            // TODO: Send to error monitoring service (Sentry, LogRocket, etc.)
            console.error('Production error:', {
                error: error.toString(),
                componentStack: errorInfo.componentStack
            });
        }
    }

    private handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    public render() {
        if (this.state.hasError) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-900 p-4">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-xl max-w-2xl w-full">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="text-4xl">⚠️</div>
                            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">
                                Something went wrong
                            </h1>
                        </div>

                        <div className="mb-6">
                            <p className="text-gray-700 dark:text-gray-300 mb-4">
                                The application encountered an unexpected error. This has been logged and our team will investigate.
                            </p>

                            {import.meta.env.DEV && this.state.error && (
                                <details className="mb-4">
                                    <summary className="cursor-pointer text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                                        Error Details (Development Only)
                                    </summary>
                                    <div className="mt-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm">
                                        <p className="font-mono text-red-800 dark:text-red-300 mb-2">
                                            {this.state.error.toString()}
                                        </p>
                                        {this.state.errorInfo && (
                                            <pre className="text-xs text-gray-700 dark:text-gray-400 overflow-auto max-h-40">
                                                {this.state.errorInfo.componentStack}
                                            </pre>
                                        )}
                                    </div>
                                </details>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={this.handleReset}
                                className="px-6 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 font-semibold"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="px-6 py-2 bg-gray-200 dark:bg-slate-600 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-slate-500 font-semibold"
                            >
                                Return to Home
                            </button>
                        </div>

                        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                            <p className="text-sm text-blue-800 dark:text-blue-300">
                                <strong>What you can do:</strong>
                            </p>
                            <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1 list-disc list-inside">
                                <li>Refresh the page and try again</li>
                                <li>Check your internet connection</li>
                                <li>Clear your browser cache</li>
                                <li>Contact support if the problem persists</li>
                            </ul>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
