/**
 * Error Display Component
 */

export interface ErrorDisplayProps {
  error: Error | string;
  onRetry?: () => void;
  title?: string;
}

export function ErrorDisplay({ error, onRetry, title = 'An error occurred' }: ErrorDisplayProps) {
  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-6 w-6 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{errorMessage}</p>
          </div>
          {onRetry && (
            <div className="mt-4">
              <button
                type="button"
                onClick={onRetry}
                className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ErrorBoundaryFallback({ error, resetErrorBoundary }: any) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <ErrorDisplay
          error={error}
          onRetry={resetErrorBoundary}
          title="Something went wrong"
        />
      </div>
    </div>
  );
}
