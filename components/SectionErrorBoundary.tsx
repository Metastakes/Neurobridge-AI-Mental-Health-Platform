// components/SectionErrorBoundary.tsx
import React from 'react';
import ErrorBoundary from './ErrorBoundary.tsx';

interface SectionErrorFallbackProps {
    error?: Error;
    sectionName: string;
    onRetry?: () => void;
}

const SectionErrorFallback: React.FC<SectionErrorFallbackProps> = ({ error, sectionName, onRetry }) => (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
                <h3 className="font-bold text-red-800 dark:text-red-300 mb-2">
                    Error loading {sectionName}
                </h3>
                <p className="text-sm text-red-700 dark:text-red-400 mb-4">
                    This section encountered an error and couldn't load properly.
                </p>
                {import.meta.env.DEV && error && (
                    <details className="mb-3">
                        <summary className="text-xs cursor-pointer text-red-600 dark:text-red-400 hover:underline">
                            Technical details
                        </summary>
                        <p className="text-xs font-mono mt-2 text-red-700 dark:text-red-300">
                            {error.toString()}
                        </p>
                    </details>
                )}
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="text-sm px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold"
                    >
                        Retry
                    </button>
                )}
            </div>
        </div>
    </div>
);

interface SectionErrorBoundaryProps {
    children: React.ReactNode;
    sectionName: string;
    onRetry?: () => void;
}

const SectionErrorBoundary: React.FC<SectionErrorBoundaryProps> = ({ children, sectionName, onRetry }) => {
    const [key, setKey] = React.useState(0);

    const handleRetry = () => {
        setKey(prev => prev + 1);
        onRetry?.();
    };

    return (
        <ErrorBoundary
            key={key}
            fallback={<SectionErrorFallback sectionName={sectionName} onRetry={handleRetry} />}
        >
            {children}
        </ErrorBoundary>
    );
};

export default SectionErrorBoundary;
